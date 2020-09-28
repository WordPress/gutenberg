/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../no-global-active-element';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'no-global-active-element', rule, {
	valid: [
		{
			code: 'ownerDocument.activeElement;',
		},
	],
	invalid: [
		{
			code: 'document.activeElement;',
			errors: [ { message: 'Avoid global active element' } ],
		},
	],
} );
