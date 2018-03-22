'use strict';
const defaultConfig = {
        name: 'Console',
        enabled: true,
};

function setup(sink, config, nene) {
        nene.setActive(sink, 'sink');
        nene.on('ready', config => console.log('[>>] ready to roll'));
        nene.on('paused', () => console.log('[||] on halt'));
        nene.on('started', (source, title, ep)      => console.log(`[ ^] started [${source}]: ${title}` + (ep ? ` - episode ${ep}` : '')));
        nene.on('stopped', (source, error, wasMain) => console.log(`[ $] stopped [${source}] ` + (wasMain ? '[main] ' : '') + (error ? '[error]' : '')));
        nene.on('player-active', (source) => console.log(`[->] activated [${source}]`));
        nene.on('player-inactive', (source) => console.log(`[<-] deactivated [${source}]`));
        nene.on('sink-active', (source) => console.log(`[->] activated [${source}]`));
        nene.on('sink-inactive', (source) => console.log(`[<-] deactivated [${source}]`));
}

module.exports = { setup, defaultConfig };
