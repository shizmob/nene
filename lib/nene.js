'use strict';
const EventEmitter = require('events');

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


class Nene extends EventEmitter {

	constructor(config) {
                super();
                this.config = null;
		this.current = {
		        title: null,
		        ep: null,
		        source: null
		};
		this.players = {};
                this.sinks = {};
		this.active = new Set();
                
                this.importConfig(config);
	}
        
        importConfig(config) {
                this.config = config || defaultConfig;
        }
        
        exportConfig() {
                return this.config;
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
		this.emit('started', source, title, ep);
	}

	clearStatus(source, clean) {
		if (!clean) {
			if (this.active.delete(source))
                                this.emit('player-inactive', source);
		} else {
			if (!this.active.has(source)) {
                                this.active.add(source);
                                this.emit('player-active', source);
                        }
		}

                const wasMain = (this.current.source === source);
                if (wasMain) {
                        
                }
                this.emit('stopped', source, !clean, wasMain);
	        if (!wasMain) {
        	        return;
	        }
		this.current.title = this.current.ep = this.current.source = null;
	}

}

module.exports = { Nene };
