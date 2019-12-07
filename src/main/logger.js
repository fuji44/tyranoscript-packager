class Logger {
  static log(msg, ...params) {
    if (this.enableFlag) console.log.apply(msg, arguments);
  }
  static enable() {
    this.enableFlag = true;
  }
}

Logger.enableFlag = false;

module.exports = Logger;
