/**
 * MovieHash Implementation
 * Calcula o hash de um arquivo de vídeo para encontrar legendas específicas
 * Baseado no algoritmo do OpenSubtitles
 */

const fs = require('fs');
const crypto = require('crypto');

async function calculateMovieHash(filePath) {
    return new Promise((resolve, reject) => {
        try {
            const fileSize = fs.statSync(filePath).size;
            const chunkSize = 64 * 1024; // 64KB chunks
            const positions = [
                0,
                Math.min(chunkSize, fileSize),
                Math.max(fileSize - chunkSize, chunkSize),
                fileSize - 1
            ];

            let hash = crypto.createHash('md5');
            let chunksProcessed = 0;

            const readChunk = (position) => {
                if (position >= positions.length) {
                    resolve(hash.digest('hex'));
                    return;
                }

                const fd = fs.openSync(filePath, 'r');
                const chunk = Buffer.alloc(Math.min(chunkSize, fileSize - position));
                fs.readSync(fd, chunk, 0, chunk.length, position);
                fs.closeSync(fd);

                hash.update(chunk);
                chunksProcessed++;
                readChunk(position + chunkSize);
            };

            // Read 8 bytes from specific positions
            let buffer = Buffer.alloc(8);
            const chunkSize64KB = 64 * 1024;

            // Position 0: 64KB
            // Position 1: 64KB from end
            // Position 2: End - 64KB
            // Position 3: Last 8 bytes

            const positions64 = [
                0,
                Math.min(chunkSize64KB, fileSize),
                Math.max(fileSize - chunkSize64KB, chunkSize64KB),
                fileSize - 8
            ];

            let finalHash = crypto.createHash('md5');

            const processPosition = async (index) => {
                if (index >= positions64.length) {
                    resolve(finalHash.digest('hex'));
                    return;
                }

                const pos = positions64[index];
                if (pos < fileSize) {
                    const fd = fs.openSync(filePath, 'r');
                    const bytesToRead = Math.min(8, fileSize - pos);
                    const buf = Buffer.alloc(bytesToRead);
                    fs.readSync(fd, buf, 0, bytesToRead, pos);
                    fs.closeSync(fd);
                    finalHash.update(buf);
                }
                processPosition(index + 1);
            };

            processPosition(0);

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Calcula movie hash de forma simplificada para URLs/streams
 * Usa tamanho do arquivo + bytes específicos
 */
async function calculateMovieHashFromInfo(fileSize, firstChunk, lastChunk) {
    let hash = crypto.createHash('md5');

    if (firstChunk) hash.update(firstChunk);
    if (lastChunk) hash.update(lastChunk);

    hash.update(Buffer.from(fileSize.toString()));

    return hash.digest('hex');
}

module.exports = {
    calculateMovieHash,
    calculateMovieHashFromInfo
};
