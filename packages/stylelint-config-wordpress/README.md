# stylelint-config-wordpress
[![NPM version](http://img.shields.io/npm/v/stylelint-config-wordpress.svg)](https://www.npmjs.org/package/stylelint-config-wordpress) [![Build Status](https://api.travis-ci.org/ntwb/stylelint-config-wordpress.svg?branch=master)](https://travis-ci.org/ntwb/stylelint-config-wordpress) [![Build status](https://ci.appveyor.com/api/projects/status/e5bv7cgn83ci69lo?svg=true)](https://ci.appveyor.com/project/ntwb/stylelint-config-wordpress)

> WordPress shareable config for stylelint.

Configuration rules to ensure your CSS is compliant with the [WordPress CSS Coding Standards](https://make.wordpress.org/core/handbook/best-practices/coding-standards/css/).

## Installation

```console
$ npm install stylelint-config-wordpress
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

### Extending the config

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
