# Enforce dependencies docblocks formatting (dependency-group)

Requires or forbids dependency group comments for top-level package imports. The Gutenberg [Coding Guidelines](https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/code/coding-guidelines.md#imports) use one contiguous import block without dependency group comments.

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
