'use strict';
const discord = require('./discord');

const sinks = { discord };

function registerAllSinks(nene, config) {
        for (let name in sinks) {
                const sink = sinks[name];
                config[name] = config[name] || sink.defaultConfig;
                if (!config[name].enabled) {
                        continue;
                }
                const client = sink.setup(name, config[name], nene);
                if (client) {
                        nene.addSink(name, client);
                }
        }
}

module.exports = { sinks, registerAllSinks };
