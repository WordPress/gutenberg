/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../no-global-get-selection';

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'no-global-get-selection', rule, {
	valid: [
		{
			code: 'defaultView.getSelection();',
		},
	],
	invalid: [
		{
			code: 'window.getSelection();',
			errors: [
				{
					message:
						'Avoid accessing the selection with a global. Use the ownerDocument.defaultView property on a node ref instead.',
				},
			],
		},
	],
} );
