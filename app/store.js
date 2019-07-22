const electron = require('electron')
const path = require('path')
const fs = require('fs')

class Store {
  constructor(opts) {
    const userDataPath = (electron.app || electron.remote.app).getPath('userData')
    this.name = opts.name
    this.defaults = opts.defaults
    this.path = path.join(userDataPath, this.name + '.json')

    this.data = Store.parseDataFile(this.path, this.defaults)
  }

  get(key) {
    return this.data[key]
  }

  set(key, val) {
    this.data[key] = val
    fs.writeFileSync(this.path, JSON.stringify(this.data))
  }

  static parseDataFile(filePath, defaults) {
    try {
      return JSON.parse(fs.readFileSync(filePath))
    } catch(error) {
      return defaults
    }
  }

  static factoryReset(store){
    const userDataPath = (electron.app || electron.remote.app).getPath('userData')
    fs.unlink(path.join(userDataPath, store + '.json'), error => {
      return
    })
  }

}

module.exports = Store