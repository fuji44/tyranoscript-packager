import * as fs from "fs"
import * as path from "path"
import { WindowsTyranoPackager, GeneralTyranoPackager, Platform, WindowsPackagingParameter } from "../TyranoPackager"
import { NwjsManifest, NwjsManifestPosition, NwjsManifestWindow, NwjsManifestWebkit } from "../NwjsManifest"


// ---------- Platform.valueOf ---------- //

test("Platform.valueOf : Windows", () => {
  expect(Platform.valueOf("win")).toBe(Platform.Windows);
});

test("Platform.valueOf : macOS", () => {
  expect(Platform.valueOf("mac")).toBe(Platform.macOS);
});

test("Platform.valueOf : unknown", () => {
  expect(Platform.valueOf("linux")).toBe(Platform.Unknown);
  expect(Platform.valueOf("aix")).toBe(Platform.Unknown);
  expect(Platform.valueOf("tron")).toBe(Platform.Unknown);
});


// ---------- GeneralTyranoPackager.instance ---------- //

test("GeneralTyranoPackager.instance : supported", () => {
  const winPackager = GeneralTyranoPackager.instance(Platform.Windows);
  expect(winPackager).toBeInstanceOf(WindowsTyranoPackager);
});

test("GeneralTyranoPackager.instance : unsupported", () => {
  expect(() => {
    GeneralTyranoPackager.instance(Platform.Unknown);
  }).toThrow();
});


// ---------- GeneralTyranoPackager.createParameter ---------- //

test("GeneralTyranoPackager.createParameter : Windows param : test all value", () => {
  const param = GeneralTyranoPackager.createParameter(Platform.Windows, {
    gameName: "dummyGameName",
    title: "dummyTitle",
    resizable: true,
    width: 350,
    height: 300,
    maxWidth: 250,
    maxHeight: 200,
    minWidth: 150,
    minHeight: 100,
    appDir: "dummyAppDir",
    destDir: "dummyDestDir",
    exeName: "dummyExeName"
  }) as WindowsPackagingParameter;

  // ----- PackagingParameter values
  // path
  expect(param.tyranoAppDirPath).toBe(path.resolve("dummyAppDir"));
  expect(param.destDirPath).toBe(path.join(path.resolve("dummyDestDir"), "win"));

  // manifest
  expect(param.nwjsManifest.name).toBe("dummyGameName");
  expect(param.nwjsManifest.main).toBe("app://./index.html");
  expect(param.nwjsManifest.window.title).toBe("dummyTitle");
  expect(param.nwjsManifest.window.icon).toBe("link.png");
  expect(param.nwjsManifest.window.toolbar).toBeFalsy();
  expect(param.nwjsManifest.window.frame).toBeTruthy();
  expect(param.nwjsManifest.window.position).toBe(NwjsManifestPosition.mouse);
  expect(param.nwjsManifest.window.resizable).toBeTruthy();
  expect(param.nwjsManifest.window.width).toBe(350);
  expect(param.nwjsManifest.window.height).toBe(300);
  expect(param.nwjsManifest.window.max_width).toBe(250);
  expect(param.nwjsManifest.window.max_height).toBe(200);
  expect(param.nwjsManifest.window.min_width).toBe(150);
  expect(param.nwjsManifest.window.min_height).toBe(100);
  expect(param.nwjsManifest.webkit.plugin).toBeTruthy();

  // ----- WindowsPackagingParameter only values
  expect(param.exeFileName).toBe("dummyExeName");
});

test("GeneralTyranoPackager.createParameter : Windows param : test exeName. case unset exeName", () => {
  const param = GeneralTyranoPackager.createParameter(Platform.Windows, {
    gameName: "dummyGameName",
    title: "dummyTitle",
    resizable: true,
    width: 350,
    height: 300,
    maxWidth: 250,
    maxHeight: 200,
    minWidth: 150,
    minHeight: 100,
    appDir: "dummyAppDir",
    destDir: "dummyDestDir"
    // unset exeName
  }) as WindowsPackagingParameter;

  // ----- WindowsPackagingParameter only values
  expect(param.exeFileName).toBe("dummyGameName");
});

test("GeneralTyranoPackager.createParameter : Windows param : test exeName. case unset gameName and exeName", () => {
  const param = GeneralTyranoPackager.createParameter(Platform.Windows, {
    // unset gameName
    title: "dummyTitle",
    resizable: true,
    width: 350,
    height: 300,
    maxWidth: 250,
    maxHeight: 200,
    minWidth: 150,
    minHeight: 100,
    appDir: "dummyAppDir",
    destDir: "dummyDestDir"
    // unset exeName
  }) as WindowsPackagingParameter;

  // ----- WindowsPackagingParameter only values
  expect(param.exeFileName).toBe("dummyAppDir");
});

test("GeneralTyranoPackager.createParameter : Unknown platform", () => {
  expect(() => {
    GeneralTyranoPackager.createParameter("dummyPlatform", {
      // unset gameName
      title: "dummyTitle",
      resizable: true,
      width: 350,
      height: 300,
      maxWidth: 250,
      maxHeight: 200,
      minWidth: 150,
      minHeight: 100,
      appDir: "dummyAppDir",
      destDir: "dummyDestDir"
      // unset exeName
    });
  }).toThrow("Unsupported platform : dummyPlatform");
});



// ---------- GeneralTyranoPackager.validate ---------- //

test("GeneralTyranoPackager.validate : correct", () => {
  const param = {
    tyranoAppDirPath: path.join(__dirname, "dummyTyranoApp/correct")
  } as WindowsPackagingParameter;
  const result = new WindowsTyranoPackager().validate(param);
  expect(result.isError).toBeFalsy();
});

test("GeneralTyranoPackager.validate : nothing tyrano app dir", () => {
  const param = {
    tyranoAppDirPath: path.join(__dirname, "nothingDir")
  } as WindowsPackagingParameter;
  const result = new WindowsTyranoPackager().validate(param);
  expect(result.isError).toBeTruthy();
  expect(result.messages.length).toBe(4);
  const message0 = "not exist or cannot be read : " + param.tyranoAppDirPath;
  expect(result.messages[0]).toBe(message0);
  const message1 = "not exist or cannot be read : " + path.join(param.tyranoAppDirPath, "data");
  expect(result.messages[1]).toBe(message1);
  const message2 = "not exist or cannot be read : " + path.join(param.tyranoAppDirPath, "tyrano");
  expect(result.messages[2]).toBe(message2);
  const message3 = "not exist or cannot be read : " + path.join(param.tyranoAppDirPath, "index.html");
  expect(result.messages[3]).toBe(message3);
});

test("GeneralTyranoPackager.validate : nothing data dir", () => {
  const param = {
    tyranoAppDirPath: path.join(__dirname, "dummyTyranoApp/nothingData")
  } as WindowsPackagingParameter;
  const result = new WindowsTyranoPackager().validate(param);
  expect(result.isError).toBeTruthy();
  expect(result.messages.length).toBe(1);
  const message = "not exist or cannot be read : " + path.join(param.tyranoAppDirPath, "data");
  expect(result.messages[0]).toBe(message);
});

test("GeneralTyranoPackager.validate : nothing tyrano dir", () => {
  const param = {
    tyranoAppDirPath: path.join(__dirname, "dummyTyranoApp/nothingTyrano")
  } as WindowsPackagingParameter;
  const result = new WindowsTyranoPackager().validate(param);
  expect(result.isError).toBeTruthy();
  expect(result.messages.length).toBe(1);
  const message = "not exist or cannot be read : " + path.join(param.tyranoAppDirPath, "tyrano");
  expect(result.messages[0]).toBe(message);
});

test("GeneralTyranoPackager.validate : nothing tyrano dir", () => {
  const param = {
    tyranoAppDirPath: path.join(__dirname, "dummyTyranoApp/nothingIndexHtml")
  } as WindowsPackagingParameter;
  const result = new WindowsTyranoPackager().validate(param);
  expect(result.isError).toBeTruthy();
  expect(result.messages.length).toBe(1);
  const message = "not exist or cannot be read : " + path.join(param.tyranoAppDirPath, "index.html");
  expect(result.messages[0]).toBe(message);
});


// ---------- WindowsTyranoPackager.package ---------- //

test("WindowsTyranoPackager.package : success", async () => {
  const manifest = {
    "name": "gameName",
    "main": "app://./index.html",
    "window": {
      "title": "title",
      "icon": "link.png",
      "toolbar": false,
      "frame": true,
      "position": NwjsManifestPosition.mouse,
      "resizable": true,
      "width": 1280,
      "height": 720,
      "max_width": 1920,
      "max_height": 1080,
      "min_width": 640,
      "min_height": 480
    } as NwjsManifestWindow,
    "webkit": {
      "plugin": true
    } as NwjsManifestWebkit
  } as NwjsManifest;
  const param = {
    tyranoAppDirPath: path.join(__dirname, "dummyTyranoApp/correct"),
    destDirPath: path.join(__dirname, "../../dest/test/package/success"),
    nwjsManifest: manifest,
    exeFileName: "gameRun"
  } as WindowsPackagingParameter;

  const packager = new WindowsTyranoPackager();
  await packager.package(param);

  const exeFilePath = path.join(param.destDirPath, param.exeFileName + ".exe");
  expect(fs.existsSync(exeFilePath)).toBeTruthy();
  expect(fs.statSync(exeFilePath).size).toBeGreaterThan(fs.statSync(packager.nwjsExePath).size);
});

test("WindowsTyranoPackager.package : validate error", async () => {
  const manifest = {
    "name": "gameName",
    "main": "app://./index.html",
    "window": {
      "title": "title",
      "icon": "link.png",
      "toolbar": false,
      "frame": true,
      "position": NwjsManifestPosition.mouse,
      "resizable": true,
      "width": 1280,
      "height": 720,
      "max_width": 1920,
      "max_height": 1080,
      "min_width": 640,
      "min_height": 480
    } as NwjsManifestWindow,
    "webkit": {
      "plugin": true
    } as NwjsManifestWebkit
  } as NwjsManifest;
  const param = {
    tyranoAppDirPath: path.join(__dirname, "dummyTyranoApp/nothingData"),
    destDirPath: path.join(__dirname, "../../dest/test/package/validateError"),
    nwjsManifest: manifest,
    exeFileName: "gameRun"
  } as WindowsPackagingParameter;

  const packager = new WindowsTyranoPackager();
  await packager.package(param);

  expect(fs.existsSync(param.destDirPath)).toBeFalsy();
  const exeFilePath = path.join(param.destDirPath, param.exeFileName + ".exe");
  expect(fs.existsSync(exeFilePath)).toBeFalsy();
});
