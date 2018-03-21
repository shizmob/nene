'use strict';
const timers = require('timers');
const VLC = require('vlc-remote');

function setup(player, config, nene) {
        /* Setup VLC. */
	const vlc = new VLC(config.port, config.host);
	timers.setInterval(() => {
		vlc.get_title((err, body) => {
			if (err) nene.clearStatus(player);
			else nene.setStatus(body, player);
		});
	}, config.probeInterval);
	return vlc;
}

module.exports = setup;
