# stylelint config

[stylelint](https://stylelint.io/) configuration rules to ensure your CSS is compliant with the [WordPress CSS Coding Standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/css/).

## Installation

```bash
$ npm install @wordpress/stylelint-config --save-dev
```

**Note**: This package requires Node.js version with long-term support status (check [Active LTS or Maintenance LTS releases](https://nodejs.org/en/about/previous-releases)). It is not compatible with older versions.

## Usage

If you've installed `@wordpress/stylelint-config` locally within your project, just set your `stylelint` config to:

```json
{
	"extends": "@wordpress/stylelint-config"
}
```

If you've globally installed `@wordpress/stylelint-config` using the `-g` flag, then you'll need to use the absolute path to `@wordpress/stylelint-config` in your config:

```json
{
	"extends": "/absolute/path/to/@wordpress/stylelint-config"
}
```

## Presets

In addition to the default preset, there is also a SCSS preset. This preset extends both `@wordpress/stylelint-config` and [`stylelint-config-recommended-scss`](https://github.com/kristerkari/stylelint-config-recommended-scss).

### SCSS

```json
{
	"extends": [ "@wordpress/stylelint-config/scss" ]
}
```

## Extending the config

Simply add a `"rules"` key to your config and add your overrides there.

For example, to change the `indentation` to four spaces and turn off the `number-leading-zero` rule:

```json
{
	"extends": "@wordpress/stylelint-config",
	"rules": {
		"indentation": 4,
		"number-leading-zero": null
	}
}
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
