#!/usr/bin/env node
/**
 * Script para baixar o binário do alass (Automatic Language-Agnostic Subtitle Synchronization)
 * https://github.com/kaegi/alass
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ALASS_VERSION = 'v2.2.0';
const ALASS_URL = `https://github.com/kaegi/alass/releases/download/${ALASS_VERSION}/alass-cli-linux-x64`;
const ALASS_PATH = path.join(__dirname, 'alass');

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        console.log(`Downloading ${url}...`);
        
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Redirect
                downloadFile(response.headers.location, dest)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded to ${dest}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function setupAlass() {
    if (process.env.SKIP_ALASS_DOWNLOAD === 'true') {
        console.log('SKIP_ALASS_DOWNLOAD set, skipping alass download');
        return;
    }
    
    if (fs.existsSync(ALASS_PATH)) {
        console.log('Alass already exists');
        return;
    }
    
    try {
        await downloadFile(ALASS_URL, ALASS_PATH);
        fs.chmodSync(ALASS_PATH, '755');
        console.log('Alass installed successfully!');
    } catch (err) {
        console.error('Failed to download alass:', err.message);
        console.log('Auto-sync will be disabled');
    }
}

setupAlass();
