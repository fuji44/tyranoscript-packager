import fs from "fs"
import path from "path"
import ncp from "ncp"
import tar from "tar"
import archiver from "archiver"
import * as fsUtil from "./fsUtil"
import { NwjsManifest, NwjsManifestPosition } from "./NwjsManifest"
import { Logger } from "./Logger"

const log = Logger.instance;

// ========== Value Object ========== //

export class ValidateResult {
  isError: boolean = false;
  messages: string[] = [];
}


// ========== enum ========== //

export enum Platform {
  Windows = "win",
  macOS = "mac",
  Unknown = "unknown"
}
export namespace Platform {
  export function valueOf(str: string) {
    switch (str) {
      case Platform.Windows:
        return Platform.Windows;
      case Platform.macOS:
        return Platform.macOS;
      default:
        return Platform.Unknown;
    }
  }
}


// ========== Packaging Parameter ========== //

export interface PackagingParameter {
  tyranoAppDirPath: string;
  destDirPath: string;
  nwjsManifest: NwjsManifest;
}

export interface WindowsPackagingParameter extends PackagingParameter {
  exeFileName: string;
}


// ========== Packager ========== //

export interface TyranoPackager {
  nodeModulesTarPath: string;
  validate(param: PackagingParameter): ValidateResult;
  package(param: PackagingParameter): Promise<void>;
}

export abstract class GeneralTyranoPackager implements TyranoPackager {
  nodeModulesTarPath: string;

  constructor() {
    this.nodeModulesTarPath = path.join(__dirname, "../resources/win/node_modules.tar.gz");
    log.debug("nodeModulesTarPath : %s", this.nodeModulesTarPath);
  }


  // ---------- static method ---------- //

  static instance(platform: Platform): TyranoPackager {
    switch (platform) {
      case Platform.Windows:
        return new WindowsTyranoPackager();
      // case Platform.macOS:
      //   return new MacOsTyranoPackager();
      default:
        throw new Error("Unsupported platform " + platform.toString());
    }
  }

  static createParameter(platform: string, opts: { [key: string]: any }): PackagingParameter {
    const appRootDir = path.resolve(opts.appDir);
    const gameName = opts.gameName ? opts.gameName : path.basename(appRootDir)
    const manifest = {
      "name": gameName,
      "main": "app://./index.html",
      "window": {
        "title": opts.title,
        "icon": "link.png",
        "toolbar": false,
        "frame": true,
        "position": NwjsManifestPosition.mouse,
        "resizable": opts.resizable,
        "width": opts.width,
        "height": opts.height,
        "max_width": opts.maxWidth,
        "max_height": opts.maxHeight,
        "min_width": opts.minWidth,
        "min_height": opts.minHeight
      },
      "webkit": {
        "plugin": true
      }
    } as NwjsManifest;
    switch (Platform.valueOf(platform)) {
      case Platform.Windows:
        const destWinDir = path.join(path.resolve(opts.destDir), "win");
        const exeName = opts.exeName ? opts.exeName : gameName
        return {
          tyranoAppDirPath: appRootDir,
          destDirPath: destWinDir,
          nwjsManifest: manifest,
          exeFileName: exeName
        } as WindowsPackagingParameter;
      default:
        throw new Error("Unsupported platform : " + platform);
    }
  }


  // ---------- abstract method ---------- //

  abstract package(param: PackagingParameter): Promise<void>;


  // ---------- public method ---------- //

  public validate(param: PackagingParameter): ValidateResult {
    const result = new ValidateResult();
    if (fsUtil.isNotExist(param.tyranoAppDirPath) || fsUtil.canNotRead(param.tyranoAppDirPath)) {
      result.messages.push("not exist or cannot be read : " + param.tyranoAppDirPath)
      result.isError = true;
    }
    // data dir
    const dataDir = path.join(param.tyranoAppDirPath, "data");
    if (fsUtil.isNotExist(dataDir) || fsUtil.canNotRead(dataDir)) {
      result.messages.push("not exist or cannot be read : " + dataDir)
      result.isError = true;
    }
    // tyrano dir
    const tyranoDir = path.join(param.tyranoAppDirPath, "tyrano");
    if (fsUtil.isNotExist(tyranoDir) || fsUtil.canNotRead(tyranoDir)) {
      result.messages.push("not exist or cannot be read : " + tyranoDir)
      result.isError = true;
    }
    // index.html
    const indexHtml = path.join(param.tyranoAppDirPath, "index.html");
    if (fsUtil.isNotExist(indexHtml) || fsUtil.canNotRead(indexHtml)) {
      result.messages.push("not exist or cannot be read : " + indexHtml)
      result.isError = true;
    }
    return result;
  }


  // ---------- Other method ---------- //

  protected async writeTyranoAppZip(ws: NodeJS.WritableStream, tyranoAppRootDir: string, nwjsManifest: NwjsManifest) {
    const archive = archiver("zip", {
      zlib: { level: 9 }
    });
    archive.pipe(ws);
    await this.appendTarAllContents(this.nodeModulesTarPath, archive);
    await this.appendTyranoContents(tyranoAppRootDir, archive);
    await this.appendNwjsManifest(nwjsManifest, archive);
    await archive.finalize();
  }

  /**
   * append tar all contents in tar to archive.
   * @param {string} nodeModulesTarPath
   * @param {archiver.Archiver} archive
   */
  protected appendTarAllContents(nodeModulesTarPath: string, archive: archiver.Archiver) {
    return tar.extract({
      file: nodeModulesTarPath,
      onentry: (entry: tar.ReadEntry) => {
        if (entry.type === "File") {
          archive.append(entry as any, {name: entry.path});
        }
      }
    });
  }

  /**
   * append tyrano game contents to archive.
   * game contents is data directory and tyrano directory and index.html.
   * @param {string} tyranoAppRootDir
   * @param {archiver.Archiver} archive
   */
  protected appendTyranoContents(tyranoAppRootDir: string, archive: archiver.Archiver) {
    return new Promise(resolve => {
      archive.directory(path.join(tyranoAppRootDir, "data"), "data");
      archive.directory(path.join(tyranoAppRootDir, "tyrano"), "tyrano");
      archive.file(path.join(tyranoAppRootDir, "index.html"), {name: "index.html"});
      archive.addListener("end", () => {
        log.debug("Success write Tyrano app contents to archive");
      });
      resolve();
    });
  }

  /**
   * append NW.js manifest file (package.json) to archive.
   * @param {NwjsManifest} nwjsManifest
   * @param {archiver.Archiver} archive
   */
  protected appendNwjsManifest(nwjsManifest: NwjsManifest, archive: archiver.Archiver) {
    return new Promise(resolve => {
      archive.append(JSON.stringify(nwjsManifest), {name: "package.json"});
      archive.addListener("end", () => {
        log.debug("Success write Tyrano manifest to archive");
      });
      resolve();
    });
  }
}

export class WindowsTyranoPackager extends GeneralTyranoPackager {
  nwjsExePath: string;
  binWinDirPath: string;

  constructor() {
    super();
    this.nwjsExePath = path.join(__dirname, "../resources/win/bin/nw.exe");
    this.binWinDirPath = path.join(__dirname, "../resources/win/bin");
    log.debug("nwjsExePath : %s", this.nwjsExePath);
    log.debug("binWinDir : %s", this.binWinDirPath);
  }

  // ---------- Override method ---------- //
  async package(param: WindowsPackagingParameter): Promise<void> {
    const result = this.validate(param);
    if (result.isError) {
      result.messages.forEach((value: string, index: number, array: string[]) => {
        log.error(value);
      });
      return;
    }

    await fsUtil.ensureDir(param.destDirPath);
    const destExeFilePath = path.join(param.destDirPath, param.exeFileName + ".exe");
    const ws = fs.createWriteStream(destExeFilePath);
    await this.exportGameExe(ws, param.tyranoAppDirPath, param.nwjsManifest);
    await this.copyTyranoBinFiles(param.destDirPath);
  }

  // ---------- Other method ---------- //

  protected async exportGameExe(ws: NodeJS.WritableStream, tyranoAppRootDir: string, nwjsManifest: NwjsManifest) {
    await this.writeNwExe(ws);
    await this.writeTyranoAppZip(ws, tyranoAppRootDir, nwjsManifest);
  }

  protected copyTyranoBinFiles(destDir: string) {
    return fsUtil.copy(this.binWinDirPath, destDir, {filter: (src: string, dest: string) => {
      if (path.basename(src) === "nw.exe") return false;
      if (path.basename(src) === ".gitignore") return false;
      if (path.basename(src) === ".npmignore") return false;
      return true;
    }} as ncp.Options);
  }

  protected writeNwExe(ws: NodeJS.WritableStream) {
    return this.writeBinary(ws, this.nwjsExePath);
  }

  /**
   * write binary file to WriteStream.
   * @param {NodeJS.WritableStream} ws
   * @param {string} binaryPath
   */
  protected writeBinary(ws: NodeJS.WritableStream, binaryPath: string) {
    return new Promise(resolve => {
      ws.write(new Uint8Array(Buffer.from(fs.readFileSync(binaryPath))), (err) => {
        if (err) throw err;
        log.debug("Success write binary : %s", binaryPath);
        resolve();
      });
    });
  }
}

