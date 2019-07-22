const { app, BrowserWindow } = require('electron')
const { values: settingsValues } = require('./settings')

let windowMain
let windowAddRule
let windowSettings
let icon = __dirname + '/img/colorbot/256x256.png'

let settings = settingsValues()
global.flashSettings = {
  closePositionBefore: {
    value: false,
    delay: 100,
    rule: {
      target: null
    }
  },
  checkConditionBefore: {
    value: false,
    rule: {
      color: null,
      listener: null
    }
  }
}

var createWindow = () => {
  app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

  windowMain = new BrowserWindow({
    width: 380,
    height: 256,
    icon: icon,
    webPreferences: {
      nodeIntegration: true
    },
    alwaysOnTop: true,
    resizable: false,
    frame: false
  })
  
  windowMain.setMenu(null)
  windowMain.loadFile('app/main.html')
  
  if(settings.sound){
    windowMain.webContents.once('dom-ready', (dom) => {
      windowMain.webContents.executeJavaScript(`
        let soundOpening = new Audio('sound/opening.mp3')
        soundOpening.play()
      `)
    })
  }
  
  windowMain.on('closed', () => {
    if(windowAddRule){
      windowAddRule.close()
      windowAddRule = null
    }
    if(windowSettings){
      windowSettings.close()
      windowSettings = null
    }
    windowMain = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
 
app.on('activate', () => {
  if (windowMain === null) {
    createWindow()
  }
})


var openWindowSettings = () => {
  if (windowSettings) {
    windowSettings.focus()
    windowSettings.loadURL('app/main.html')
    return
  }

  windowSettings = new BrowserWindow({
    width: 550,
    height: 525,
    icon: icon,
    alwaysOnTop: true,
    resizable: false,
    frame: false
  })

  windowSettings.setMenu(null)
  windowSettings.loadFile('app/settings.html')

  windowSettings.on('closed', function() {
    windowSettings = null
    windowMain.reload()
  })

}

var openWindowAddRule = () => {
  if (windowAddRule) {
    windowAddRule.focus()
    windowAddRule.loadURL('app/main.html')
    return
  }

  windowAddRule = new BrowserWindow({
    width: 400,
    height: 400,
    icon: icon,
    alwaysOnTop: true,
    resizable: false,
    frame: false
  })

  windowAddRule.setMenu(null)
  windowAddRule.loadFile('app/addRule.html')

  windowAddRule.on('closed', function() {
    windowAddRule = null
    windowMain.reload()
  })

}

module.exports = { openWindowAddRule, openWindowSettings }