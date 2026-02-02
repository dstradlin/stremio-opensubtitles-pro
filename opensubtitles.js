const opensub = require('./opensubtitlesAPI.js');
const config = require('./config');
require('dotenv').config();
const sub2vtt = require('sub2vtt');
const languages = require('./languages.json');
const count = 10;
const NodeCache = require("node-cache");
const Cache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const MetaCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const OpenSubCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const HashCache = new NodeCache({ stdTTL: (1 * 60 * 60), checkperiod: (1 * 60 * 60) });

/**
 * Busca legendas com suporte a MovieHash e Auto Adjustment
 * @param {string} type - 'movie' ou 'series'
 * @param {string} id - ID do IMDb
 * @param {string} lang - Idioma configurado
 * @param {object} options - Opções adicionais
 * @param {string} options.movieHash - Hash do arquivo de vídeo
 * @param {boolean} options.autoAdjust - Se deve aplicar ajuste automático
 */
async function subtitles(type, id, lang, options = {}) {
    try {
        const { movieHash = null, autoAdjust = false } = options;

        var imdb_id, season, episode;
        if (type == "series") {
            imdb_id = id.split(":")[0];
            season = id.split(":")[1];
            episode = id.split(":")[2]
        } else {
            imdb_id = id;
            season = "1";
            episode = "1";
        }

        const cacheKey = `${id}_${lang}_${movieHash || 'nohash'}_${autoAdjust}`;
        let cached = Cache.get(cacheKey);
        if (cached) {
            console.log('cached', cacheKey);
            return cached;
        }

        var meta = MetaCache.get(id);
        if (!meta) {
            meta = await opensub.getOpenSubData(imdb_id);
            if (meta) {
                MetaCache.set(id, meta);
            } else {
                throw "error getting meta";
            }
        }

        var subtitleslist = OpenSubCache.get(id);
        if (!subtitleslist) {
            subtitleslist = await opensub.getsubs(imdb_id, meta.id, type, season, episode);
            if (subtitleslist) {
                OpenSubCache.set(id, subtitleslist);
            } else {
                throw "error getting subtitles";
            }
        }

        if (subtitleslist?.[lang]) {
            let subtitles = subtitleslist[lang];

            // Se temos movieHash, tenta filtrar/priorizar legendas específicas
            if (movieHash) {
                subtitles = filterByMovieHash(subtitles, movieHash);
            }

            const subs = [];
            for (let i = 0; i < subtitles.length; i++) {
                let value = subtitles[i];
                if (value) {
                    let link = value.url;

                    proxy = {
                        BaseURL: config.BaseURL,
                        "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'
                    };

                    let url = config.local + "/sub.vtt?" + sub2vtt.gerenateUrl(link, proxy);

                    // Adiciona parâmetro de auto-adjust se habilitado
                    if (autoAdjust) {
                        url += "&auto=1";
                    }

                    subs.push({
                        lang: languages[lang].iso || languages[lang].id,
                        id: `${cacheKey}_${i}`,
                        url: url,
                        meta: {
                            movieHashMatch: value.movieHashMatch || false,
                            trusted: value.trusted || false,
                            downloads: value.downloaded || 0
                        }
                    });
                }
            }

            console.log('subs', subs.length);
            if (subs) Cache.set(cacheKey, subs);
            return subs;
        } else {
            throw "error";
        }

    } catch (e) {
        console.error(e);
    }
}

/**
 * Filtra legendas pelo movieHash
 * Prioriza legendas que têm o hash correspondente
 */
function filterByMovieHash(subtitles, targetHash) {
    if (!targetHash || !subtitles || subtitles.length === 0) {
        return subtitles;
    }

    console.log('Filtrando por movieHash:', targetHash);

    // Separa em dois grupos: com hash match e sem hash match
    const withHash = [];
    const withoutHash = [];

    for (const sub of subtitles) {
        if (sub.movie_hash === targetHash) {
            sub.movieHashMatch = true;
            withHash.push(sub);
        } else {
            sub.movieHashMatch = false;
            withoutHash.push(sub);
        }
    }

    // Log para debug
    if (withHash.length > 0) {
        console.log(`Encontradas ${withHash.length} legendas com hash match`);
    }

    // Retorna com hash primeiro, depois sem hash
    return [...withHash, ...withoutHash];
}

module.exports = subtitles;
