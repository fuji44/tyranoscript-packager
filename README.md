# tyranoscript-packager

This is a CLI tool for packaging Typescript apps.
Useful for automation such as linking with CI tools.

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
