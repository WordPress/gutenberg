/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../gutenberg-phase';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

const ACCESS_ERROR =
	'The `IS_GUTENBERG_PLUGIN` constant should be accessed using `process.env.IS_GUTENBERG_PLUGIN`.';
const IF_ERROR =
	'The `process.env.IS_GUTENBERG_PLUGIN` constant should only be used as the condition in an if statement or ternary expression.';

ruleTester.run( 'gutenberg-phase', rule, {
	valid: [
		{ code: `if ( process.env.IS_GUTENBERG_PLUGIN ) {}` },
		{ code: `if ( ! process.env.IS_GUTENBERG_PLUGIN ) {}` },
		{ code: `const test = process.env.IS_GUTENBERG_PLUGIN ? foo : bar` },
		{ code: `const test = ! process.env.IS_GUTENBERG_PLUGIN ? bar : foo` },
	],
	invalid: [
		{
			code: `if ( IS_GUTENBERG_PLUGIN ) {}`,
			errors: [ { message: ACCESS_ERROR }, { message: IF_ERROR } ],
		},
		{
			code: `if ( window[ 'IS_GUTENBERG_PLUGIN' ] ) {}`,
			errors: [ { message: ACCESS_ERROR }, { message: IF_ERROR } ],
		},
		{
			code: `if ( true ) { process.env.IS_GUTENBERG_PLUGIN === 2 }`,
			errors: [ { message: IF_ERROR } ],
		},
		{
			code: `if ( process.env.IS_GUTENBERG_PLUGIN === 2 ) {}`,
			errors: [ { message: IF_ERROR } ],
		},
		{
			code: `if ( true || process.env.IS_GUTENBERG_PLUGIN === 2 ) {}`,
			errors: [ { message: IF_ERROR } ],
		},
		{
			code: `const isFeatureActive = process.env.IS_GUTENBERG_PLUGIN;`,
			errors: [ { message: IF_ERROR } ],
		},
	],
} );
