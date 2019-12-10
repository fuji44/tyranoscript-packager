#!/usr/bin/env node

import fs from "fs"
import path from "path"
import program from "commander"
import { GeneralTyranoPackager, Platform } from "./TyranoPackager"
import { Logger } from "./Logger"


// ---------- initialize commander ---------- /

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json")).toString());

program
  .name("tyrano")
  .usage("[options]")
  .description(packageJson.description)
  .version(packageJson.version)
  .option("-a, --app-dir <string>", "Specify the directory of Typescript application", "./")
  .option("-d, --dest-dir <string>", "Specify the dest directory", "./dest")
  .option("-n, --game-name <string>", "Specify the name of the game. If omitted, the app-dir name is used")
  .option("-e, --exe-name <string>", "Specify the exe file name of the game. Do not write the extension (.exe). If omitted, the game name is used")
  .option("-t, --title <string>", "Specifies the character string to be displayed in the window title when loading", "loading...")
  .option("-r, --resizable", "Specifies whether the window can be resized")
  .option("-w, --width <number>", "Specifies the initial width of the window (in pixels)", (v: any) => parseInt(v), 1280)
  .option("-H, --height <number>", "Specifies the initial height of the window (in pixels)", (v: any) => parseInt(v), 720)
  .option("--max-width <number>", "Specifies the max width of the window (in pixels)", (v: any) => parseInt(v), 1920)
  .option("--max-height <number>", "Specifies the max height of the window (in pixels)", (v: any) => parseInt(v), 1080)
  .option("--min-width <number>", "Specifies the min width of the window (in pixels)", (v: any) => parseInt(v), 640)
  .option("--min-height <number>", "Specifies the min height of the window (in pixels)", (v: any) => parseInt(v), 480)
  .option("-p, --platforms <items>", "Specify the platforms you want to package, separated by commas", (items: any, defaultItems: any) => {
    return items.split(",").map((item: string, index: number, array: any[]) => item.trim());
  }, ["win"])
  .option("-v, --verbose", "Verbose mode. A detailed log is output to the console")
  .parse(process.argv);


// ---------- main process ---------- //

const log = Logger.createLogger();
log.debug("Command options : %s", JSON.stringify(program.opts(), null, "  "));

program.platforms.forEach((platform: string, index: number, array: any[]) => {
  const packager = GeneralTyranoPackager.instance(Platform.valueOf(platform));
  packager.package(GeneralTyranoPackager.createParameter(platform, program.opts()));
});
