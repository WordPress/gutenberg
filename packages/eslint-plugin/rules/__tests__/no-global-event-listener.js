/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../no-global-event-listener';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'no-global-event-listener', rule, {
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
						'Avoid using (add|remove)EventListener with globals. Use `ownerDocument` or `ownerDocument.defaultView` on a node ref instead.',
				},
			],
		},
		{
			code: 'document.removeEventListener();',
			errors: [
				{
					message:
						'Avoid using (add|remove)EventListener with globals. Use `ownerDocument` or `ownerDocument.defaultView` on a node ref instead.',
				},
			],
		},
		{
			code: 'window.addEventListener();',
			errors: [
				{
					message:
						'Avoid using (add|remove)EventListener with globals. Use `ownerDocument` or `ownerDocument.defaultView` on a node ref instead.',
				},
			],
		},
		{
			code: 'window.removeEventListener();',
			errors: [
				{
					message:
						'Avoid using (add|remove)EventListener with globals. Use `ownerDocument` or `ownerDocument.defaultView` on a node ref instead.',
				},
			],
		},
	],
} );
