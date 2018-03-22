'use strict';
const timers = require('timers');
const path = require('path');
const ps = require('ps-list');
const openFiles = require('open-files');

const defaultConfig = {
        name: 'Open Files',
        enabled: true,
        probeInterval: 10000,
        programs: {
                itunes: {
                        name: 'iTunes',
                        binary: '/Applications/iTunes.app/Contents/MacOS/iTunes'
                }
        }
};
const videoExtensions = ['mp4', 'm4v', 'mov', 'avi', 'mpg', 'mpeg', 'mkv', 'ogv'];

function probeProgram(processes, name, program, nene) {
        let entries = processes.filter(x => x.cmd.startsWith(program.binary));
        if (entries.length) {
                nene.setActive(name, 'player');
                for (let process of entries) {
                        openFiles(process.pid, (err, files) => {
                                let interestingFiles = files.filter(x => videoExtensions.includes(path.extname(x).substr(1)));
                                if (interestingFiles.length) {
                                        nene.setStatus(interestingFiles[0], name);
                                }
                        });
                }
        } else {
                nene.clearStatus(name);
                nene.clearActive(name, 'player');
        }
}

function setup(player, config, nene) {
        for (let name in config.programs) {
                nene.addPlayer(name);
        }
        timers.setInterval(() => {
                ps().then(processes => {
                        for (let name in config.programs) {
                                probeProgram(processes, name, config.programs[name], nene);
                        }
                });
        }, config.probeInterval);
}

module.exports = { setup, defaultConfig };
