'use strict';
const timers = require('timers');
const path = require('path');
const listProcesses = require('ps-list');
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
const audioExtensions = ['mp3', 'ogg', 'opus', 'wav', 'flac', 'alac', 'm4a', 'aif', 'aiff', 'aifc', 'wma', 'ape', 'at3'];

function probeProgram(processes, name, program, nene) {
        let entries = processes.filter(x => x.cmd.startsWith(program.binary));
        if (entries.length) {
                nene.setActive(name, 'player');
                for (let process of entries) {
                        openFiles(process.pid, (err, files) => {
                                let interestingVideoFiles = files.filter(x => videoExtensions.includes(path.extname(x).substr(1)));
                                let interestingAudioFiles = files.filter(x => audioExtensions.includes(path.extname(x).substr(1)));
                                if (interestingVideoFiles.length) {
                                        nene.setStatus(interestingVideoFiles[0], name, 'video');
                                } else if (interestingAudioFiles.length) {
                                        nene.setStatus(interestingAudioFiles[0], name, 'music');
                                }
                        });
                }
        } else {
                if (nene.getActive('player').includes(name)) {
                        nene.clearStatus(name, true);
                        nene.clearActive(name, 'player');
                }
        }
}

function setup(player, config, nene) {
        for (let name in config.programs) {
                nene.addPlayer(name);
        }
        timers.setInterval(() => {
                listProcesses().then(processes => {
                        for (let name in config.programs) {
                                probeProgram(processes, name, config.programs[name], nene);
                        }
                });
        }, config.probeInterval);
}


module.exports = { setup, defaultConfig };
