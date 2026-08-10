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

In addition to the default preset, there is also a SCSS preset, 2 stylistic variant presets, and a preset for the WordPress projects themselves.

### SCSS

This preset extends both `@wordpress/stylelint-config` and [`stylelint-config-recommended-scss`](https://github.com/kristerkari/stylelint-config-recommended-scss).

```json
{
	"extends": [ "@wordpress/stylelint-config/scss" ]
}
```

### Stylistic

This preset extends `@wordpress/stylelint-config` and adds stylistic rules such as `indentation`.

```json
{
	"extends": [ "@wordpress/stylelint-config/stylistic" ]
}
```

### SCSS Stylistic

This preset extends`@wordpress/stylelint-config`, `@wordpress/stylelint-config/stylistic` and `@wordpress/stylelint-config/scss`, and adapts some stylistic rules for SCSS.

```json
{
	"extends": [ "@wordpress/stylelint-config/scss-stylistic" ]
}
```

### Project

This preset extends `@wordpress/stylelint-config/scss-stylistic` with the rules shared by the WordPress projects that lint their own stylesheets — Gutenberg and WordPress Core. Compared to `scss-stylistic` it turns off the stylistic and SCSS rules those codebases do not follow, adds accessibility rules for the `order` property and reversed `flex-direction` values, and relaxes `selector-class-pattern` to allow BEM-style class names.

Use it if you want to match how WordPress itself is linted. If you are configuring a theme or plugin, one of the presets above is likely a better fit.

```json
{
	"extends": [ "@wordpress/stylelint-config/project" ]
}
```

## Extending the config

Simply add a `"rules"` key to your config and add your overrides there.

For example, to change the `indentation` to four spaces and turn off the `number-leading-zero` rule:

```json
{
	"extends": "@wordpress/stylelint-config/stylistic",
	"rules": {
		"@stylistic/indentation": 4,
		"@stylistic/number-leading-zero": null
	}
}
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
