'use strict';
const timers = require('timers');
const net = require('net');
const mpvIPC = require('mpv-ipc');

function reconnectingSocket(...args) {
        const s = net.connect(...args);
        var interval = null;

        function setTimer() {
                clearTimer();
                interval = timers.setInterval(() => s.connect(...args), 5000);
        }

        function clearTimer() {
                if (interval) {
                        timers.clearInterval(interval);
                        interval = null;
                }
        }

        s.on('connect', clearTimer);
        s.on('error', (e) => { /* console.log(e); */ });
        s.on('close', setTimer);

        return s;
}

function setup(player, config, nene) {
        /* Setup mpv; */
	const mpv = new mpvIPC.MPVClient(reconnectingSocket(config.socketFile));
	mpv.on('connect', () => {
		mpv.onEndFile(e => { nene.clearStatus(player, true); });
		mpv.observeMediaTitle(name => { nene.setStatus(name, player); });
                mpv.getMediaTitle().then(name => { nene.setStatus(name, player); }).catch(e => {});
	});
	mpv.on('close', e => { nene.clearStatus(player); });
	return mpv;
}

module.exports = setup;
