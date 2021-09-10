# Base Styles

Base SCSS utilities and variables for WordPress.

## Installation

Install the module

```bash
npm install @wordpress/base-styles --save-dev
```

## Use

### SCSS utilities and variables

In your application's SCSS file, include styles like so:

```scss
@import 'node_modules/@wordpress/base-styles/colors';
@import 'node_modules/@wordpress/base-styles/variables';
@import 'node_modules/@wordpress/base-styles/mixins';
@import 'node_modules/@wordpress/base-styles/breakpoints';
@import 'node_modules/@wordpress/base-styles/animations';
@import 'node_modules/@wordpress/base-styles/z-index';
@import 'node_modules/@wordpress/base-styles/default-custom-properties';
```

If you use [Webpack](https://webpack.js.org/) for your SCSS pipeline, you can use `~` to resolve to `node_modules`:

```scss
@import '~@wordpress/base-styles/colors';
```

To make that work with [`sass`](https://www.npmjs.com/package/sass) or [`node-sass`](https://www.npmjs.com/package/node-sass) NPM modules without Webpack, you'd have to use [includePaths option](https://sass-lang.com/documentation/js-api#includepaths):

```json
{
	"includePaths": [ "node_modules" ]
}
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
