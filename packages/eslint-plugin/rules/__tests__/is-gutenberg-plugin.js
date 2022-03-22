/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../is-gutenberg-plugin';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

const ERROR_MESSAGE =
	'The `process.env.IS_GUTENBERG_PLUGIN` constant should only be used as the condition in an if statement or ternary expression.';

ruleTester.run( 'is-gutenberg-plugin', rule, {
	valid: [
		{ code: `if ( process.env.IS_GUTENBERG_PLUGIN ) {}` },
		{ code: `if ( ! process.env.IS_GUTENBERG_PLUGIN ) {}` },
		{
			// Ensure whitespace is ok.
			code: `if (
				process.env.
				IS_GUTENBERG_PLUGIN
			) {}`,
		},
		{ code: `const test = process.env.IS_GUTENBERG_PLUGIN ? foo : bar` },
		{ code: `const test = ! process.env.IS_GUTENBERG_PLUGIN ? bar : foo` },
		{
			// Ensure whitespace is ok.
			code: `const test = ! process.env.
				IS_GUTENBERG_PLUGIN ? bar : foo`,
		},
	],
	invalid: [
		{
			code: `if ( IS_GUTENBERG_PLUGIN ) {}`,
			errors: [ { message: ERROR_MESSAGE } ],
		},
		{
			code: `if ( window[ 'IS_GUTENBERG_PLUGIN' ] ) {}`,
			errors: [ { message: ERROR_MESSAGE } ],
		},
		{
			code: `if ( true ) { process.env.IS_GUTENBERG_PLUGIN === 2 }`,
			errors: [ { message: ERROR_MESSAGE } ],
		},
		{
			code: `if ( process.env.IS_GUTENBERG_PLUGIN === 2 ) {}`,
			errors: [ { message: ERROR_MESSAGE } ],
		},
		{
			code: `if ( true || process.env.IS_GUTENBERG_PLUGIN === 2 ) {}`,
			errors: [ { message: ERROR_MESSAGE } ],
		},
		{
			code: `const isFeatureActive = process.env.IS_GUTENBERG_PLUGIN;`,
			errors: [ { message: ERROR_MESSAGE } ],
		},
	],
} );
