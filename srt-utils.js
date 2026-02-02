/**
 * SRT Parser Utilities
 * Parse e stringify de legendas SRT
 */

function parseSRT(content) {
    const cues = [];
    const lines = content.replace(/\r\n/g, '\n').split('\n');

    let i = 0;
    while (i < lines.length) {
        // Skip empty lines and numeric indices
        while (i < lines.length && (lines[i].trim() === '' || /^\d+$/.test(lines[i].trim()))) {
            i++;
        }

        if (i >= lines.length) break;

        // Parse timestamp line
        const timestampMatch = lines[i].match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);

        if (!timestampMatch) {
            i++;
            continue;
        }

        const startMs = parseTime(timestampMatch[1], timestampMatch[2], timestampMatch[3], timestampMatch[4]);
        const endMs = parseTime(timestampMatch[5], timestampMatch[6], timestampMatch[7], timestampMatch[8]);

        i++;

        // Parse text
        let text = '';
        while (i < lines.length && lines[i].trim() !== '') {
            text += (text ? '\n' : '') + lines[i].trim();
            i++;
        }

        cues.push({
            start: startMs,
            end: endMs,
            text: text
        });

        i++; // Skip empty line
    }

    return cues;
}

function parseTime(h, m, s, ms) {
    return parseInt(h) * 3600000 + parseInt(m) * 60000 + parseInt(s) * 1000 + parseInt(ms);
}

function formatTime(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const mss = ms % 1000;

    return `${pad(h)}:${pad(m)}:${pad(s)},${pad(mss, 3)}`;
}

function pad(num, size = 2) {
    return num.toString().padStart(size, '0');
}

function stringifySRT(cues) {
    return cues.map((cue, index) => {
        return `${index + 1}\n${formatTime(cue.start)} --> ${formatTime(cue.end)}\n${cue.text}\n`;
    }).join('\n');
}

module.exports = {
    parseSRT,
    stringifySRT
};
