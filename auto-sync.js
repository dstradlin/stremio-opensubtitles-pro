/**
 * Auto-sync module usando alass (Automatic Language-Agnostic Subtitle Synchronization)
 * https://github.com/kaegi/alass
 */

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const sub2vtt = require('sub2vtt');
const axios = require('axios');
const NodeCache = require('node-cache');

// Cache para resultados (evita re-processar mesma legenda)
const syncCache = new NodeCache({ stdTTL: 3600 }); // 1 hora

const ALASS_PATH = path.join(__dirname, 'alass');
const TEMP_DIR = path.join(__dirname, 'temp');

function ensureTempDir() {
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
}

/**
 * Ajusta o timing de uma legenda VTT
 * @param {string} vttContent - Conteúdo da legenda em VTT
 * @param {number} offsetMs - Offset em milissegundos (positivo = atrasa, negativo = adianta)
 * @returns {string} - Legenda com timing ajustado
 */
function adjustSubtitleTiming(vttContent, offsetMs) {
    if (!offsetMs || offsetMs === 0) {
        return vttContent;
    }
    
    const lines = vttContent.split('\n');
    const result = [];
    
    for (const line of lines) {
        // Match timestamp format: 00:00:00.000 --> 00:00:00.000
        const timestampMatch = line.match(/(\d{2}:\d{2}:\d{2})\.(\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2})\.(\d{3})/);
        
        if (timestampMatch) {
            const [, startH, startMs, endH, endMs] = timestampMatch;
            
            // Converte para milissegundos
            const startTotal = parseInt(startH) * 3600000 + 
                              parseInt(startH.split(':')[1]) * 60000 + 
                              parseInt(startH.split(':')[2]) * 1000 + 
                              parseInt(startMs);
            
            const endTotal = parseInt(endH) * 3600000 + 
                            parseInt(endH.split(':')[1]) * 60000 + 
                            parseInt(endH.split(':')[2]) * 1000 + 
                            parseInt(endMs);
            
            // Aplica offset
            const newStart = Math.max(0, startTotal + offsetMs);
            const newEnd = Math.max(0, endTotal + offsetMs);
            
            // Converte de volta para formato VTT
            const formatTime = (ms) => {
                const hours = Math.floor(ms / 3600000);
                const minutes = Math.floor((ms % 3600000) / 60000);
                const seconds = Math.floor((ms % 60000) / 1000);
                const millis = ms % 1000;
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
            };
            
            result.push(`${formatTime(newStart)} --> ${formatTime(newEnd)}`);
        } else {
            result.push(line);
        }
    }
    
    return result.join('\n');
}

/**
 * Baixa arquivo para path temporário
 */
async function downloadToTemp(url, filename) {
    const dest = path.join(TEMP_DIR, filename);
    
    if (fs.existsSync(dest)) {
        fs.unlinkSync(dest);
    }
    
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: 60000
    });
    
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(dest);
        response.data.pipe(writer);
        
        writer.on('finish', () => resolve(dest));
        writer.on('error', reject);
    });
}

/**
 * Baixa apenas os primeiros N segundos de áudio do vídeo
 */
async function extractAudioSnippet(videoUrl, outputPath, durationSeconds = 30) {
    const ffmpegPath = '/usr/bin/ffmpeg';
    
    // Verifica se ffmpeg existe
    if (!fs.existsSync(ffmpegPath)) {
        throw new Error('ffmpeg not found');
    }
    
    const args = [
        '-i', videoUrl,
        '-ss', '0',
        '-t', durationSeconds.toString(),
        '-vn',
        '-acodec', 'pcm_s16le',
        '-ar', '16000',
        '-ac', '1',
        outputPath
    ];
    
    try {
        const result = spawnSync(ffmpegPath, args, { encoding: 'utf8', timeout: 120000 });
        
        if (result.error) {
            throw result.error;
        }
        
        if (!fs.existsSync(outputPath)) {
            throw new Error('Audio extraction failed');
        }
        
        return outputPath;
    } catch (err) {
        console.error('FFmpeg error:', err.message);
        throw err;
    }
}

/**
 * Converte VTT para SRT (alass só suporta SRT, SSA, ASS)
 */
function vttToSrt(vttContent) {
    // Simple VTT to SRT conversion
    let srt = vttContent
        .replace(/WEBVTT/g, '')
        .replace(/\n-->\n/g, ' --> ')
        .replace(/\r\n/g, '\n')
        .replace(/\n\n/g, '\n');
    
    // Renumber
    const lines = srt.split('\n');
    let srtNumber = 1;
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.match(/\d{2}:\d{2}:\d{2}\.\d{3}/)) {
            newLines.push(srtNumber.toString());
            srtNumber++;
        }
        
        newLines.push(line);
    }
    
    return newLines.join('\n');
}

/**
 * Converte SRT para VTT
 */
function srtToVtt(srtContent) {
    return 'WEBVTT\n\n' + srtContent
        .replace(/(\d{2}:\d{2}:\d{2})\.(\d{3}) --> (\d{2}:\d{2}:\d{2})\.(\d{3})/g, 
            '$1.$2 --> $3.$4');
}

/**
 * Executa alass para sincronizar legenda com vídeo
 */
function runAlass(audioPath, subtitlePath, outputPath) {
    if (!fs.existsSync(ALASS_PATH)) {
        throw new Error('Alass binary not found');
    }
    
    const args = [
        '--no-splits',      // Só offset, sem corrigir splits
        '--split-penalty', '100',  // Alta penalty para evitar splits
        audioPath,
        subtitlePath,
        outputPath
    ];
    
    console.log('Running alass...');
    
    try {
        const result = spawnSync(ALASS_PATH, args, {
            encoding: 'utf8',
            timeout: 60000
        });
        
        if (result.error) {
            throw result.error;
        }
        
        console.log('Alass output:', result.stdout);
        
        if (!fs.existsSync(outputPath)) {
            throw new Error('Alass failed to produce output');
        }
        
        return fs.readFileSync(outputPath, 'utf8');
    } catch (err) {
        console.error('Alass error:', err.message);
        throw err;
    }
}

/**
 * Limpa arquivos temporários
 */
function cleanupTempFiles(files) {
    for (const file of files) {
        try {
            if (file && fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        } catch (err) {
            console.error('Cleanup error:', err.message);
        }
    }
}

/**
 * Auto-sync de legenda usando alass
 * @param {string} videoUrl - URL do vídeo
 * @param {string} subtitleUrl - URL da legenda original
 * @param {boolean} autoSync - Se deve usar auto-sync
 * @returns {string|null} - Legenda sincronizada em VTT ou null
 */
async function autoSyncSubtitle(videoUrl, subtitleUrl, autoSync = false) {
    if (!autoSync) {
        return null;
    }
    
    // Verifica cache
    const cacheKey = `${Buffer.from(videoUrl).toString('base64')}_${Buffer.from(subtitleUrl).toString('base64')}`;
    const cached = syncCache.get(cacheKey);
    if (cached) {
        console.log('Using cached sync result');
        return cached;
    }
    
    // Verifica se alass existe
    if (!fs.existsSync(ALASS_PATH)) {
        console.log('Alass not available, skipping auto-sync');
        return null;
    }
    
    ensureTempDir();
    
    const tempFiles = [];
    
    try {
        // 1. Baixa primeiro 30 segundos de áudio do vídeo
        console.log('Extracting audio snippet from video...');
        const audioPath = path.join(TEMP_DIR, `audio_${Date.now()}.wav`);
        tempFiles.push(audioPath);
        
        await extractAudioSnippet(videoUrl, audioPath, 30);
        
        // 2. Baixa a legenda
        console.log('Downloading subtitle...');
        const subPath = path.join(TEMP_DIR, `sub_${Date.now()}.srt`);
        tempFiles.push(subPath);
        
        const subResponse = await axios.get(subtitleUrl);
        let srtContent = vttToSrt(subResponse.data);
        fs.writeFileSync(subPath, srtContent);
        
        // 3. Executa alass
        console.log('Running auto-sync...');
        const outputPath = path.join(TEMP_DIR, `output_${Date.now()}.srt`);
        tempFiles.push(outputPath);
        
        const syncedSrt = runAlass(audioPath, subPath, outputPath);
        
        // 4. Converte de volta para VTT
        const syncedVtt = srtToVtt(syncedSrt);
        
        // 5. Salva no cache
        syncCache.set(cacheKey, syncedVtt);
        
        console.log('Auto-sync completed successfully!');
        
        return syncedVtt;
        
    } catch (err) {
        console.error('Auto-sync failed:', err.message);
        return null;
        
    } finally {
        // Limpa arquivos temporários
        cleanupTempFiles(tempFiles);
    }
}

module.exports = {
    adjustSubtitleTiming,
    autoSyncSubtitle
};
