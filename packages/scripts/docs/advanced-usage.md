## Advanced Usage

In general, this package should be used with the set of recommended config files. While it’s possible to override every single config file provided, if you have to do it, it means that your use case is far more complicated than anticipated. If that happens, it would be better to avoid using the whole abstraction layer and set up your project with full control over tooling used.

### Working with build scripts

The `build` and `start` commands use [webpack](https://webpack.js.org/) behind the scenes. webpack is a tool that helps you transform your code into something else. For example: it can take code written in ESNext and output ES5 compatible code that is minified for production.

#### Default webpack config

`@wordpress/scripts` bundles the default webpack config used as a base by the WordPress editor. These are the defaults:

-   [Entry](https://webpack.js.org/configuration/entry-context/#entry): the entry points for your project get detected by scanning all script fields in `block.json` files located in the `src` directory. The fallback entry point is `src/index.js` (other supported extensions: `.jsx`, `.ts`, and `.tsx`) in case there is no `block.json` file found.
-   [Output](https://webpack.js.org/configuration/output): `build/[name].js`, for example: `build/index.js`, or `build/my-block/index.js`.
-   [Loaders](https://webpack.js.org/loaders/):
    -   [`babel-loader`](https://webpack.js.org/loaders/babel-loader/) allows transpiling JavaScript and TypeScript files using Babel and webpack.
    -   [`@svgr/webpack`](https://www.npmjs.com/package/@svgr/webpack) and [`url-loader`](https://webpack.js.org/loaders/url-loader/) makes it possible to handle SVG files in JavaScript code.
    -   [`css-loader`](https://webpack.js.org/loaders/css-loader/) chained with [`postcss-loader`](https://webpack.js.org/loaders/postcss-loader/) and [sass-loader](https://webpack.js.org/loaders/sass-loader/) let webpack process CSS, SASS or SCSS files referenced in JavaScript files.
-   [Plugins](https://webpack.js.org/configuration/plugins) (among others):
    -   [`CopyWebpackPlugin`](https://webpack.js.org/plugins/copy-webpack-plugin/) copies all `block.json` files discovered in the `src` directory to the build directory.
    -   [`MiniCssExtractPlugin`](https://webpack.js.org/plugins/mini-css-extract-plugin/) extracts CSS into separate files. It creates a CSS file per JavaScript entry point which contains CSS.
    -   [`@wordpress/dependency-extraction-webpack-plugin`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/dependency-extraction-webpack-plugin/README.md) is used with the default configuration to ensure that WordPress provided scripts are not included in the built bundle.

#### Using CSS

_Example:_

```scss
// index.scss
$body-color: red;

.wp-block-my-block {
	color: $body-color;
}
```

```css
/* style.css */
.wp-block-my-block {
	background-color: black;
}
```

```js
// index.js
import './index.scss';
import './style.css';
```

When you run the build using the default command `wp-scripts build` (also applies to `start`) in addition to the JavaScript file `index.js` generated in the `build` folder, you should see two more files:

1. `index.css` – all imported CSS files are bundled into one chunk named after the entry point, which defaults to `index.js`, and thus the file created becomes `index.css`. This is for styles used only in the editor.
2. `style-index.css` – imported `style.css` file(s) (applies to SASS and SCSS extensions) get bundled into one `style-index.css` file that is meant to be used both on the front-end and in the editor.

You can also have multiple entry points as described in the docs for the script:

```bash
wp-scripts start entry-one.js entry-two.js --output-path=custom
```

If you do so, then CSS files generated will follow the names of the entry points: `entry-one.css` and `entry-two.css`.

Avoid using `style` keyword in an entry point name, this might break your build process.

You can also bundle CSS modules by prefixing `.module` to the extension, e.g. `style.module.scss`. Otherwise, these files are handled like all other `style.scss`. They will also be extracted into `style-index.css`.

#### Using fonts and images

It is possible to reference font (`woff`, `woff2`, `eot`, `ttf` and `otf`) and image (`bmp`, `png`, `jpg`, `jpeg`, `gif` and `wepb`) files from CSS that is controlled by webpack as explained in the previous section.

_Example:_

```css
/* style.css */
@font-face {
	font-family: Gilbert;
	src: url( ../assets/gilbert-color.otf );
}
.wp-block-my-block {
	background-color: url( ../assets/block-background.png );
	font-family: Gilbert;
}
```

#### Using SVG

_Example:_

```js
import starUrl, { ReactComponent as Star } from './star.svg';

const App = () => (
	<div>
		<img src={ starUrl } alt="star" />
		<Star />
	</div>
);
```

#### Provide your own webpack config

Should there be any situation where you want to provide your own webpack config, you can do so. The `build` and `start` commands will use your provided file when:

-   the command receives a `--config` argument. Example: `wp-scripts build --config my-own-webpack-config.js`.
-   there is a file called `webpack.config.js` or `webpack.config.babel.js` in the top-level directory of your project (at the same level as `package.json`).

##### Extending the webpack config

To extend the provided webpack config, or replace subsections within the provided webpack config, you can provide your own `webpack.config.js` file, `require` the provided `webpack.config.js` file, and use the [`spread` operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) to import all of or part of the provided configuration.

In the example below, a `webpack.config.js` file is added to the root folder extending the provided webpack config to include custom logic to parse module's source and convert it to a JavaScript object using [`toml`](https://www.npmjs.com/package/toml). It may be useful to import toml or other non-JSON files as JSON, without specific loaders:

```javascript
const toml = require( 'toml' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	module: {
		...defaultConfig.module,
		rules: [
			...defaultConfig.module.rules,
			{
				test: /.toml/,
				type: 'json',
				parser: {
					parse: toml.parse,
				},
			},
		],
	},
};
```

If you follow this approach, please, be aware that:

- You should keep using the `wp-scripts` commands (`start` and `build`). Do not use `webpack` directly.
- Future versions of this package may change what webpack and Babel plugins we bundle, default configs, etc. Should those changes be necessary, they will be registered in the [package’s CHANGELOG](https://github.com/WordPress/gutenberg/blob/HEAD/packages/scripts/CHANGELOG.md), so make sure to read it before upgrading.
