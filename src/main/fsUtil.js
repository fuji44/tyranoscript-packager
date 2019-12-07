const fs = require('fs');
const ncp = require('ncp');
const mkdirp = require('mkdirp');

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

module.exports.ensureDir = (dir) => {
  return new Promise(resolve => {
    mkdirp(dir, (err) => {
      if (err) throw err;
      resolve();
    });
  });
}

module.exports.copy = (src, dest, options) => {
  return new Promise(resolve => {
    ncp(src, dest, options, (err) => {
      if (err) throw err;
      resolve();
    });
  });
}
