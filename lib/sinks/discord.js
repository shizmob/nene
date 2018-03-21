'use strict';
const discordRPC = require('discord-rpc');

function setup(sink, config, nene) {
        const discord = new discordRPC.Client({ transport: "ipc" });
        discord.login(config.clientID);
        discord.on('ready', () => {
        	discord.request('SET_ACTIVITY', { pid: process.pid });
        });
        nene.on('started', (source, title, ep) => {
	        discord.setActivity({
			details: title,
			state: ep ? " Episode " + ep : "  ",
			startTimestamp: new Date(),
			largeImageKey: nene.exportConfig()[source].imageID || config.imageID
		});
        });
        nene.on('stopped', (source, wasMain, error) => {
	        /* discord.js/RPC contains a bug where you can't clear the activity,
	         * so invoke the appropriate request manually */
                if (wasMain) {
                        discord.request('SET_ACTIVITY', { pid: process.pid });
                }
        });
        return discord;
}

module.exports = setup;
