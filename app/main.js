'use strict';
const path = require('path');
const url = require('url');
const electron = require('electron');
const Store = require('electron-store');

const { Nene, registerAllPlayers, registerAllSinks } = require('./lib');

const app = electron.app;
const store = new Store();

if (require('electron-squirrel-startup')) {
	app.quit();
}


/* Initialize Nene. */
const nene = new Nene(store.get('clients'));
global.nene = nene;
nene.on('ready', (config) => {
        registerAllPlayers(nene, config);
        registerAllSinks(nene, config);
});
nene.start();


/* Initialize main window. */
let mainWindow = null;

function create() {
	mainWindow = new electron.BrowserWindow({
		show: false,
		resizable: false,
	});
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
