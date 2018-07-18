Babel Plugin Async Load
======

Some WordPress Scipts and styles are heavy. To avoid having to load all the scripts and styles synchronously, we can lazy load some of these scripts.

The idea of this babel plugin is that you write your WordPress Components as if they were synchronous but introduce lazy loading when bundling your code. This ensures the WordPress packages declare their dependencies as expected for npm consuption while having the possibility to lazy load some of these dependencies at runtime.

## Installation

Install the module to your project using [npm](https://www.npmjs.com/).

```bash
npm install @wordpress/babel-plugin-async-load
```

## Usage

Refer to the [Babel Plugins documentation](http://babeljs.io/docs/en/plugins) if you don't yet have experience working with Babel plugins.

Include `@wordpress/babel-plugin-async-load` as a plugin in your Babel configuration. Example:

```js
// .babelrc.js
module.exports = {
	plugins: [
		[
			'@wordpress/babel-plugin-async-load',
			{
				siteURLSource: '_wpSiteURL', // The global variable containing the WordPress base URL (needs to be defined).
				components: [
					{
						module: '@wordpress/components', // Source of the component to lazy load.
						component: 'CodeEditor', // Name of the compoonent to lazy load.
						scripts: [ // Array of WordPress script handles needed for the component to work properly.
							'wp-codemirror',
							'code-editor',
							'htmlhint',
							'htmlhint-kses',
							'csslint',
							'jshint',
						],
						styles: [ // Array of WordPress stylesheets handles needed for the component to work properly.
							'wp-codemirror',
							'code-editor',
						],
					},
				],
			}
		]
	],
};
```

This babel plugin wraps the lazy loaded component into the `wp.compose.lazyLoad` higher-order component. Make sure to add `wp-compose` to all your scripts that make use of lazy-loaded components.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
