'use strict';
const net = require('net');
const timers = require('timers');

function reconnectingSocket(interval, ...args) {
        const s = net.connect(...args);
        var interval = null;

        function setTimer() {
                clearTimer();
                interval = timers.setInterval(() => s.connect(...args), interval);
        }

        function clearTimer() {
                if (interval) {
                        timers.clearInterval(interval);
                        interval = null;
                }
        }

        s.on('connect', clearTimer);
        s.on('error', (e) => { /* console.log(e); */ });
        s.on('close', setTimer);

        return s;
}

module.exports = { reconnectingSocket };
