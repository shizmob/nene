'use strict';
const mpv = require('./mpv');
const vlc = require('./vlc');
const mpc = require('./mpc');

const players = { mpv, vlc, mpc };

function registerAllPlayers(nene, config) {
        for (let name in players) {
                const setup = players[name];
                const client = setup(name, config[name], nene);
                if (client) {
                        nene.addPlayer(name, client);
                }
        }
}

module.exports = { players, registerAllPlayers };
