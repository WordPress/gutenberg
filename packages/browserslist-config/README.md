# @wordpress/browserslist-config

[WordPress Browserslist](https://make.wordpress.org/design/handbook/design-guide/browser-support/) shareable config for [Browserslist](https://www.npmjs.com/package/browserslist).

## Installation

Install the module

```shell
$ npm install @wordpress/browserslist-config
```

## Usage

Add this to your `package.json` file:

```json
"browserslist": [
	"extends @wordpress/browserslist-config"
]
```

This package when imported returns an array of supported browsers, for more configuration examples including Autoprefixer, Babel, ESLint, PostCSS, and stylelint see https://github.com/ai/browserslist-example#browserslist-example.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
