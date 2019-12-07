const fs = require('fs-extra');
const path = require('path');
const tar = require('tar');
const archiver = require('archiver');
const fsUtil = require('./fsUtil');
const logger = require('./logger');

class TyranoscriptPackagerForWindows {

  constructor() {
    // resources
    this.nwjsExePath = path.join(__dirname, '../../resources/win/bin/nw.exe');
    this.nodeModulesTarPath = path.join(__dirname, '../../resources/win/node_modules.tar.gz');
    this.binWinDir = path.join(__dirname, '../../resources/win/bin');
    logger.log('nwjsExePath:', this.nwjsExePath);
    logger.log('nodeModulesTarPath:', this.nodeModulesTarPath);
    logger.log('binWinDir:', this.binWinDir);
  }


  // ----- static functions -------------------- //

  /**
   * validate tyranoscript app dir.
   * not only windows.
   * @param {string} tyranoAppRootDir tyranoscript app root dir path string.
   */
  static validateAppDir(tyranoAppRootDir) {
    let failed = false;
    if (fsUtil.isNotExist(tyranoAppRootDir) || fsUtil.canNotRead(tyranoAppRootDir)) {
      console.error('[ERROR] not exist or cannot be read :', tyranoAppRootDir);
      failed = true;
    }
    // data dir
    const dataDir = path.join(tyranoAppRootDir, 'data');
    if (fsUtil.isNotExist(dataDir) || fsUtil.canNotRead(dataDir)) {
      console.error('[ERROR] not exist or cannot be read :', dataDir);
      failed = true;
    }
    // tyrano dir
    const tyranoDir = path.join(tyranoAppRootDir, 'tyrano');
    if (fsUtil.isNotExist(tyranoDir) || fsUtil.canNotRead(tyranoDir)) {
      console.error('[ERROR] not exist or cannot be read :', tyranoDir);
      failed = true;
    }
    // index.html
    const indexHtml = path.join(tyranoAppRootDir, 'index.html');
    if (fsUtil.isNotExist(indexHtml) || fsUtil.canNotRead(indexHtml)) {
      console.error('[ERROR] not exist or cannot be read :', indexHtml);
      failed = true;
    }
    if (failed) {
      throw new Error('[ERROR] Application directory validation failed');
    }
  };


  // ----- public functions -------------------- //

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
   * @return {string} json format string
   */
  generateNwjsManifestJson(
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
  }

  /**
   * package tyranoscript app.
   * @param {string} tyranoAppRootDir tyranoscript app root dir path string.
   * @param {string} nwjsManifestJson NW.js manifest file format string.
   * @param {string} destDir packaged tyranoscript app export dir path string.
   */
  async package(tyranoAppRootDir, nwjsManifestJson, destDir) {
    logger.log('Tyrano app root dir:', tyranoAppRootDir);
    logger.log('NW.js Manifest:', manifest);
    logger.log('Export dir:', destDir);
    await fs.ensureDir(destDir);
    await this.exportGameExe(tyranoAppRootDir, nwjsManifestJson, destDir);
    await this.copyTyranoBinFiles(destDir)
  }


  // ----- local use function -------------------- //

  async exportGameExe(tyranoAppRootDir, nwjsManifestJson, destDir) {
    const ws = fs.createWriteStream(path.join(destDir, 'game.exe'));
    await this.writeNwExe(ws);
    await this.writeTyranoAppZip(ws, tyranoAppRootDir, nwjsManifestJson);
  }

  copyTyranoBinFiles(destDir) {
    return fs.copy(this.binWinDir, destDir, {filter: (src, dest) => {
      if (path.basename(src) === 'nw.exe') return false;
      if (path.basename(src) === '.gitignore') return false;
      if (path.basename(src) === '.npmignore') return false;
      return true;
    }});
  }

  /**
   * append NW.js manifest file (package.json) to archive.
   * @param {string} nwjsManifestJson
   * @param {archiver.Archiver} archive
   */
  appendNwjsManifest(nwjsManifestJson, archive) {
    return new Promise(resolve => {
      archive.append(nwjsManifestJson, {name: 'package.json'})
      resolve();
    })
  }

  /**
   * append tyrano game contents to archive.
   * game contents is data directory and tyrano directory and index.html.
   * @param {string} tyranoAppRootDir
   * @param {archiver.Archiver} archive
   */
  appendTyranoContents(tyranoAppRootDir, archive) {
    return new Promise(resolve => {
      archive.directory(path.join(tyranoAppRootDir, 'data'), 'data');
      archive.directory(path.join(tyranoAppRootDir, 'tyrano'), 'tyrano');
      archive.file(path.join(tyranoAppRootDir, 'index.html'), {name: 'index.html'});
      resolve();
    })
  }

  /**
   * append tar all contents in tar to archive.
   * @param {string} nodeModulesTarPath
   * @param {archiver.Archiver} archive
   */
  appendTarAllContents(nodeModulesTarPath, archive) {
    return tar.extract({
      file: nodeModulesTarPath,
      onentry: entry => {
        if (entry.type === 'File') {
          archive.append(entry, {name: entry.path});
        }
      }
    });
  }

  async writeTyranoAppZip(ws, tyranoAppRootDir, nwjsManifestJson) {
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    archive.pipe(ws);
    await this.appendTarAllContents(this.nodeModulesTarPath, archive);
    await this.appendTyranoContents(tyranoAppRootDir, archive);
    await this.appendNwjsManifest(nwjsManifestJson, archive);
    await archive.finalize();
  }

  writeNwExe(ws) {
    return this.writeBinary(ws, this.nwjsExePath);
  }

  /**
   * write binary file to WriteStream.
   * @param {fs.WriteStream} ws
   * @param {string} binaryPath
   */
  writeBinary(ws, binaryPath) {
    return new Promise(resolve => {
      try {
        ws.write(new Uint8Array(Buffer.from(fs.readFileSync(binaryPath))));
      } catch (err) {
        throw err;
      }
      resolve();
    });
  }
}

module.exports = TyranoscriptPackagerForWindows;
