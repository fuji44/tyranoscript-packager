const fs = require('fs-extra');

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

