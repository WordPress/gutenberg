/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../no-global-active-element';

const ruleTester = new RuleTester( {
	languageOptions: {
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
			errors: [
				{
					message:
						'Avoid accessing the active element with a global. Use the ownerDocument property on a node ref instead.',
				},
			],
		},
	],
} );
