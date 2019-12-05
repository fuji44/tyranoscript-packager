#!/usr/bin/env node

'use strict';

const program = require('commander');
const fs = require('fs-extra');
const path = require('path');
const packager = require('./packager');
const logger = require('./logger');

//---------- initialize commander ----------//

program
  .version(fs.readJsonSync(path.join(__dirname, '../../package.json')).version)
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

logger.enable = program.verbose;

//---------- main process ----------//

logger.log('Command options :', process.argv);

// Input validation
const paths = packager.initPaths(program.appDir, program.destDir);
logger.log('paths :', JSON.stringify(paths));
packager.validateAppDir(paths);

// All platform process
const name = program.name ? path.basename(program.appDir) : program.name;
const packageJson = packager.generatePackageJson(
  name, program.title, program.resizable ? true : false,
  program.width, program.height, program.maxWidth, program.maxHeight, program.minWidth, program.minHeight
);

// Per platform
program.platforms.forEach((value, index, array) => {
  switch (value) {
    case 'win':
      fs.ensureDirSync(paths.dest.win.dir);
      packager.createGameExeFile(paths, packageJson);
      packager.copyBinFiles(paths);
      logger.log('Successful packaging for Windows :', paths.dest.win.dir);
      break;
    // case 'mac':
      //TODO Implement mac packaging
      // fs.ensureDirSync(paths.dest.mac.dir);
      // logger.log('Successful packaging for macOS :', paths.dest.mac.dir);
      // break;
    default:
      console.warn('[WARN] "%s" is unsupported platform. Do nothing.', value);
      break;
  }
});
