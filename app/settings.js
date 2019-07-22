const $ = require('jquery')
const remote = require('electron').remote
const Store = require('./store.js')

let settings = new Store({
  name: 'settings',
  defaults: {
    settings: {
      delay: 100,
      minimumDelayNext: 0,
      timeStop: null,
      ignoreFirstTrigger: true,
      colorCache: true,
      log: false,
      sound: true
    }
  }
})
let flashSettings = remote ? remote.getGlobal('flashSettings') : {}

var values = () => {
  return settings.get('settings')
}

var fillFields = () => {
  let item = values()
  $('#delay').val(item.delay)
  $('#minimumDelayNext').val(item.minimumDelayNext)
  $('#timeStop').val(item.timeStop)
  
  $('#closePositionBefore').prop('checked', flashSettings.closePositionBefore.value)
  if(flashSettings.closePositionBefore.rule.target){
    $('#target').data('rule', flashSettings.closePositionBefore.rule)
    $('#target img').attr('src', flashSettings.closePositionBefore.rule.target.screenshot)
  }
  $('#targetDelay').val(flashSettings.closePositionBefore.delay)

  $('#checkConditionBefore').prop('checked', flashSettings.checkConditionBefore.value)
  if(flashSettings.checkConditionBefore.rule.color){
    $('#color').data('rule', {color: flashSettings.checkConditionBefore.rule.color})
    $('#color .color').css('background-color', flashSettings.checkConditionBefore.rule.color);
    $('#color small').text(flashSettings.checkConditionBefore.rule.color);
  }
  if(flashSettings.checkConditionBefore.rule.listener){
    $('#listener').data('rule', {listener: flashSettings.checkConditionBefore.rule.listener})
    $('#listener img').attr('src', flashSettings.checkConditionBefore.rule.listener.screenshot)
  }

  $('#ignoreFirstTrigger').prop('checked', item.ignoreFirstTrigger)
  $('#colorCache').prop('checked', item.colorCache)
  $('#log').prop('checked', item.log)
  $('#sound').prop('checked', item.sound)
}

var save = () => {
  let invalid = 0
  $('.required-message').addClass('d-none')

  if(!$('#delay').val()){
    $('#invalidDelay').removeClass('d-none')
    invalid++
  }
  
  if(!$('#minimumDelayNext').val()){
    $('#invalidMinimumDelayNext').removeClass('d-none')
    invalid++
  }
  
  var hourValidation = new RegExp(/^\d{2}:\d{2}:\d{2}$/)
  if($('#timeStop').val() && !hourValidation.test($('#timeStop').val())){
    $('#invalidTimeStop').removeClass('d-none')
    invalid++
  }

  if($('#closePositionBefore').is(':checked') && !$('#target').data('rule')){
    $('#invalidTarget').removeClass('d-none')
    invalid++
  }

  if($('#closePositionBefore').is(':checked') && !$('#targetDelay').val()){
    $('#invalidTargetDelay').removeClass('d-none')
    invalid++
  }

  if($('#checkConditionBefore').is(':checked') && !$('#color').data('rule')){
    $('#invalidColor').removeClass('d-none')
    invalid++
  }

  if($('#checkConditionBefore').is(':checked') && !$('#listener').data('rule')){
    $('#invalidListener').removeClass('d-none')
    invalid++
  }

  if(invalid > 0){
    return
  }

  let item = values()
  item.delay = parseInt($('#delay').val())
  item.minimumDelayNext = parseInt($('#minimumDelayNext').val())
  item.timeStop = $('#timeStop').val()
  
  flashSettings.closePositionBefore.value = $('#closePositionBefore').is(':checked')
  if($('#target').data('rule'))
    flashSettings.closePositionBefore.rule.target = $('#target').data('rule').target
  flashSettings.closePositionBefore.delay = parseInt($('#targetDelay').val())
  
  flashSettings.checkConditionBefore.value = $('#checkConditionBefore').is(':checked')
  if($('#color').data('rule'))
    flashSettings.checkConditionBefore.rule.color = $('#color').data('rule').color
  if($('#listener').data('rule'))
    flashSettings.checkConditionBefore.rule.listener = $('#listener').data('rule').listener
  
  item.ignoreFirstTrigger = $('#ignoreFirstTrigger').is(':checked')
  item.colorCache = $('#colorCache').is(':checked')
  item.log = $('#log').is(':checked')
  item.sound = $('#sound').is(':checked')
  settings.set('settings', item)
  electron.remote.getCurrentWindow().close()
}

var addEscapeListener = () => {
  $(document).keyup(e => {
    if(e.keyCode == 27){
      e.preventDefault()
      electron.remote.getCurrentWindow().close()
    }
  })
}

var factoryReset = () => {
  Store.factoryReset('settings')
  Store.factoryReset('rules')
  electron.remote.getCurrentWindow().close()
}

module.exports = { fillFields, values, save, addEscapeListener, factoryReset }