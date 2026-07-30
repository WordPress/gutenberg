/**
 * External dependencies
 */
import { describe, it } from 'vitest';

/**
 * Internal dependencies
 */
import configureRuleTester from '../../test-utils/configure-rule-tester';
import rule from '../no-global-active-element';

const RuleTester = configureRuleTester( { describe, it } );

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
