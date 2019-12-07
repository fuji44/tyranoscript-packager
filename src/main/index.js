#!/usr/bin/env node

'use strict';

const program = require('commander');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const TyPackagerForWindows = require('./TyranoscriptPackagerForWindows')


//---------- initialize commander ----------//

program
  .version(JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'))).version)
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

if (program.verbose) logger.enable();

//---------- main process ----------//

logger.log('Command options :', process.argv);

// Per platform
program.platforms.forEach((value, index, array) => {
  switch (value) {
    case 'win':
      const appRootDir = path.resolve(program.appDir);
      TyPackagerForWindows.validateAppDir(appRootDir);
      const tyTackager = new TyPackagerForWindows();
      const manifest = tyTackager.generateNwjsManifestJson(
        program.name ? path.basename(appRootDir) : program.name,
        program.title, program.resizable ? true : false,
        program.width, program.height, program.maxWidth, program.maxHeight, program.minWidth, program.minHeight
      );
      const destWinDir = path.join(path.resolve(program.destDir), 'win');
      const promise = tyTackager.package(appRootDir, manifest, destWinDir);
      promise.then(() => {
        logger.log('Successful packaging for Windows :', destWinDir);
      });
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
