'use strict';
const discord = require('./discord');

const sinks = { discord };

function registerAllSinks(nene, config) {
        for (let name in sinks) {
                const setup = sinks[name];
                const client = setup(name, config[name], nene);
                if (client) {
                        nene.addSink(name, client);
                }
        }
}

module.exports = { sinks, registerAllSinks };
