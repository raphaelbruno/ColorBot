const $ = require('jquery')
const remote = require('electron').remote
const robotjs = require('robotjs')
const log = require('electron-log')
const { values: settingsValues } = require('./settings')
const { removeList: ruleRemoveList } = require('./rule')

let settings = settingsValues()
let flashSettings = remote.getGlobal('flashSettings')

const delayInfo = 250
let interval
let intervalInfo
let startTime
let selectedRules
let timeToWait
let soundOpened
let soundClosed
let soundTriggered
let lastColor = []
let lastTriggered = []
let timeToStop

if(settings.sound){
  soundOpened = new Audio('sound/opened.mp3')
  soundClosed = new Audio('sound/closed.mp3')
  soundTriggered = new Audio('sound/triggered.mp3')
}

if(settings.timeStop){
  let time = settings.timeStop.split(':')
  timeToStop = new Date()
  timeToStop.setHours(time[0], time[1], time[2], 0)
}

log.transports.file.fileName = 'triggered.log'
log.transports.file.level = log.transports.console.level = settings.log;

var startBot = () => {
  let items = $('#rules .rule.active')
  $('.required-message').addClass('d-none');

  if(!items.length){
    $('#invalidRules').removeClass('d-none');
    return
  }

  stopBot()
  startTime = new Date()
  intervalInfo = setInterval(updateInfo, delayInfo)
  interval = setInterval(verifyRules, settings.delay)
  
  selectedRules = []
  items.each((index, item) => {
    selectedRules.push($(item).data('value'))
  })
  
  updateInfo()
  if(soundOpened) soundOpened.play()
  log.info('Bot started!')
}
var stopBot = () => {
  if(!interval){
    return
  }

  clearInterval(intervalInfo)
  clearInterval(interval)
  intervalInfo = null
  interval = null
  selectedRules = null
  timeToWait = null
  lastColor = []
  lastTriggered = []

  updateInfo()
  $('#triggered').text('')
  $('#indicator').addClass('badge-danger')
  if(soundClosed) soundClosed.play()
  log.info('Bot stopped!')
}

var verifyRules = () => {
  if(flashSettings.checkConditionBefore.value){
    let screenshotCheck = robotjs.screen.capture(flashSettings.checkConditionBefore.rule.listener.x, flashSettings.checkConditionBefore.rule.listener.y, 1, 1)
    let colorCheck = '#' + screenshotCheck.colorAt(0, 0).toUpperCase()
    
    if(flashSettings.checkConditionBefore.rule.color != colorCheck)
      return
  }

  selectedRules.forEach((item, index) => {
    let screenshot = robotjs.screen.capture(item.listener.x, item.listener.y, 1, 1)
    let color = '#' + screenshot.colorAt(0, 0).toUpperCase()

    if(settings.ignoreFirstTrigger && !lastTriggered[index]){
      lastTriggered[index] = lastColor[index] = color
      return
    }
    
    if(lastColor[index] != color)
      lastColor[index] = null

    if(settings.colorCache && lastColor[index] == color)
      return

    if(item.color == color && (!timeToWait || timeToWait < new Date())){
      // Triggered
      lastTriggered[index] = lastColor[index] = color
      if(flashSettings.closePositionBefore.value){
        robotjs.moveMouse(flashSettings.closePositionBefore.rule.target.x, flashSettings.closePositionBefore.rule.target.y)
        robotjs.mouseClick()
        
        if(soundClosed) soundClosed.play()
        setTimeout(dispatchRule, flashSettings.closePositionBefore.delay, item)
        setTimeToWait(flashSettings.closePositionBefore.delay)
      }else{
        dispatchRule(item)
        setTimeToWait()
      }
    }
  })

}

var dispatchRule = item => {
  robotjs.moveMouse(item.target.x, item.target.y)
  robotjs.mouseClick()
  
  $('#triggered').text('Last Triggered: '+item.name)
  log.info('Triggered: '+item.name)

  if(soundTriggered) soundTriggered.play()
}

var setTimeToWait = (aditional) => {
  if(settings.minimumDelayNext > 0){
    if(!aditional) 
      aditional = 0
    timeToWait = new Date()
    timeToWait.setMilliseconds(timeToWait.getMilliseconds() + settings.minimumDelayNext + aditional)
    log.info('Next only after: ' + timeToWait)
  }
}

var updateInfo = () => {
  let pad = (num, size) => {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
  }
  let now = new Date()
  let time = now - startTime
  let message = interval 
    ? 'Started at: ' + Math.round(time/1000) + 's' 
    : 'Stopped at: ' + pad(now.getHours(), 2) + ':' + pad(now.getMinutes(), 2) + ':' + pad(now.getSeconds(), 2)
    
  $('#info').text(message)
  $('#indicator').toggleClass('badge-danger')

  if(interval && timeToStop && timeToStop < now){
    log.info('Triggered stop by time limit: ' + settings.timeStop)
    stopBot()
  }
}


var fillList = () => {
  let html = $('#rules .rule')
  let items = list()
  html.detach()
  
  if(items.length){
    items.forEach((item, index) => {
      let newLine = html.clone()
      newLine.find('.name').text(item.name);
      newLine.find('.color').css('background-color', item.color);
      newLine.find('.color small').text(item.color);
      newLine.find('.listener img').attr('src', item.listener.screenshot);
      newLine.find('.target img').attr('src', item.target.screenshot);
      newLine.attr('data-value', JSON.stringify(item));
      newLine.attr('data-index', index);
      newLine.click(function(){
        $(this).toggleClass('active')
      })
      $('#rules').append(newLine)
    })
  }else{
    $('#rules').text(':( There\'s no rules added yet, to add a new rule click the Green Add New Rule button.')
  }

}

var removeSelectedRules = () => {
  $('.required-message').addClass('d-none');
  let items = $('#rules .rule.active') 
  
  if(!items.length){
    $('#invalidRemove').removeClass('d-none');
    return
  }

  let indexes = []
  items.each((index, item) => {
    indexes.push($(item).data('index'))
  })

  ruleRemoveList(indexes)
  electron.remote.getCurrentWindow().reload()
}



module.exports = { startBot, stopBot, fillList, removeSelectedRules }