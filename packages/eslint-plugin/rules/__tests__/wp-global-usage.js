/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../wp-global-usage';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'wp-global-usage', rule, {
	valid: [
		{ code: "const text = 'SCRIPT_DEBUG'" },
		{ code: `if ( globalThis.IS_GUTENBERG_PLUGIN ) {}` },
		{ code: `if ( globalThis.IS_WORDPRESS ) {}` },
		{ code: `if ( globalThis.SCRIPT_DEBUG ) {}` },
		{ code: `if ( ! globalThis.IS_GUTENBERG_PLUGIN ) {}` },
		{
			// Ensure whitespace is ok.
			code: `if (
				globalThis.
				IS_GUTENBERG_PLUGIN
			) {}`,
		},
		{ code: `const test = globalThis.IS_GUTENBERG_PLUGIN ? foo : bar` },
		{ code: `const test = ! globalThis.IS_GUTENBERG_PLUGIN ? bar : foo` },
		{
			// Ensure whitespace is ok.
			code: `const test = ! globalThis.
				IS_GUTENBERG_PLUGIN ? bar : foo`,
		},
	],
	invalid: [
		{
			code: `if ( IS_GUTENBERG_PLUGIN ) {}`,
			errors: [
				{
					messageId: 'usedWithoutGlobalThis',
					data: { name: 'IS_GUTENBERG_PLUGIN' },
				},
			],
		},
		{
			code: `if ( SCRIPT_DEBUG ) {}`,
			errors: [
				{
					messageId: 'usedWithoutGlobalThis',
					data: { name: 'SCRIPT_DEBUG' },
				},
			],
		},
		{
			code: `if ( window[ 'IS_GUTENBERG_PLUGIN' ] ) {}`,
			errors: [
				{
					messageId: 'usedWithoutGlobalThis',
					data: { name: 'IS_GUTENBERG_PLUGIN' },
				},
			],
		},
		{
			code: `if ( true ) { globalThis.IS_GUTENBERG_PLUGIN === 2 }`,
			errors: [
				{
					messageId: 'usedOutsideConditional',
					data: { name: 'IS_GUTENBERG_PLUGIN' },
				},
			],
		},
		{
			code: `if ( globalThis.IS_GUTENBERG_PLUGIN === 2 ) {}`,
			errors: [
				{
					messageId: 'usedOutsideConditional',
					data: { name: 'IS_GUTENBERG_PLUGIN' },
				},
			],
		},
		{
			code: `if ( true || globalThis.IS_GUTENBERG_PLUGIN === 2 ) {}`,
			errors: [
				{
					messageId: 'usedOutsideConditional',
					data: { name: 'IS_GUTENBERG_PLUGIN' },
				},
			],
		},
		{
			code: `const isFeatureActive = globalThis.IS_GUTENBERG_PLUGIN;`,
			errors: [
				{
					messageId: 'usedOutsideConditional',
					data: { name: 'IS_GUTENBERG_PLUGIN' },
				},
			],
		},
	],
} );
