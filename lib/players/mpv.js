'use strict';
const timers = require('timers');
const util = require('../util');
const mpvIPC = require('mpv-ipc');

const defaultConfig = {
        name: 'mpv',
        socketFile: '/tmp/mpv.sock',
};

function setup(player, config, nene) {
	const mpv = new mpvIPC.MPVClient(util.reconnectingSocket(config.socketFile));
	mpv.on('connect', () => {
                mpv.observeMediaTitle(name => { nene.setStatus(name, player); });
                mpv.onEndFile(e => { nene.clearStatus(player, true); });
                /* Give mpv half a second to load the file and get the initial title. */
                timers.setTimeout(() => mpv.getMediaTitle().then(name => { nene.setStatus(name, player); }).catch(e => {}), 500);
	});
	mpv.on('close', e => { nene.clearStatus(player); });
	return mpv;
}

module.exports = { setup, defaultConfig };
