const { app, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')
const DiscordRPC = require('discord-rpc')
const LastFmNode = require('lastfm').LastFmNode
const localConfig = require('./config.json')

const ClientId = '415264846246838272';

var lastfm = new LastFmNode({
    api_key: localConfig.lastFMapikey,
    secret: localConfig.lastFMsecret,
    useragent: 'discord-lastfm/v1.0 Discord LastFM'
  })

var trackStream = lastfm.stream(localConfig.lastFMusername);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 340,
    height: 380,
    resizable: false,
    titleBarStyle: 'hidden',
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true,
  }));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null)
    createWindow()
});

// only needed for discord allowing spectate, join, ask to join
DiscordRPC.register(ClientId)

const rpc = new DiscordRPC.Client({ transport: 'ipc' })
const startTimestamp = new Date()

function getSongDetails() {
    trackStream.on('nowPlaying', function(track) {
        console.log('Now playing: ' + track.name + ' By ' + track.artist['#text'] + ' in ' + track.album['#text'])
        setActivity(track.name, track.artist['#text'], track.album['#text'])
      });
}

function setActivity(songName, songArtist, songAlbum) {
  if (!rpc || !mainWindow)
    return

  rpc.setActivity({
    details: songName,
    state: 'By ' + songArtist,
    startTimestamp,
    largeImageKey: 'logo_lastfm',
    largeImageText: songAlbum,
    instance: false,
  })
}

rpc.on('ready', () => {
    getSongDetails()

  setInterval(() => {
    getSongDetails()
  }, 15e3);
});

trackStream.start();
rpc.login(ClientId).catch(console.error);