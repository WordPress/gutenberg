# Build Commands

## build

Transforms your code according the configuration provided so it’s ready for production and optimized for the best performance.

_This script exits after producing a single build. For incremental builds, better suited for development, see the [start](#start) script._

The entry points for your project get detected by scanning all script fields in `block.json` files located in the `src` directory. The script fields in `block.json` should pass relative paths to `block.json` in the same folder.

_Example:_

```json
{
	"editorScript": "file:index.js",
	"script": "file:script.js",
	"viewScript": "file:view.js"
}
```

The fallback entry point is `src/index.js` (other supported extensions: `.jsx`, `.ts`, and `.tsx`) in case there is no `block.json` file found. In that scenario, the output generated will be written to `build/index.js`.

### Available options

This script automatically uses the optimized config but sometimes you may want to specify some custom options:

-   `--webpack-bundle-analyzer` – enables visualization for the size of webpack output files with an interactive zoomable treemap.
-   `--webpack-copy-php` – enables copying all PHP files from the source directory ( default is `src` ) and its subfolders to the output directory.
-   `--webpack-no-externals` – disables scripts' assets generation, and omits the list of default externals.
-   `--webpack-src-dir` – Allows customization of the source code directory. Default is `src`.

### Examples

This is how you execute the script with presented setup:

```json
{
	"scripts": {
		"build": "wp-scripts build",
		"build:custom": "wp-scripts build entry-one.js entry-two.js --output-path=custom",
		"build:copy-php": "wp-scripts build --webpack-copy-php",
		"build:custom-directory": "wp-scripts build --webpack-src-dir=custom-directory"
	}
}
```
-   `npm run build` - builds the code for production.
-   `npm run build:custom` - builds the code for production with two entry points and a custom output directory. Paths for custom entry points are relative to the project root.
-   `npm run build:copy-php` - builds the code for production and opts into copying all PHP files from the `src` directory and its subfolders to the output directory. By default, only PHP files listed in the `render` field in the detected `block.json` files get copied.
-   `build:custom-directory` - builds the code for production using the `custom-directory` as the source code directory.


### Advanced information

This script uses [webpack](https://webpack.js.org/) behind the scenes. It’ll look for a webpack config in the top-level directory of your package and will use it if it finds one. If none is found, it’ll use the default config provided by `@wordpress/scripts` packages. Learn more in the [Advanced Usage](#advanced-usage) section.

## start

Transforms your code according the configuration provided so it’s ready for development. The script will automatically rebuild if you make changes to the code, and you will see the build errors in the console.

_For single builds, better suited for production, see the [build](#build) script._

The entry points for your project get detected by scanning all script fields in `block.json` files located in the `src` directory. The script fields in `block.json` should pass relative paths to `block.json` in the same folder.

_Example:_

```json
{
	"editorScript": "file:index.js",
	"script": "file:script.js",
	"viewScript": "file:view.js"
}
```

The fallback entry point is `src/index.js` (other supported extensions: `.jsx`, `.ts`, and `.tsx`) in case there is no `block.json` file found. In that scenario, the output generated will be written to `build/index.js`.


### Available options

This script automatically use the optimized config but sometimes you may want to specify some custom options:

-   `--hot` – enables "Fast Refresh". The page will automatically reload if you make changes to the code. _For now, it requires that WordPress has the [`SCRIPT_DEBUG`](https://wordpress.org/support/article/debugging-in-wordpress/#script_debug) flag enabled and the [Gutenberg](https://wordpress.org/plugins/gutenberg/) plugin installed._
-   `--webpack-bundle-analyzer` – enables visualization for the size of webpack output files with an interactive zoomable treemap.
-   `--webpack-copy-php` – enables copying all PHP files from the source directory ( default is `src` ) and its subfolders to the output directory.
-   `--webpack-devtool` – controls how source maps are generated. See options at https://webpack.js.org/configuration/devtool/#devtool.
-   `--webpack-no-externals` – disables scripts' assets generation, and omits the list of default externals.
-   `--webpack-src-dir` – Allows customization of the source code directory. Default is `src`.

### Examples

```json
{
	"scripts": {
		"start": "wp-scripts start",
		"start:hot": "wp-scripts start --hot",
		"start:custom": "wp-scripts start entry-one.js entry-two.js --output-path=custom",
		"start:copy-php": "wp-scripts start --webpack-copy-php",
		"start:custom-directory": "wp-scripts start --webpack-src-dir=custom-directory"
	}
}
```

This is how you execute the script with presented setup:

-   `npm start` - starts the build for development.
-   `npm run start:hot` - starts the build for development with "Fast Refresh". The page will automatically reload if you make changes to the files.
-   `npm run start:custom` - starts the build for development which contains two entry points and a custom output directory. Paths for custom entry points are relative to the project root.
-   `npm run start:copy-php` - starts the build for development and opts into copying all PHP files from the `src` directory and its subfolders to the output directory. By default, only PHP files listed in the `render` field in the detected `block.json` files get copied.
-   `npm run start:custom-directory` - builds the code for production using the `custom-directory` as the source code directory.

### Advanced information

This script uses [webpack](https://webpack.js.org/) behind the scenes. It’ll look for a webpack config in the top-level directory of your package and will use it if it finds one. If none is found, it’ll use the default config provided by `@wordpress/scripts` packages. Learn more in the [Advanced Usage](#advanced-usage) section.
