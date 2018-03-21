'use strict';
const path = require('path');
const url = require('url');
const electron = require('electron');
const Store = require('electron-store');

const { Nene, registerAllPlayers, registerAllSinks } = require('./lib');

const app = electron.app;
const store = new Store();


/* Initialize Nene. */
const nene = new Nene(store.get('clients'));
nene.on('ready', (config) => {
        registerAllPlayers(nene, config);
        registerAllSinks(nene, config);
});
global.nene = nene;
nene.start();


/* Initialize main window. */
let mainWindow = null;

function create() {
	mainWindow = new electron.BrowserWindow({ width: 800, height: 600, show: false });
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}));
	mainWindow.once('ready-to-show', () => {
		mainWindow.show();
	});
	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}


/* Initialize app! */
app.on('ready', () => create());

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
});

app.on('activate', () => {
	if (mainWindow === null) {
		create();
	}
});
