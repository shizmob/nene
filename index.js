'use strict';
const net = require('net');
const timers = require('timers');
const DiscordRPC = require('discord-rpc');
const mpvIPC = require('mpv-ipc');
const VLC = require('vlc-remote');
const mpcIPC = require('mpc-ipc');


const config = {
        discord: {
                clientID: "421361421356630036",
                imageID: "iina_logo"
        },
        mpv: {
                socketFile: "/tmp/mpv-iina.sock",
                imageID: "iina_logo"
        },
        vlc: {
                host: 'localhost',
                port: 8084,
                probeInterval: 5000,
                imageID: "vlc_logo"
        },
        mpc: {
                host: 'localhost',
                port: 13579,
                probeInterval: 5000,
                imageID: "mpc_logo"
        }
};

const current = {
        title: null,
        ep: null,
        source: null
};


function reconnectingSocket(...args) {
        const s = net.connect(...args);
        var interval = null;

        function setTimer() {
                clearTimer();
                interval = timers.setInterval(() => s.connect(...args), 5000);
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


function setStatus(title, source) {
        if (!title) {
                return clearStatus(source);
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
        let m = title.match(/ - ([0-9SEPp]+(?: - [^-]+)?)$/);
        if (m) {
                title = title.replace(m[0], "");
                ep = m[1];
        }

        if (current.title === title && current.ep === ep) {
                return;
        }
        current.title = title;
        current.ep = ep;
        current.source = source;

        console.log(`[*] setting status [${source}]: title -> ${title}, episode -> ${ep}`);
        return discord.setActivity({
                details: title,
                state: ep ? " Episode " + ep : "  ",
                startTimestamp: new Date(),
                largeImageKey: config[source].imageID || config.discord.imageID
        });
}

function clearStatus(source) {
        if (current.source !== source) {
                return;
        }
        console.log(`[*] clearing status [${source}]`);
        /* discord.js/RPC contains a bug where you can't clear the activity,
         * so invoke the appropriate request manually */
        current.title = current.ep = current.source = null;
        return discord.request('SET_ACTIVITY', {pid: process.pid});
}


let mpv = new mpvIPC.MPVClient(reconnectingSocket(config.mpv.socketFile));
let mpc = new mpcIPC.MediaPlayerClassicClient({ host: config.mpc.host, port: config.mpc.port });
let vlc = new VLC(config.vlc.port, config.vlc.host);
let discord = new DiscordRPC.Client({ transport: "ipc" });

discord.login(config.discord.clientID);
discord.on('ready', () => {
        clearStatus(null);

        /* Setup mpv; */
        mpv.on('connect', () => {
                mpv.onEndFile(e => { clearStatus('mpv'); });
                mpv.observeMediaTitle(name => { setStatus(name, 'mpv'); });
        });
        mpv.on('close', e => { clearStatus('mpv'); });
        /* Setup VLC; */
        timers.setInterval(() => {
                vlc.get_title((err, body) => {
                        if (err) clearStatus('vlc');
                        else setStatus(body, 'vlc');
                });
        }, config.vlc.probeInterval);
        /* Setup MPC-HC; */
        timers.setInterval(() => {
                mpc.getFile().then(name => { setStatus(name, 'mpc'); }).catch(err => { clearStatus('mpc'); });
        }, config.mpc.probeInterval);
});
