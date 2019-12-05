
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const fsUtil = require('./fsUtil');


//---------- local functions ----------//

function writeExeFile(paths, ws) {
  try {
    const nwExe = new Uint8Array(Buffer.from(fs.readFileSync(paths.src.nwExe)));
    ws.write(nwExe);
  } catch (err) {
    throw err;
  }
}

function writeAppNw(paths, packageJson, ws) {
  // create zip file 'app.nw'
  const archive = createArchive();
  archive.pipe(ws);
  archive.directory(paths.src.dataDir, 'data');
  archive.directory(paths.src.tyranoDir, 'tyrano');
  archive.directory(paths.src.nodeModulesDir, 'node_modules');
  archive.file(paths.src.indexHtml, { name: 'index.html' });
  archive.append(packageJson, { name: 'package.json' });
  archive.finalize();
}

function createArchive() {
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });
  archive.on('warning', function(err) {
    if (err) throw err;
  });
  archive.on('error', function(err) {
    throw err;
  });
  return archive;
}


//---------- modules ----------//

module.exports.initPaths = (appDir, destDir) => {
  const srcAppDirPath = path.resolve(appDir);
  const destBaseDirPath = path.resolve(destDir);
  const destWinDirPath = path.join(destBaseDirPath, 'win');
  const destMacDirPath = path.join(destBaseDirPath, 'mac');
  const paths = {
    'src': {
      'appDir': srcAppDirPath,
      'dataDir': path.join(srcAppDirPath, 'data'),
      'tyranoDir': path.join(srcAppDirPath, 'tyrano'),
      'indexHtml': path.join(srcAppDirPath, 'index.html'),
      'nodeModulesDir': path.join(__dirname, '../../resources/node_modules'),
      'binWinDir': path.join(__dirname, '../../resources/binwin'),
      'nwExe': path.join(__dirname, '../../resources/binwin/nw.exe'),
      'binMacDir': path.join(__dirname, '../../resources/binmac')
    },
    'dest': {
      'win': {
        'dir': destWinDirPath,
        'exe': path.join(destWinDirPath, 'game.exe'),
      },
      'mac': {
        'dir': destMacDirPath
      }
    }
  }
  return paths;
}

module.exports.validateAppDir = (paths) => {
  let failed = false;
  if (fsUtil.isNotExist(paths.src.appDir) || fsUtil.canNotRead(paths.src.appDir)) {
    console.error('[ERROR] not exist or cannot be read :', paths.src.appDir);
    failed = true;
  }
  // data dir
  if (fsUtil.isNotExist(paths.src.dataDir) || fsUtil.canNotRead(paths.src.dataDir)) {
    console.error('[ERROR] not exist or cannot be read :', paths.src.dataDir);
    failed = true;
  }
  // tyrano dir
  if (fsUtil.isNotExist(paths.src.tyranoDir) || fsUtil.canNotRead(paths.src.tyranoDir)) {
    console.error('[ERROR] not exist or cannot be read :', paths.src.tyranoDir);
    failed = true;
  }
  // index.html
  if (fsUtil.isNotExist(paths.src.indexHtml) || fsUtil.canNotRead(paths.src.indexHtml)) {
    console.error('[ERROR] not exist or cannot be read :', paths.src.indexHtml);
    failed = true;
  }
  if (failed) {
    throw new Error('[ERROR] Application directory validation failed');
  }
};

/**
 * Create a package.json object to bundle with the tyranoscript app.
 *
 * See Manifest Format for more details.
 * http://docs.nwjs.io/en/latest/References/Manifest%20Format/
 *
 * @param {string} name
 * @param {string} title
 * @param {boolean} resizable
 * @param {number} width
 * @param {number} height
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @param {number} minWidth
 * @param {number} minHeight
 * @return {JSON} package.json Object
 */
module.exports.generatePackageJson = (
  name, title, resizable,
  width, height, maxWidth, maxHeight, minWidth, minHeight) => {
  const packageJson = {
    'name': name,
    'main': 'app://./index.html',
    'window': {
      'title': title,
      'icon': 'link.png',
      'toolbar': false,
      'frame': true,
      'position': 'mouse',
      'resizable': resizable,
      'width': width,
      'height': height,
      'max_width': maxWidth,
      'max_height': maxHeight,
      'min_width': minWidth,
      'min_height': minHeight
    },
    'webkit': {
      'plugin': true
    }
  };
  return JSON.stringify(packageJson);
};

module.exports.copyBinFiles = (paths) => {
  fs.copySync(paths.src.binWinDir, paths.dest.win.dir, {filter: (src, dest) => {
    if (path.basename(src) === 'nw.exe') return false;
    if (path.basename(src) === '.gitignore') return false;
    if (path.basename(src) === '.npmignore') return false;
    return true;
  }});
};

module.exports.createGameExeFile = (paths, packageJson) => {
  const ws = fsUtil.createWriteStream(paths.dest.win.exe);
  writeExeFile(paths, ws);
  writeAppNw(paths, packageJson, ws);
}
