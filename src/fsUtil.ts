import fs from "fs"
import ncp from "ncp"
import mkdirp from "mkdirp"

export function isNotExist(filePath: string) {
  try {
    fs.statSync(filePath);
  } catch (err: any) {
    if (err.code === "ENOENT")
      return true;
  }
  return false;
};

export function canNotRead(filePath: string) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return false;
  } catch (err) {
    return true;
  }
};

export function ensureDir(dir: string) {
  return mkdirp(dir);
}

export function copy(src: string, dest: string, options: ncp.Options) {
  return new Promise(resolve => {
    ncp(src, dest, options, (err) => {
      if (err) throw err;
      resolve("success");
    });
  });
}
