/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../no-wp-process-env';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'no-wp-process-env', rule, {
	valid: [
		{ code: 'process.env.NODE_ENV' },
		{ code: 'process.env.WHATEVER' },
		{ code: 'process.env[foo]' },
		{ code: 'process.env["foo"]' },
		{ code: `process['env']["foo"]` },
		{ code: "process['env'][`foo`]" },
		{ code: "process.env[`${ '' }IS_GUTENBERG_PLUGIN`]" },
		{ code: `a.b.c` },
		{ code: `x['y']['z']` },
		{ code: `d[e][f]` },
		{ code: `process[ (()=>'env')() ][ {_:'SCRIPT_DEBUG'}['_'] ]` },
	],
	invalid: [
		{
			code: 'process.env.IS_GUTENBERG_PLUGIN',
			errors: [ { messageId: 'useGlobalThis' } ],
			output: 'globalThis.IS_GUTENBERG_PLUGIN',
		},
		{
			code: 'process.env.SCRIPT_DEBUG',
			errors: [ { messageId: 'useGlobalThis' } ],
			output: 'globalThis.SCRIPT_DEBUG',
		},
		{
			code: 'process.env.IS_WORDPRESS_CORE',
			errors: [ { messageId: 'useGlobalThis' } ],
			output: 'globalThis.IS_WORDPRESS_CORE',
		},
		{
			code: `process['env']["IS_GUTENBERG_PLUGIN"]`,
			errors: [ { messageId: 'useGlobalThis' } ],
			output: 'globalThis.IS_GUTENBERG_PLUGIN',
		},
		{
			code: 'process[`env`][`IS_GUTENBERG_PLUGIN`]',
			errors: [ { messageId: 'useGlobalThis' } ],
			output: 'globalThis.IS_GUTENBERG_PLUGIN',
		},
		{
			code: 'process.env.GUTENBERG_PHASE',
			errors: [ { messageId: 'noGutenbergPhase' } ],
		},
	],
} );
