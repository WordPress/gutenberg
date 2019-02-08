# Enforce dependencies docblocks formatting (dependency-group)

Ensures that all top-level package imports adhere to the dependencies grouping conventions as outlined in the [Coding Guidelines](https://github.com/WordPress/gutenberg/blob/master/docs/contributors/coding-guidelines.md#imports).

Specifically, this ensures that:

- An import is preceded by "External dependencies", "WordPress dependencies", or "Internal dependencies" as appropriate by the import source.

## Rule details

Examples of **incorrect** code for this rule:

```js
import { get } from 'lodash';
import { Component } from '@wordpress/element';
import edit from './edit';
```

Examples of **correct** code for this rule:

```js
/*
 * External dependencies
 */
import { get } from 'lodash';

/*
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/*
 * Internal dependencies
 */
import edit from './edit';
```
