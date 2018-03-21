'use strict';
const timers = require('timers');
const mpcIPC = require('mpc-ipc');

const defaultConfig = {
        name: 'MPC-HC',
        enabled: true,
        host: 'localhost',
        port: 13579,
        probeInterval: 5000,
};

function setup(player, config, nene) {
        const mpc = new mpcIPC.MediaPlayerClassicClient({ host: config.host, port: config.port });
        timers.setInterval(() => {
                mpc.getFile().then(
                        name => { nene.setStatus(name, player); },
                        err =>  { nene.clearStatus(player); }
                );
        }, config.probeInterval);
        return mpc;
}

module.exports = { setup, defaultConfig };
