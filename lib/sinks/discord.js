'use strict';
const timers = require('timers');
const discordRPC = require('discord-rpc');

const defaultConfig = {
        name: 'Discord',
        enabled: true,
        clientID: '421361421356630036',
        reconnectInterval: 5000
};


function setup(sink, config, nene) {
        const discord = new discordRPC.Client({ transport: "ipc" });
        let timeout = null;

        const setActivity = (source, current) => {
                let details, state;
                if (current.type == 'music') {
                        details = `${current.ep}` || '  ';
                        state = `${current.title}` || '  ';
                } else {
                        details = current.title;
                        state = ep ? ` Episode ${current.ep}` : '  ';
                }
                discord.setActivity({
                        details: details,
                        state: state,
                        startTimestamp: new Date(),
                        largeImageKey: `${source}_logo`
                });
        };
        const clearActivity = (source, error, wasMain) => {
                /* discord.js/RPC contains a bug where you can't clear the activity,
                 * so invoke the appropriate request manually */
                if (wasMain) {
                        discord.request('SET_ACTIVITY', { pid: process.pid });
                }
        };

        const setReconnect = () => {
                timeout = timers.setInterval(() => discord.login(config.clientID), config.reconnectInterval);
        };
        const clearReconnect = () => {
                if (timeout) {
                        timers.clearInterval(timeout);
                        timeout = null;
                }
        }

        discord.login(config.clientID).catch(e => setReconnect());
        discord.on('ready', () => {
                clearActivity(null, true, false);
                clearReconnect();
                nene.on('started', setActivity);
                nene.on('stopped', clearActivity);
                nene.setActive(sink, 'sink');
        });
        discord.transport.on('close', () => {
                setReconnect();
                nene.removeListener('started', setActivity);
                nene.removeListener('stopped', clearActivity);
                nene.clearActive(sink, 'sink');
        });

        return discord;
}

module.exports = { setup, defaultConfig };
