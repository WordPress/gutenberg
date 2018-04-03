# stylelint-config-wordpress
[![NPM version](http://img.shields.io/npm/v/stylelint-config-wordpress.svg)](https://www.npmjs.org/package/stylelint-config-wordpress) [![Build Status](https://api.travis-ci.org/WordPress-Coding-Standards/stylelint-config-wordpress.svg?branch=master)](https://travis-ci.org/WordPress-Coding-Standards/stylelint-config-wordpress) [![Build status](https://ci.appveyor.com/api/projects/status/e5bv7cgn83ci69lo?svg=true)](https://ci.appveyor.com/project/WordPress-Coding-Standards/stylelint-config-wordpress)

> WordPress shareable config for stylelint.

Configuration rules to ensure your CSS is compliant with the [WordPress CSS Coding Standards](https://make.wordpress.org/core/handbook/best-practices/coding-standards/css/).

-   `stylelint-config-wordpress` extends [`stylelint-config-recommended`](https://github.com/stylelint/stylelint-config-recommended)

## Table of Contents

-   [Installation](#installation)
-   [Usage](#usage)
-   [Presets](#presets)
-   [Extending the config](#extending-the-config)
-   [Changelog](#changelog)
-   [License](#license)

## Installation

```bash
$ npm install stylelint-config-wordpress --save-dev
```

## Usage

If you've installed `stylelint-config-wordpress` locally within your project, just set your `stylelint` config to:

```json
{
  "extends": "stylelint-config-wordpress"
}
```

If you've globally installed `stylelint-config-wordpress` using the `-g` flag, then you'll need to use the absolute path to `stylelint-config-wordpress` in your config:

```json
{
  "extends": "/absolute/path/to/stylelint-config-wordpress"
}
```

## Presets

In addition to the default preset, there is also a SCSS preset. This preset extends both `stylelint-config-wordpress` and [`stylelint-config-recommended-scss`](https://github.com/kristerkari/stylelint-config-recommended-scss).

### SCSS

```json
{
  "extends": [
    "stylelint-config-wordpress/scss"
  ]
}
```

## Extending the config

Simply add a `"rules"` key to your config and add your overrides there.

For example, to change the `indentation` to four spaces and turn off the `number-leading-zero` rule:


```json
{
  "extends": "stylelint-config-wordpress",
  "rules": {
    "indentation": 4,
    "number-leading-zero": null
  }
}
```

## [Changelog](CHANGELOG.md)

## [License](LICENSE)
