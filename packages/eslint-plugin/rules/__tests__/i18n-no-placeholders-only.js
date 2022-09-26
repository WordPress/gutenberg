/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../i18n-no-placeholders-only';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'i18n-no-placeholders-only', rule, {
	valid: [
		{
			code: `__( 'Hello %s' )`,
		},
		{
			code: `i18n.__( 'Hello %s' )`,
		},
		{
			code: `__( '%d%%' )`,
		},
	],
	invalid: [
		{
			code: `__( '%s' )`,
			errors: [ { messageId: 'noPlaceholdersOnly' } ],
		},
		{
			code: `__( '%s%s' )`,
			errors: [ { messageId: 'noPlaceholdersOnly' } ],
		},
		{
			code: `_x( '%1$s' )`,
			errors: [ { messageId: 'noPlaceholdersOnly' } ],
		},
		{
			code: `_n( '%s', '%s', number)`,
			errors: [
				{ messageId: 'noPlaceholdersOnly' },
				{ messageId: 'noPlaceholdersOnly' },
			],
		},
	],
} );
