# Stylelint Plugin

[Stylelint](https://stylelint.io/) plugin including configurations and custom rules for WordPress development.

## Installation

Install the module

```bash
npm install @wordpress/stylelint-plugin --save-dev
```

## Usage

To opt-in to the default configuration, extend your own project's `.stylelintrc.json` file:

```json
{
	"extends": [ "@wordpress/stylelint-plugin" ]
}
```


### Rules

Rule|Description
---|---
[stylelint-declaration-use-variable](https://github.com/sh-waqar/stylelint-declaration-use-variable)|Force use of scss variable on declaration


<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
