const express = require("express");
const app = express();
const cors = require('cors');
const path = require('path');
const Subtitles = require('./opensubtitles.js');
const manifest = require("./manifest.json");
const languages = require('./languages.json');
var serveIndex = require('serve-index');
const sub2vtt = require('sub2vtt');


app.set('trust proxy', true)

app.use('/configure', express.static(path.join(__dirname, 'vue', 'dist')));
app.use('/assets', express.static(path.join(__dirname, 'vue', 'dist', 'assets')));

app.use('/logs',
	(req, res, next) => {
		res.set('Cache-Control', 'no-store');
		next();
	},
	express.static(path.join(__dirname, 'logs'), {etag: false }),
	serveIndex('logs', { 'icons': true, 'view': 'details' })
)

app.use(cors())


app.get('/', (_, res) => {
	res.redirect('/configure')
	res.end();
});

app.get('/:configuration?/configure', (req, res) => {
	res.setHeader('Cache-Control', 'max-age=86400,staleRevalidate=stale-while-revalidate, staleError=stale-if-error, public');
	res.setHeader('content-type', 'text/html');
	res.sendFile(path.join(__dirname, 'vue', 'dist', 'index.html'));
});

app.get('/manifest.json', (_, res) => {
	res.setHeader('Cache-Control', 'max-age=86400, public');
	res.setHeader('Content-Type', 'application/json');
	manifest.behaviorHints.configurationRequired = true;
	res.send(manifest);
	res.end();
});

app.get('/:configuration?/manifest.json', (_, res) => {
	res.setHeader('Cache-Control', 'max-age=86400, public');
	res.setHeader('Content-Type', 'application/json');
	manifest.behaviorHints.configurationRequired = false;
	res.send(manifest);
	res.end();
});

app.get('/:configuration?/:resource/:type/:id/:extra?.json', async (req, res) => {
	res.setHeader('Cache-Control', 'max-age=86400, public');
	res.setHeader('Content-Type', 'application/json');
	var subtitles = [];
	console.log(req.params);
	const { configuration, resource, type, id, extra } = req.params;

	// Parse configuration and query parameters
	let lang = null;
	let movieHash = req.query.hash || null;
	let autoAdjust = req.query.auto === '1';

	// Get language from path or query param
	if (configuration && configuration !== "subtitles" && configuration !== "sub.vtt") {
		if (languages[configuration]) {
			lang = configuration;
		} else if (configuration.includes('=')) {
			// Old format compatibility: lang=por
			const configParts = configuration.split('&');
			for (const part of configParts) {
				if (part.startsWith('lang=') && languages[part.split('=')[1]]) {
					lang = part.split('=')[1];
				}
			}
		}
	}

	// Also check query param for language
	if (!lang && req.query.lang && languages[req.query.lang]) {
		lang = req.query.lang;
	}

	if (lang) {
		try {
			subtitles = await Subtitles(type, id, lang, { movieHash, autoAdjust });
		} catch (error) {
			console.error(error);
			subtitles = [];
		}
	}
	console.log('subtitles', subtitles)
	subtitles = subtitles ? JSON.stringify({ subtitles: subtitles }) : JSON.stringify({ subtitles: {} })
	res.send(subtitles);
	res.end();
})

app.get('/sub.vtt', async (req, res) => {
	try {
		res.setHeader('Cache-Control', 'max-age=86400,staleRevalidate=stale-while-revalidate, staleError=stale-if-error, public');
		
		let url, proxy;
		let autoAdjust = req.query.auto === '1';
		let autoSync = req.query.autosync === '1';
		let offsetMs = parseInt(req.query.offset) || 0;
		let videoUrl = req.query.video || null;

		if (req?.query?.proxy) proxy = JSON.parse(Buffer.from(req.query.proxy, 'base64').toString());
		if (req?.query?.from) url = req.query.from;
		else throw 'error: no url';

		console.log("url", url, "proxy", proxy, "autoAdjust", autoAdjust, "autoSync", autoSync, "offset", offsetMs);
		
		generated = sub2vtt.gerenateUrl(url, { referer: "someurl" });
		console.log(generated);
		
		let sub = new sub2vtt(url, proxy);
		let file = await sub.getSubtitle();

		if (!file?.subtitle) throw file.status;

		// AUTO-SYNC: Usa alass para sincronizar automaticamente
		if (autoSync && videoUrl) {
			console.log('Attempting auto-sync with alass...');
			const { autoSyncSubtitle } = require('./auto-sync');
			const syncedSubtitle = await autoSyncSubtitle(videoUrl, url, true);
			
			if (syncedSubtitle) {
				console.log('Auto-sync successful!');
				file.subtitle = syncedSubtitle;
			} else {
				// Fallback para offset manual
				console.log('Auto-sync failed, using manual offset');
				if (autoAdjust || offsetMs !== 0) {
					const { adjustSubtitleTiming } = require('./auto-sync');
					file.subtitle = adjustSubtitleTiming(file.subtitle, offsetMs || 2000);
				}
			}
		} 
		// MANUAL ADJUST: offset simples
		else if (autoAdjust || offsetMs !== 0) {
			const { adjustSubtitleTiming } = require('./auto-sync');
			file.subtitle = adjustSubtitleTiming(file.subtitle, offsetMs || 2000);
		}

		res.setHeader('Content-Type', 'text/vtt;charset=UTF-8');
		res.end(file.subtitle);
		res.end();

	} catch (err) {
		res.setHeader('Content-Type', 'application/json');
		res.end();
		console.error(err);
	}
})

/**
 * Endpoint para calcular movieHash de um arquivo
 * POST /moviehash
 * Body: { url: "..." } ou { size: number, firstBytes: "...", lastBytes: "..." }
 */
app.post('/moviehash', express.json(), async (req, res) => {
	try {
		const { url, size, firstBytes, lastBytes } = req.body;

		if (url) {
			// Para arquivos remotos, usamos o tamanho e bytes
			// Nota: não podemos calcular hash real sem acesso ao arquivo
			res.json({
				success: false,
				error: 'Remote file hash calculation not supported via URL. Provide file size and bytes.'
			});
		} else if (size && firstBytes && lastBytes) {
			const { calculateMovieHashFromInfo } = require('./moviehash');
			const hash = await calculateMovieHashFromInfo(
				size,
				Buffer.from(firstBytes, 'hex'),
				Buffer.from(lastBytes, 'hex')
			);
			res.json({ hash, size });
		} else {
			res.json({ success: false, error: 'Missing parameters' });
		}
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
})


module.exports = app
