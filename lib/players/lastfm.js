'use strict';
const timers = require('timers');
const lfm = require('lastfm');

const defaultConfig = {
        name: 'Last.FM',
        enabled: true,
        apiKey: null,
        secret: null,
        username: null,
};

function setup(player, config, nene) {
        if (!config.apiKey || !config.secret || !config.username) {
            console.log('[!!] lastfm: no API key, secret or username defined');
            return null;
        }

        const lastfm = new lfm.LastFmNode({
                api_key: config.apiKey,
                secret: config.secret,
                useragent: 'nene'
        });
        const stream = lastfm.stream(config.username);
        stream.on('nowPlaying', (track) => {
                if (!track) return;
                nene.setStatus({ title: track.artist['#text'], ep: track.name }, player, 'music');
        });
        stream.on('stoppedPlaying', (track) => {
                nene.clearStatus(player);
        });
        stream.start();
        return { lastfm, stream };
}

module.exports = { setup, defaultConfig };
