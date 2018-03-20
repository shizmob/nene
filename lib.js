'use strict';
const net = require('net');
const timers = require('timers');
const EventEmitter = require('events');

const discordRPC = require('discord-rpc');
const mpvIPC = require('mpv-ipc');
const VLC = require('vlc-remote');
const mpcIPC = require('mpc-ipc');


const defaultConfig = {
        discord: {
                clientID: "421361421356630036",
                imageID: "iina_logo"
        },
        mpv: {
                socketFile: "/tmp/mpv.sock",
                imageID: "iina_logo"
        },
        vlc: {
                host: 'localhost',
                port: 8084,
                probeInterval: 5000,
                imageID: "vlc_logo"
        },
        mpc: {
                host: 'localhost',
                port: 13579,
                probeInterval: 5000,
                imageID: "mpc_logo"
        }
};

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



class Nene extends EventEmitter {

	constructor(config) {
                super();
		this.config = config || defaultConfig;
		this.current = {
		        title: null,
		        ep: null,
		        source: null
		};
		this.players = {};
                this.sinks = {};
		this.active = new Set();
	}

	start() {
                this.emit('ready', this.config);
	}

	addPlayer(name, client) {
		this.players[name] = client;
	}

	removePlayer(name) {
		delete this.players[name];
	}
        
        addSink(name, client) {
                this.sinks[name] = client;
        }
        
        removeSink(name) {
                delete this.sinks[name];
        }

	setStatus(title, source) {
        	if (!title) {
                	return this.clearStatus(source, true);
	        }
		if (!this.active.has(source)) {
                        this.active.add(source);
                        this.emit('client-active', source);
                }

	        /* Clean up underscores, strip extensions and extra group/release tags. */
	        if (!title.includes(' ')) {
	                title = title.replace('_', ' ');
	        }
	        for (let pattern of [/\.[a-zA-Z0-9]+$/, /^\[[^\]]+\]\s*/, /\s*\[[^\]]+\]$/]) {
	                while (title.match(pattern)) {
        	                title = title.replace(pattern, '');
	                }
	        }

	        /* Try to extract episode. */
	        let ep = null;
	        const m = title.match(/ - ([0-9SEPp]+(?: - [^-]+)?)$/);
	        if (m) {
	                title = title.replace(m[0], "");
        	        ep = m[1];
	        }

        	if (this.current.title === title && this.current.ep === ep) {
	                return;
	        }
	        this.current = { title, ep, source };

		this.emit('watching', source, title, ep);
	        return this.sinks.discord.setActivity({
			details: title,
			state: ep ? " Episode " + ep : "  ",
			startTimestamp: new Date(),
			largeImageKey: this.config[source].imageID || this.config.discord.imageID
		});
	}

	clearStatus(source, clean) {
		if (!clean) {
			if (this.active.delete(source))
                                this.emit('client-inactive', source);
		} else {
			if (!this.active.has(source)) {
                                this.active.add(source);
                                this.emit('client-active', source);
                        }
		}

                const wasMain = (this.current.source === source);
                this.emit('stopped-watching', source, !clean, wasMain);
	        if (!wasMain) {
        	        return;
	        }
		this.current.title = this.current.ep = this.current.source = null;
		
	        /* discord.js/RPC contains a bug where you can't clear the activity,
	         * so invoke the appropriate request manually */
	        return this.sinks.discord.request('SET_ACTIVITY', {pid: process.pid});
	}

}


function setupMPV(player, config, nene) {
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

function setupVLC(player, config, nene) {
        /* Setup VLC; */
	const vlc = new VLC(config.port, config.host);
	timers.setInterval(() => {
		vlc.get_title((err, body) => {
			if (err) nene.clearStatus(player);
			else nene.setStatus(body, player);
		});
	}, config.probeInterval);
	return vlc;
}

function setupMPC(player, config, nene) {
	/* Setup MPC-HC; */
	const mpc = new mpcIPC.MediaPlayerClassicClient({ host: config.host, port: config.port });
	timers.setInterval(() => {
	mpc.getFile()
		.then(name => { nene.setStatus(name, player); })
		.catch(err => { nene.clearStatus(player); });
	}, config.probeInterval);
	return mpc;
}

const players = {
	mpv: setupMPV,
	vlc: setupVLC,
	mpc: setupMPC
};


function setupDiscord(sink, config, nene) {
        const discord = new discordRPC.Client({ transport: "ipc" });
        discord.login(config.clientID);
        discord.on('ready', () => {
        	nene.clearStatus(null);
        });
        return discord;
}

const sinks = {
        discord: setupDiscord
};


function registerAll(sources, config, adder) {
        for (let name in sources) {
                const setup = sources[name];
                const client = setup(name, config[name], nene);
                if (client) {
                        adder(name, client);
                }
        }
}

function registerAllPlayers(nene, config) {
	registerAll(players, config, (...args) => nene.addPlayer(...args));
}

function registerAllSinks(nene, config) {
        registerAll(sinks, config, (...args) => nene.addSink(...args));
}

module.exports = { Nene, registerAllSinks, registerAllPlayers };
