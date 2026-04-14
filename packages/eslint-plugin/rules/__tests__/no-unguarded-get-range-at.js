/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../no-unguarded-get-range-at';

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'no-unguarded-get-range-at', rule, {
	valid: [
		{
			code: `const selection = defaultView.getSelection(); const range = selection.rangeCount ? selection.getRangeAt( 0 ) : null;`,
		},
	],
	invalid: [
		{
			code: `defaultView.getSelection().getRangeAt( 0 );`,
			errors: [ { message: 'Avoid unguarded getRangeAt' } ],
		},
	],
} );
