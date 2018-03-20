const path = require('path');
const url = require('url');
const electron = require('electron');

const app = electron.app;

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
	mainWindow.webContents.openDevTools();
}

app.on('ready', () => create());

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
});

app.on('activate', () => {
	if (mainWindow === null) {
		create()
	}
});
