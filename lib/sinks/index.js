'use strict';
const discord = require('./discord');

const sinks = { discord };

function registerAllSinks(nene, config) {
        for (let name in sinks) {
                config[name] = config[name] || sinks[name].defaultConfig;
                if (!config[name].enabled) {
                        continue;
                }
                const setup = sinks[name].setup;
                const client = setup(name, config[name], nene);
                if (client) {
                        nene.addSink(name, client);
                }
        }
}

module.exports = { sinks, registerAllSinks };
