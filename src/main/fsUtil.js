const fs = require('fs-extra');
const logger = require('./logger');

module.exports.isNotExist = (filePath) => {
  try {
    fs.statSync(filePath);
  } catch (err) {
    if(err.code === 'ENOENT')
      return true;
  }
  return false;
};

module.exports.canNotRead = (filePath) => {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return false;
  } catch (err) {
    return true;
  }
};

module.exports.createWriteStream = (path) => {
  const ws = fs.createWriteStream(path);
  ws.on('close', function() {
    logger.log('Created windows exe file. %d total bytes : %s', fs.statSync(path).size, path);
  });
  ws.on('end', function() {
    logger.log('export finished', path);
  });
  return ws;
};
