'use strict';
const EventEmitter = require('events');
const anitomy = require('anitomy-node');


class Nene extends EventEmitter {

	constructor(config) {
                super();
                this.config = null;
                this.paused = true;
                this.anitomy = new anitomy.Root();

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
                this.paused = false;
                this.emit('ready', this.config);
	}

        pause() {
                this.paused = true;
                this.emit('pause');
        }

        isPaused() {
                return this.paused;
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

        setStatus(file, player) {
                if (!file) {
                        return this.clearStatus(player, true);
                }
                if (!this.active.has(player)) {
                        this.active.add(player);
                        this.emit('player-active', player);
                }

                const meta = this.anitomy.Parse(file);
                const title = meta.AnimeTitle;
                let ep = meta.EpisodeNumber || '';
                if (meta.EpisodeTitle) {
                        ep = (ep ? `${ep} - ` : '') + meta.EpisodeTitle;
                }

                if (this.current[player].title === title && this.current[player].ep === ep) {
                        return;
                }
                this.mainPlayer = player;
                this.current[player] = { title: meta.AnimeTitle, ep: meta.EpisodeNumber };
                if (!this.isPaused()) {
                        this.emit('started', player, title, ep);
                }
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
                if (!this.isPaused()) {
                        this.emit('stopped', player, !clean, wasMain);
                }
                if (wasMain) {
                        this.mainPlayer = null;
                }
        }

}

module.exports = { Nene };
