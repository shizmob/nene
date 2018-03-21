'use strict';
const mpv = require('./mpv');
const vlc = require('./vlc');
const mpc = require('./mpc');

const players = { mpv, vlc, mpc };

function registerAllPlayers(nene, config) {
        for (let name in players) {
                const player = players[name];
                config[name] = config[name] || player.defaultConfig;
                if (!config[name].enabled) {
                        continue;
                }
                const client = player.setup(name, config[name], nene);
                if (client) {
                        nene.addPlayer(name, client);
                }
        }
}

module.exports = { players, registerAllPlayers };
