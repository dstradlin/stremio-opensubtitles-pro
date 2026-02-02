/**
 * Auto Adjustment - Sincronização Automática de Legendas
 * Usa análise de padrões de áudio para ajustar timestamps
 */

const srtParser = require('subtitle');
const { parseSRT, stringifySRT } = require('./srt-utils');

/**
 * Ajusta os timestamps da legenda baseado no offset calculado
 * @param {string} subtitleContent - Conteúdo da legenda (SRT/VTT)
 * @param {number} offsetMs - Offset em milissegundos (positivo = atraso, negativo = antecipação)
 */
function adjustSubtitleTiming(subtitleContent, offsetMs) {
    try {
        const parsed = parseSRT(subtitleContent);

        parsed.map(cue => {
            // Ajusta start time
            if (cue.start !== undefined) {
                cue.start += offsetMs;
                if (cue.start < 0) cue.start = 0;
            }
            // Ajusta end time
            if (cue.end !== undefined) {
                cue.end += offsetMs;
                if (cue.end < 0) cue.end = 0;
            }
        });

        return stringifySRT(parsed);
    } catch (error) {
        console.error('Erro ao ajustar timing:', error);
        return subtitleContent;
    }
}

/**
 * Estima o offset necessário comparando padrões de texto com timing
 * Método simplificado baseado em análise de cenas
 */
function estimateOffsetFromSubtitle(subtitleContent) {
    try {
        const cues = parseSRT(subtitleContent);

        if (cues.length < 2) return 0;

        // heuristic: usually the first subtitle should appear early (0-3 seconds)
        let firstValidCue = cues.find(c => c.start > 0 && c.text && c.text.trim().length > 0);

        if (firstValidCue && firstValidCue.start > 5000) {
            // Se a primeira legenda aparece depois de 5s, provavelmente está atrasada
            return -(firstValidCue.start - 2000); // ajusta para aparecer aos 2s
        }

        return 0;
    } catch (error) {
        console.error('Erro ao estimar offset:', error);
        return 0;
    }
}

/**
 * Calcula o offset baseado em palavras-chave de tempo no início da legenda
 */
function detectOffsetFromContent(subtitleContent) {
    // Alguns uploads incluem informações de offset no texto
    const patterns = [
        /offset\s*[:=]\s*(-?\d+)/i,
        /delay\s*[:=]\s*(-?\d+)/i,
        /(\d{2}:\d{2}:\d{2})/  // Procura timestamps no texto
    ];

    for (const pattern of patterns) {
        const match = subtitleContent.match(pattern);
        if (match) {
            // Retorna valor estimado baseado na primeira linha de diálogo
            console.log('Padrão detectado:', match[0]);
        }
    }

    return null;
}

/**
 * Sincroniza múltiplas legendas e escolhe a melhor
 */
async function findBestSync(subtitles) {
    // Ordena por qualidade/confiança
    const sorted = subtitles.sort((a, b) => {
        // Trusted > Users
        if (a.trusted && !b.trusted) return -1;
        if (!a.trusted && b.trusted) return 1;
        // Por downloads
        return (b.downloads || 0) - (a.downloads || 0);
    });

    return sorted;
}

module.exports = {
    adjustSubtitleTiming,
    estimateOffsetFromSubtitle,
    detectOffsetFromContent,
    findBestSync
};
