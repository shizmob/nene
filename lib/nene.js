'use strict';
const EventEmitter = require('events');


class Nene extends EventEmitter {

	constructor(config) {
                super();
                this.config = null;

                this.players = {};
                this.current = {
                        null: {
                                title: null,
                                ep: null
                        }
		};
                this.active = new Set();
                this.mainPlayer = null;

                this.sinks = {};
                
                this.importConfig(config);
	}
        
        importConfig(config) {
                this.config = config || {};
        }

        importDefaultConfig(section, config) {
                this.config[section] = this.config[section] || config;
        }

        exportConfig() {
                return this.config;
        }

	start() {
                this.emit('ready', this.config);
	}


	addPlayer(name, client) {
                this.players[name] = client;
                this.current[name] = { title: null, ep: null };
	}

	removePlayer(name) {
                delete this.players[name];
                delete this.current[name];
                this.active.delete(name);
	}
        
        addSink(name, client) {
                this.sinks[name] = client;
        }
        
        removeSink(name) {
                delete this.sinks[name];
        }


        getStatus(player) {
                return this.current[player || this.mainPlayer];
        }

        setStatus(title, player) {
                if (!title) {
                        return this.clearStatus(player, true);
                }
                if (!this.active.has(player)) {
                        this.active.add(player);
                        this.emit('player-active', player);
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

                if (this.current[player].title === title && this.current[player].ep === ep) {
                        return;
                }
                this.mainPlayer = player;
                this.current[player] = { title, ep };
                this.emit('started', player, title, ep);
	}

	clearStatus(player, clean) {
                /* Assume the player is gone when it's an unclean clear. */
                if (!clean) {
                        if (this.active.delete(player)) {
                                this.emit('player-inactive', player);
                        }
                } else {
                        if (!this.active.has(player)) {
                                this.active.add(player);
                                this.emit('player-active', player);
                        }
                }

                /* Nothing new to notify if nothing was already playing. */
                if (this.current[player].title === null) {
                        return;
                }

                const wasMain = (this.mainPlayer === player);
                this.current[player] = { title: null, ep : null };
                this.emit('stopped', player, !clean, wasMain);
                if (wasMain) {
                        this.mainPlayer = null;
                }
        }

}

module.exports = { Nene };
