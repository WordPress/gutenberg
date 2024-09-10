# Rule Parser

This package provides a rule parser to evaluate logical rules into a boolean value.

## Installation

Install the module

```bash
npm install @wordpress/rule-parser --save
```

## API

> [!NOTE]
> This package is only meant to be used by implementors, not direct developers. implementors are then responsible for collecting rules from developers or users, either via UI (like Blocks Visibility), or code (like DataForms), evalute the rules against their provided context, and use the outcome however they see fit.

The package accepts rules in the shape of `[ source, operator, target ]` and can be infinitely nested on a variation of combinators, that resemble `||` (OR, ANY) or `&&` (AND, ALL).

### Examples of rules

1. Simple rule

```js
const rule = [ [ 'user.role', 'is', 'editor' ] ];
```

2. Array of rules

```js
const rules = [
	[ 'user.role', 'is', 'editor' ],
	[ 'post.categories', 'contain', 'tutorials' ],
];
```

3. Array of rules with explicit combinator. If no combinator is set, `ALL` will be used.

```js
const rules = [
	'ALL',
	[
		[ 'user.role', 'is', 'editor' ],
		[ 'post.categories', 'contain', 'tutorials' ],
	],
];
```

4. Nested arrays

```JS
const rules = [
    'ANY',
    [
        [ 'user.role', 'is', 'editor' ],
        [ 'post.categories', 'contain', 'tutorials' ],
        [
            'ALL',
            [
                [ 'user.id', 'in', [ 1, 2, 3 ] ],
                [ 'post.blocks', 'not contain', 'core/embed' ]
            ]
        ]
    ]
];
```

### Anatomy of a rule

A rule is made of 3 values, a source, an operator, and a target.

-   **Source**: which start as a rawSource (a string) that will be evaluated to a primitive (string, number, boolean) or an array of primitives, evaluation is done by using the context that the implementor provides.
-   **Operator**: a function that compares an evaluated source to a target value, this package ships with 10 operator, and provides the ability to alias them as well as providing new operators.
-   **Target**: a primitive (string, number, boolean) or an array of primitives (all the same type), targets are static at code/UI level, and should be considered static regardless of session and place (PHP or JS).

Along of combinators, an array of rules can be transformed to a single boolean.

### Usage

```js
import { parser } from "@wordpress/rule-parser";

const context = {
    'user.id': 1.
    'user.role': 'admin',
    'post.categories': [ 'tutorials' ],
    'post.blocks': [ 'core/paragraph', 'core/heading', 'woocommerce/checkout' ]
};

const rules = [
    'ANY',
    [
        [ 'user.role', 'is', 'editor' ],
        [ 'post.categories', 'contain', 'tutorials' ],
        [
            'ALL',
            [
                [ 'user.id', 'in', [ 1, 2, 3 ] ],
                [ 'post.blocks', 'not contain', 'core/embed' ]
            ]
        ]
    ]
];

const result = parser( rules, context );

console.log( result ); // true
```

### Operators

The package ships with a simple registry that allows you register a new operator or an alias to an operator. This should allow implementor to specify which rules they want to support, and even add additional ones that aren't covered by core.

```js
import { parser, registry } from '@wordpress/rule-parser';

registry.register( 'between', ( source, target, rule ) => {
	if ( typeof source !== 'number' ) {
		throw new TypeError( 'Source must be of number' );
	}

	if ( ! Array.isArray( target ) || target.length !== 2 ) {
		throw new TypeError( 'Target must be an array of 2 numbers.' );
	}

	const [ min, max ] = target;

	if ( typeof min !== 'number' || typeof max !== 'number' ) {
		throw new TypeError( 'Target must be an array of 2 numbers.' );
	}

	if ( min >= max ) {
		throw new TypeError( 'Min must be less than max.' );
	}

	return source >= min && source <= max;
} );

registry.alias( '<>', 'between' );

parser( [ [ 'cart.totals', '<>', [ 50, 100 ] ], { 'cart.totals': 75 } ); // true.
```

### Types

The package ships with a set of types that are used to define the structure of a rule, and the type of the values that are used in a rule.

```ts
import type { RawRule, Rules, EvaluatorFunction } from '@wordpress/rule-parser';

const rule: RawRule = [ 'user.id', 'is', 1 ];
const rules: Rules< RawRule > = [ 'ANY', [ rule ] ];
const customOperator: EvaluatorFunction = ( source, target, rule ) =>
	source === target;
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
