/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../avoid-unguarded-getrangeat';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'avoid-unguarded-getrangeat', rule, {
	valid: [
		{
			code: `const selection = window.getSelection(); const range = selection.rangeCount ? selection.getRangeAt( 0 ) : null;`,
		},
	],
	invalid: [
		{
			code: `window.getSelection().getRangeAt( 0 );`,
			errors: [ { message: 'Avoid unguarded getRangeAt' } ],
		},
	],
} );
