'use strict';
const path = require('path');
const url = require('url');
const { app, shell, BrowserWindow, Menu, Tray } = require('electron');
const Store = require('electron-store');

const { Nene, registerAllPlayers, registerAllSinks, version } = require('./lib');

if (require('electron-squirrel-startup')) {
	app.quit();
}

function inDevMode() {
	return process.mainModule.filename.indexOf('app.asar') === -1;
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
			{label: app.getName() + ' Support', click: () => shell.openExternal('https://shizmob.github.io/nene')},
			...(inDevMode() ? [
				{label: 'Open Developer Console', click: () => windows.main.instance.webContents.openDevTools()}
			] : [])
		]}
	]));
}


/* Initialize tray. */
let tray = null;

function createTrayMenu(source, current) {
	return Menu.buildFromTemplate([
		{label: `nene v${version}`, enabled: false},
		{label: 'About nene', role: 'about'},
		{label: 'Check for Updates...'},
		{type: 'separator'},
		...(current ? [
			{label: 'Now playing:', click: () => showWindow('main')},
			{label: `  ${current.title}`, enabled: false},
			...(current.ep ? [{label: (current.type !== 'music' ? '  Episode ' : '  ') + current.ep, enabled: false}] : []),
			{label: `  Playing through ${source}`, enabled: false},
			{type: 'separator'},
			{label: 'Clear Status', click: () => nene.clearStatus(source, true)},
			{label: 'Disable Player', click: () => {}}
		] : [
			{label: 'Nothing playing', enabled: false}
		]),
		{type: 'separator'},
		{label: 'Status...', click: () => showWindow('main')},
		{label: 'Preferences...', click: () => showWindow('preferences')},
		{type: 'separator'},
		{label: 'Pause Updating', type: 'checkbox', click: () => nene.togglePause()},
		{label: 'Quit', role: 'quit'}
	]);
}

function createTray() {
	let contextMenu;
	tray = new Tray(path.join(__dirname, 'assets', 'trayTemplate.png'));

	const setTrayStatus = (source, current) => {
		contextMenu = createTrayMenu(source, current);
		tray.setContextMenu(contextMenu);
		tray.setToolTip(`nene v${version} - playing ${current.title}` + (current.ep ? ` - ${current.ep}` : ''));
	};
	const clearTrayStatus = () => {
		contextMenu = createTrayMenu();
		tray.setContextMenu(contextMenu);
		tray.setToolTip(`nene v${version}`);
	};

	nene.on('started', setTrayStatus);
	nene.on('stopped', (source, error, wasMain) => { if (wasMain) clearTrayStatus(); });
	nene.on('ready', config => {
		contextMenu.items[contextMenu.items.length - 2].checked = false;
		tray.setContextMenu(contextMenu);
	});
	nene.on('paused', () => {
		contextMenu.items[contextMenu.items.length - 2].checked = true;
		tray.setContextMenu(contextMenu);
	});

	clearTrayStatus();
}


/* Initialize windows. */
function createMainWindow() {
	const window = new BrowserWindow({
		show: false,
		resizable: false,
		autoHideMenuBar: true,
		icon: path.join(__dirname, 'assets', 'icon.png'),
	});
	window.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true,
	}));
	window.once('ready-to-show', () => {
		if (app.dock) {
			app.dock.show();
		}
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
		window.instance.show();
	} else {
		window.instance = window.create();
		window.instance.on('closed', () => {
			window.instance = null;
		});
	}
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
	if (app.dock) {
		app.dock.hide();
	}
});

app.on('activate', () => {
	showWindow('main');
});
