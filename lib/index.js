'use strict';
const { Nene } = require('./nene');
const { players, registerAllPlayers } = require('./players');
const { sinks,   registerAllSinks }   = require('./sinks');
const version = '0.1.0';

module.exports = { Nene, players, registerAllPlayers, sinks, registerAllSinks, version };
