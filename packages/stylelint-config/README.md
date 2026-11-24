# stylelint config

[stylelint](https://stylelint.io/) configuration rules to ensure your CSS is compliant with the [WordPress CSS Coding Standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/css/).

## Installation

```bash
$ npm install @wordpress/stylelint-config --save-dev
```

**Note**: This package requires Node.js version with long-term support status (check [Active LTS or Maintenance LTS releases](https://nodejs.org/en/about/previous-releases)). It is not compatible with older versions.

## Usage

Set your `stylelint` config to:

```json
{
	"extends": "@wordpress/stylelint-config"
}
```

Install `@wordpress/stylelint-config` locally in your project: Stylelint does not load configs from global `node_modules`.

## Presets

In addition to the default preset, there is also a SCSS preset and 2 stylistic variant presets.

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

This preset extends `@wordpress/stylelint-config`, `@wordpress/stylelint-config/stylistic` and `@wordpress/stylelint-config/scss`, and adapts some stylistic rules for SCSS.

```json
{
	"extends": [ "@wordpress/stylelint-config/scss-stylistic" ]
}
```

`@stylistic/stylelint-plugin` checks SCSS only with the rules in its `@stylistic/scss/` namespace, so this preset configures each stylistic rule under that name, such as `@stylistic/scss/indentation`. The preset parses every file with `postcss-scss`, so these rules check plain CSS files too, and one config covers both: you don't need to combine it with the Stylistic preset. Use the `@stylistic/scss/*` names to override a stylistic rule or to disable it in a comment, in CSS and SCSS files alike. The preset turns the `@stylistic/*` rules off.

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

With the SCSS Stylistic preset, override the same rules under the `@stylistic/scss/` namespace:

```json
{
	"extends": "@wordpress/stylelint-config/scss-stylistic",
	"rules": {
		"@stylistic/scss/indentation": 4,
		"@stylistic/scss/number-leading-zero": null
	}
}
```

### `custom-property-pattern`

The preset disallows `--_gcd-*` and `--_wp-*` custom properties. These are private and will break at any time.

Stylelint does not merge `custom-property-pattern` values. If your project already sets this rule, the preset ban is replaced — include `(?!_(?:gcd|wp)-)` in your pattern if you want to keep it, for example:

```json
{
	"extends": "@wordpress/stylelint-config",
	"rules": {
		"custom-property-pattern": "^(?!_(?:gcd|wp)-)my-prefix-.+"
	}
}
```

## Upgrading to Stylelint 18

This version requires Stylelint 18. To stay on Stylelint 17, keep using `@wordpress/stylelint-config@^27`. To upgrade:

1. Use Node.js `^22.22.2`, `^24.15.0` or `>=26.0.0`.
2. Update `stylelint` to `^18.0.0`, and `stylelint-scss` to `^7.5.0` if you use an SCSS preset. If you use `@wordpress/scripts`, update it instead: it brings both.
3. If you use the SCSS Stylistic preset, rename `@stylistic/*` rules to `@stylistic/scss/*` in your config and in `stylelint-disable` comments, for example `@stylistic/indentation` to `@stylistic/scss/indentation`. This applies to CSS files linted with this preset too: the preset turns the `@stylistic/*` rules off.
4. Run `stylelint --fix` to apply the new `indentation` of multi-line selectors that continue inside a pseudo-class such as `:where(`. Only whitespace changes.
5. Fix what the newly enabled rules report, or turn them off in your config: `at-charset-rule-no-invalid`, `selector-no-deprecated`, `selector-no-invalid`, `selector-no-unmatchable` and `value-no-invalid`. The SCSS presets enable only `selector-no-deprecated`.
6. If you extend the config by an absolute path, install it locally and extend it by name instead, or include the filename: `/absolute/path/to/@wordpress/stylelint-config/index.js`.

See the [Stylelint 18 migration guide](https://stylelint.io/migration-guide/to-18) for changes in Stylelint itself, such as stricter command-line flags and `declaration-property-value-no-unknown` checking the values of `var()`.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
