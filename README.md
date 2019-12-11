# tyranoscript-packager

[![Github Action](https://github.com/fuji44/tyranoscript-packager/workflows/Publish%20to%20npmjs/badge.svg)](https://github.com/fuji44/tyranoscript-packager)
[![npm version](https://badge.fury.io/js/tyranoscript-packager.svg)](https://badge.fury.io/js/tyranoscript-packager)

This is a CLI tool for packaging Tyranoscript apps.

The official tool “Tyranno Rider” is difficult to link with external tools, but with this tool you can easily link to CI / CD tools.

- Tyranoscript official web site: https://tyrano.jp/
- GitHub: https://github.com/ShikemokuMK/tyranoscript

*Currently only packaging for windows is possible. macOS packaging may eventually support it.*

Please refer to the [NW.js documentation](http://docs.nwjs.io/en/latest/For%20Users/Package%20and%20Distribute/) for information on packaging desktop apps.
I think that more advanced packaging can be done by using `nwjs-builder-phoenix`.


## Installation

If you are unfamiliar with npm, do the following.

```
npm install -g tyranoscript-packager
```

If you understand npm well and manage the tyrano app with npm, it is better to install it locally.

```
npm install --save-dev tyranoscript-packager
```

**Caution!** : Note that the windows and macos packages distributed on the official site contain `node_modules/` and `package.json`, so they are overwritten by local installation.

### Use without installation

If you don't want to install it, you can use `npm link`. You may need to specify `sudo`.

```
git clone git@github.com:fuji44/tyranoscript-packager.git
cd tyranoscript-packager
npm install
npm link
```

## Usage

Just run the `tyrano` command at the root of the application.
If successful, a file packaged in `./dest/` is created.

The application root directory should have `index.html`, `data/`, and `tyrano/`.

See the command help (`-h`) for details.

```
cd $tyrano_app_root_dir
tyrano
```

### Examples

This is an example of using via npm script.

Describe the command in `package.json` ...

```
  "scripts": {
    "package": "tyrano -d ./export -w 960 -H 640 -r"
  }
```

It can be used simply by executing it with the `npm run` command.

```
npm run package
```
