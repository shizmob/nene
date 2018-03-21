'use strict';
const timers = require('timers');
const mpcIPC = require('mpc-ipc');

function setup(player, config, nene) {
	/* Setup MPC-HC. */
	const mpc = new mpcIPC.MediaPlayerClassicClient({ host: config.host, port: config.port });
	timers.setInterval(() => {
	mpc.getFile()
		.then(name => { nene.setStatus(name, player); })
		.catch(err => { nene.clearStatus(player); });
	}, config.probeInterval);
	return mpc;
}

module.exports = setup;
