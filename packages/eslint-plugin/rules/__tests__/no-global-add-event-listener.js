/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../no-global-add-event-listener';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'no-global-add-event-listener', rule, {
	valid: [
		{
			code: 'ownerDocument.addEventListener();',
		},
		{
			code: 'ownerDocument.removeEventListener();',
		},
		{
			code: 'defaultView.addEventListener();',
		},
		{
			code: 'defaultView.removeEventListener();',
		},
	],
	invalid: [
		{
			code: 'document.addEventListener();',
			errors: [
				{
					message:
						'Avoid using globals in combination with (add|remove)EventListener. Use a `ownerDocument` or `defaultView` on a ref instead.',
				},
			],
		},
		{
			code: 'document.removeEventListener();',
			errors: [
				{
					message:
						'Avoid using globals in combination with (add|remove)EventListener. Use a `ownerDocument` or `defaultView` on a ref instead.',
				},
			],
		},
		{
			code: 'window.addEventListener();',
			errors: [
				{
					message:
						'Avoid using globals in combination with (add|remove)EventListener. Use a `ownerDocument` or `defaultView` on a ref instead.',
				},
			],
		},
		{
			code: 'window.removeEventListener();',
			errors: [
				{
					message:
						'Avoid using globals in combination with (add|remove)EventListener. Use a `ownerDocument` or `defaultView` on a ref instead.',
				},
			],
		},
	],
} );
