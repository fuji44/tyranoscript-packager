# tyranoscript-packager

This is a CLI tool for packaging Typescript apps.

## Installation

```
npm install tyranoscript-packager --save
```

If you don't want to install it, you can use `npm link`. You may need to specify `sudo`.

```
git clone git@github.com:fuji44/tyranoscript-packager.git
cd tyranoscript-packager
npm install --save
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
