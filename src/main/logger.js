class Logger {
  static log(msg, ...params) {
    if (!this.enable) return;
    console.log.apply(msg, arguments);
  }
}

Logger.enable = false;

module.exports = Logger;