# Enforce dependencies docblocks formatting (dependency-group)

Ensures that all top-level package imports adhere to the dependencies grouping conventions as outlined in the [Coding Guidelines](https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/code/coding-guidelines.md#imports).

Specifically, this ensures that:

-   An import is preceded by "External dependencies", "WordPress dependencies", or "Internal dependencies" as appropriate by the import source.

## Options

This rule accepts a single option, which can be one of the following:

-   `"always"` (default): Enforce that dependency group comments are present.
-   `"never"`: Forbid dependency group comments.

Example configuration:

```json
{
	"rules": {
		"@wordpress/dependency-group": [ "error", "always" ]
	}
}
```

Or to forbid dependency group comments:

```json
{
	"rules": {
		"@wordpress/dependency-group": [ "error", "never" ]
	}
}
```

## Rule details

### `"always"` (default)

Examples of **incorrect** code for this rule:

```js
import { camelCase } from 'change-case';
import { Component } from 'react';
import edit from './edit';
```

Examples of **correct** code for this rule:

```js
/*
 * External dependencies
 */
import { camelCase } from 'change-case';

/*
 * WordPress dependencies
 */
import { Component } from 'react';

/*
 * Internal dependencies
 */
import edit from './edit';
```

### `"never"`

Examples of **incorrect** code for this rule with `"never"` option:

```js
/*
 * External dependencies
 */
import { camelCase } from 'change-case';

/*
 * Internal dependencies
 */
import edit from './edit';
```

Examples of **correct** code for this rule with `"never"` option:

```js
import { camelCase } from 'change-case';
import { Component } from 'react';
import edit from './edit';
```
