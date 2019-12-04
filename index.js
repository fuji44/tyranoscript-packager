#!/usr/bin/env node

'use strict';

const program = require('commander');
const fs = require('fs-extra')
const path = require('path');
const archiver = require('archiver');

const packageObj = fs.readJsonSync(path.join(__dirname, 'package.json'))

program
  .version(packageObj.version)
  .option('-a, --app-dir <string>', 'Specify the directory of Typescript application', './')
  .option('-d, --dest-dir <string>', 'Specify the dest directory', './dest')
  .option('-n, --name <string>', 'Specify the name of the game. If omitted, the app-dir name is used')
  .option('-t, --title <string>', 'Specifies the character string to be displayed in the window title when loading', 'loading...')
  .option('-r, --resizable', 'Specifies whether the window can be resized')
  .option('-w, --width <number>', 'Specifies the initial width of the window (in pixels)', (v) => parseInt(v), 1280)
  .option('-H, --height <number>', 'Specifies the initial height of the window (in pixels)', (v) => parseInt(v), 720)
  .option('--max-width <number>', 'Specifies the max width of the window (in pixels)', (v) => parseInt(v), 1920)
  .option('--max-height <number>', 'Specifies the max height of the window (in pixels)', (v) => parseInt(v), 1080)
  .option('--min-width <number>', 'Specifies the min width of the window (in pixels)', (v) => parseInt(v), 640)
  .option('--min-height <number>', 'Specifies the min height of the window (in pixels)', (v) => parseInt(v), 480)
  .option('-p, --platforms <items>', 'Specify the platforms you want to package, separated by commas', (items, defaultItems) => {
    return items.split(',').map((item, index, array) => item.trim());
  }, ['win'])
  .option('-v, --verbose', 'Verbose mode. A detailed log is output to the console')
  .parse(process.argv);

const verbose = program.verbose;

//---------- local functions ----------//

function log(msg, ...params) {
  if (!verbose) return;
  console.log.apply(msg, arguments);
}

function isNotExist(filePath) {
  try {
    fs.statSync(filePath);
  } catch (err) {
    if(err.code === 'ENOENT')
      return true;
  }
  return false;
}

function canNotRead(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return false;
  } catch (err) {
    return true;
  }
}

function initPaths(appDir, destDir) {
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
      'nodeModulesDir': path.join(__dirname, 'resources/node_modules'),
      'binWinDir': path.join(__dirname, 'resources/binwin'),
      'nwExe': path.join(__dirname, 'resources/binwin/nw.exe'),
      'binMacDir': path.join(__dirname, 'resources/binmac')
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

function validateAppDir(paths) {
  let failed = false;
  if (isNotExist(paths.src.appDir) || canNotRead(paths.src.appDir)) {
    console.error('[ERROR] not exist or cannot be read :', paths.src.appDir);
    failed = true;
  }
  // data dir
  if (isNotExist(paths.src.dataDir) || canNotRead(paths.src.dataDir)) {
    console.error('[ERROR] not exist or cannot be read :', paths.src.dataDir);
    failed = true;
  }
  // tyrano dir
  if (isNotExist(paths.src.tyranoDir) || canNotRead(paths.src.tyranoDir)) {
    console.error('[ERROR] not exist or cannot be read :', paths.src.tyranoDir);
    failed = true;
  }
  // index.html
  if (isNotExist(paths.src.indexHtml) || canNotRead(paths.src.indexHtml)) {
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
function generatePackageJson(
  name, title, resizable,
  width, height, maxWidth, maxHeight, minWidth, minHeight) {
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

function createWriteStream(path) {
  const ws = fs.createWriteStream(path);
  ws.on('close', function() {
    log('Created windows exe file. %d total bytes : %s', fs.statSync(path).size, path);
  });
  ws.on('end', function() {
    log('export finished', path);
  });
  return ws;
}

function writeExeFile(paths, ws) {
  try {
    const nwExe = new Uint8Array(Buffer.from(fs.readFileSync(paths.src.nwExe)));
    ws.write(nwExe);
  } catch (err) {
    throw err;
  }
};

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
};

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

function copyBinFiles(paths) {
  fs.copySync(paths.src.binWinDir, paths.dest.win.dir, {filter: (src, dest) => {
    if (path.basename(src) === 'nw.exe') return false;
    if (path.basename(src) === '.gitignore') return false;
    if (path.basename(src) === '.npmignore') return false;
    return true;
  }});
}


//---------- main process ----------//

log('Command options :', process.argv);

// Input validation
const paths = initPaths(program.appDir, program.destDir);
log('paths :', JSON.stringify(paths));
validateAppDir(paths);

// All platform process
const name = program.name ? path.basename(program.appDir) : program.name;
const packageJson = generatePackageJson(
  name, program.title, program.resizable ? true : false,
  program.width, program.height, program.maxWidth, program.maxHeight, program.minWidth, program.minHeight
);

// Per platform
program.platforms.forEach((value, index, array) => {
  switch (value) {
    case 'win':
      fs.ensureDirSync(paths.dest.win.dir);
      const ws = createWriteStream(paths.dest.win.exe);
      writeExeFile(paths, ws);
      writeAppNw(paths, packageJson, ws);
      copyBinFiles(paths);
      log('Successful packaging for Windows :', paths.dest.win.dir);
      break;
    // case 'mac':
      //TODO Implement mac packaging
      // fs.ensureDirSync(paths.dest.mac.dir);
      // log('Successful packaging for macOS :', paths.dest.mac.dir);
      // break;
    default:
      console.warn('[WARN] "%s" is unsupported platform. Do nothing.', value);
      break;
  }
});
