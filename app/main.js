'use strict';
const path = require('path');
const url = require('url');
const { app, shell, BrowserWindow, Menu, Tray } = require('electron');
const Store = require('electron-store');

const { Nene, registerAllPlayers, registerAllSinks, version } = require('./lib');

if (require('electron-squirrel-startup')) {
	app.quit();
}


/* Initialize persistent store. */
const store = new Store();


/* Initialize Nene. */
const nene = global.nene = new Nene(store.get('clients'));
nene.on('ready', (config) => {
        registerAllPlayers(nene, config);
        registerAllSinks(nene, config);
});
nene.start();


/* Initialize application menu. */
function createApplicationMenu() {
	if (process.platform !== 'darwin')
		return;
	Menu.setApplicationMenu(Menu.buildFromTemplate([
		{label: app.getName(), submenu: [
			{label: 'About ' + app.getName(), role: 'about'},
			{label: 'Check for Updates...'},
			{type: 'separator'},
			{label: 'Preferences...', accelerator: 'CmdOrCtrl+,'},
			{type: 'separator'},
			{label: 'Services', role: 'services', submenu: []},
			{type: 'separator'},
			{role: 'hide'},
			{role: 'hideothers'},
			{role: 'unhide'},
			{type: 'separator'},
			{role: 'quit'}
		]},
		{label: 'Edit', role: 'editMenu'},
		{label: 'Window', role: 'windowMenu'},
		{label: 'Help', role: 'help', submenu: [
			{label: app.getName() + ' Support', click: () => shell.openExternal('https://shizmob.github.io/nene')}
		]}
	]));
}


/* Initialize windows. */
function createMainWindow() {
	const window = new BrowserWindow({
		show: false,
		resizable: false,
		icon: path.join(__dirname, 'assets', 'icon.png'),
	});
	window.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true,
	}));
	window.once('ready-to-show', () => {
		app.dock.show();
		window.show();
	});
	return window;
}

const windows = {
	'main': {
		create: createMainWindow,
		instance: null
	}
}

function showWindow(name) {
	const window = windows[name];
	if (window.instance) {
		if (!window.instance.isVisible()) {
			window.instance.show();
		}
	} else {
		window.instance = window.create();
		window.instance.on('closed', () => {
			windows.instance = null;
		});
	}
}


/* Initialize tray. */
let tray = null

function createTrayMenu(title, ep, source) {
	const titleMenu = [{
		label: title ? 'Now playing:' : 'Nothing playing',
		enabled: title !== undefined,
		click: () => { showWindow('main'); }
	}];
	if (title) {
		titleMenu.push({label: `  ${title}`, enabled: false})
		if (ep) {
			titleMenu.push({label: `  Episode ${ep}`, enabled: false});
		}
		titleMenu.push({label: `  Playing through ${source}`, enabled: false});
	}

	return Menu.buildFromTemplate([].concat([
		{label: `nene v${version}`, enabled: false},
		{label: 'Show...', click: () => { showWindow('main'); }},
		{label: 'About nene', role: 'about'},
		{label: 'Check for Updates...'},
		{type: 'separator'},
	], titleMenu, [
		{type: 'separator'},
		{label: 'Preferences...'},
		{type: 'separator'},
		{label: 'Pause Updating'},
		{label: 'Quit', role: 'quit'}
	]));
}

function createTray() {
	tray = new Tray(path.join(__dirname, 'assets', 'trayTemplate.png'));
	const contextMenu = 
	tray.setToolTip(`nene v${version}`);
	tray.setContextMenu(createTrayMenu());
	
	nene.on('started', (source, title, ep) => {
		tray.setContextMenu(createTrayMenu(title, ep, source));
	})
	nene.on('stopped', (source, wasMain, error) => {
		if (wasMain) {
			tray.setContextMenu(createTrayMenu());
		}
	});
}


/* Initialize app! */
app.on('ready', () => {
	createApplicationMenu();
	createTray();
	if (!store.get('general.start_minimized')) {
		showWindow('main');
	}
});;

app.on('window-all-closed', () => {
	app.dock.hide();
});

app.on('activate', () => {
	showWindow('main');
});
