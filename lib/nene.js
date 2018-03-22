'use strict';
const EventEmitter = require('events');
const anitomy = require('anitomy-node');


class Nene extends EventEmitter {

	constructor(config) {
                super();
                this.config = null;
                this.active = {
                        player: new Set(),
                        sink: new Set()
                };
                this.paused = true;
                this.anitomy = new anitomy.Root();

                this.players = {};
                this.current = {
                        null: {
                                title: null,
                                ep: null
                        }
		};
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
                this.paused = false;
                this.emit('ready', this.config);
	}

        pause() {
                this.paused = true;
                this.emit('paused');
        }

        isPaused() {
                return this.paused;
        }


	addPlayer(name, client) {
                this.players[name] = client;
                this.current[name] = { title: null, ep: null };
	}

	hasPlayer(name) {
		return name in this.players;
	}

	removePlayer(name) {
                delete this.players[name];
                delete this.current[name];
                this.active.player.delete(name);
	}
        
        addSink(name, client) {
                this.sinks[name] = client;
        }
        
        removeSink(name) {
                delete this.sinks[name];
                this.active.sink.delete(name);
        }


        getActive(type) {
                type = type || 'player';
                return [...this.active[type]];
        }

        setActive(source, type) {
                type = type || 'player';
                if (!this.active[type].has(source)) {
                        this.active[type].add(source);
                        this.emit(`${type}-active`, source);
                        return true;
                }
                return false;
        }

        clearActive(source, type) {
                type = type || 'player';
                if (this.active[type].delete(source)) {
                        this.emit(`${type}-inactive`, source);
                        return true;
                }
                return false;
        }

        getStatus(player) {
                return this.current[player || this.mainPlayer];
        }

        setStatus(file, player) {
                if (!file) {
                        return this.clearStatus(player, true);
                }
                this.setActive(player, 'player');

                const meta = this.anitomy.Parse(file);
                const title = meta.AnimeTitle;
                let ep = meta.EpisodeNumber;
                if (meta.EpisodeTitle) {
                        ep = (ep ? `${ep} - ` : '') + meta.EpisodeTitle;
                }

                if (this.current[player].title === title && this.current[player].ep === ep) {
                        return;
                }
                this.mainPlayer = player;
                this.current[player] = { title, ep };
                if (!this.isPaused()) {
                        this.emit('started', player, title, ep);
                }
	}

	clearStatus(player, clean) {
                /* Assume the player is gone when it's an unclean clear. */
                if (!clean) {
                        this.clearActive(player, 'player');
                } else {
                        this.setActive(player, 'player');
                }

                /* Nothing new to notify if nothing was already playing. */
                if (this.current[player].title === null) {
                        return;
                }

                const wasMain = (this.mainPlayer === player);
                this.current[player] = { title: null, ep : null };
                if (!this.isPaused()) {
                        this.emit('stopped', player, !clean, wasMain);
                }
                if (wasMain) {
                        this.mainPlayer = null;
                }
        }

}

module.exports = { Nene };
