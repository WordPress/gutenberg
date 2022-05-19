# Babel Plugin Makepot

Babel plugin used to scan JavaScript files for use of localization functions. It then compiles these into a [gettext POT formatted](https://en.wikipedia.org/wiki/Gettext) file as a template for translation. By default the output file will be written to `gettext.pot` of the root project directory. This can be overridden using the `"output"` option of the plugin.

```json
{
	"plugins": [
		[
			"@wordpress/babel-plugin-makepot",
			{ "output": "languages/myplugin.pot" }
		]
	]
}
```

## Installation

Install the module:

```bash
npm install @wordpress/babel-plugin-makepot --save-dev
```

**Note**: This package requires Node.js 12.0.0 or later. It is not compatible with older versions.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
