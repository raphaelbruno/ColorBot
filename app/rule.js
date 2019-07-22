const robotjs = require('robotjs')
const Jimp = require('jimp')
const $ = require('jquery')
const Store = require('./store.js')

const size = 50
var halfSize = Math.round(size/2)
let delay = 100
var intervalScreenshot
var ruleObject = {}

let rules = new Store({
  name: 'rules',
  defaults: {
    rule: []
  }
})

var list = () => {
  return rules.get('rule')
}

var addStep = (step, callback) => {
  let currentTarget
  
  if(intervalScreenshot){
    return
  }
  $(document).focus()
  $('body').focus()
  $('#action-tip').removeClass('d-none')
  $(document).keydown(function verifyEnterKey(e){
    if(e.keyCode == 13){
      e.preventDefault()
      
      switch(step){
        case 'color':
          ruleObject.color = currentTarget.color;
          $('#color-image').attr('src', 'img/color.png')
          break;
          case 'listener':
          ruleObject.listener = currentTarget;
          $('#listener-image').attr('src', 'img/listener.png')
          break;
          case 'target':
          ruleObject.target = currentTarget;
          $('#target-image').attr('src', 'img/target.png')
          break;
      }

      clearInterval(intervalScreenshot)
      intervalScreenshot = null
      $(document).unbind('keydown', verifyEnterKey)
      $('#action-tip').addClass('d-none')
      if(callback) callback(ruleObject);
    }
  })
    
  intervalScreenshot = setInterval(function(step){
    let mousePos = robotjs.getMousePos()
    let screenshot = robotjs.screen.capture(mousePos.x - halfSize, mousePos.y - halfSize, size, size)
    
    currentTarget = {
      x: mousePos.x,
      y: mousePos.y,
      color: '#' + screenshot.colorAt(halfSize, halfSize).toUpperCase(),
      screenshot: createBitmapBase64(screenshot)
    }

    switch(step){
      case 'color':
        $('#color .color').css('background', currentTarget.color)
        $('#color .color small').text(currentTarget.color)
        break;
      case 'listener':
        $('#listener .image img').attr('src', currentTarget.screenshot)
        break;
        case 'target':
        $('#target .image img').attr('src', currentTarget.screenshot)
        break;
    }

  }, delay, step)
  
}

var saveRule = () => {
  let invalid = 0
  $('.required-message').addClass('d-none');

  if(!$('#name').val()){
    $('#invalidName').removeClass('d-none');
    invalid++
  }

  if(!ruleObject.color){
    $('#invalidColor').removeClass('d-none');
    invalid++
  }

  if(!ruleObject.listener){
    $('#invalidListener').removeClass('d-none');
    invalid++
  }

  if(!ruleObject.target){
    $('#invalidTarget').removeClass('d-none');
    invalid++
  }

  if(invalid > 0){
    return
  }

  ruleObject.name = $('#name').val()
  
  let ruleList = list()
  ruleList.push(ruleObject)
  rules.set('rule', ruleList)
  electron.remote.getCurrentWindow().close()
}

var remove = index => {
  rules.set('rule', list().filter((val, ind, arr) => { return index != ind }))
}

var removeList = indexes => {
  rules.set('rule', list().filter((val, ind, arr) => { return !indexes.includes(ind) }))
}

var addEscapeListener = () => {
  $(document).keyup(e => {
    if(e.keyCode == 27){
      e.preventDefault();
      electron.remote.getCurrentWindow().close()
    }
  })
}

var createBitmapBase64 = capture => {
  let image = new Jimp({data: capture.image, width: capture.width, height: capture.height})
  let base64
        
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
    let r   = image.bitmap.data[ idx + 0 ]
    let b  = image.bitmap.data[ idx + 2 ]
    image.bitmap.data[ idx + 0 ] = b
    image.bitmap.data[ idx + 2 ] = r
  })

  image.getBase64(Jimp.AUTO, (error, data) => {
    base64 = data
  })

  return base64
}

module.exports = { list, addStep, saveRule, remove, removeList, addEscapeListener }