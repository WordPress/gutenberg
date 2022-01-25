/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../i18n-no-leading-or-trailing-whitespace';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'i18n-no-leading-or-trailing-whitespace', rule, {
	valid: [
		{
			code: `__( 'Hello World…' )`,
		},
		{
			code:
				'__( `A long string ` +\n `spread over ` +\n  `multiple lines.` );',
		},
		{
			code: `__( 'Not concerned about   \t whitespace rules')`,
		},
	],
	invalid: [
		{
			code: '__( "Double quoted string with a trailing newline\\n" );',
			output: `__( 'Double quoted string with a trailing newline' );`,
			errors: [ { messageId: 'noLeadingOrTrailingWhitespace' } ],
		},
		{
			code: `__( ' Leading whitespace.' );`,
			output: `__( 'Leading whitespace.' );`,
			errors: [ { messageId: 'noLeadingOrTrailingWhitespace' } ],
		},
		{
			code: `__( 'Trailing whitespace. ' );`,
			output: `__( 'Trailing whitespace.' );`,
			errors: [ { messageId: 'noLeadingOrTrailingWhitespace' } ],
		},
		{
			code: `__( ' Leading and trailing whitespace. ' );`,
			output: `__( 'Leading and trailing whitespace.' );`,
			errors: [ { messageId: 'noLeadingOrTrailingWhitespace' } ],
		},
		{
			code: '__( "\tLeading tab." );',
			output: `__( 'Leading tab.' );`,
			errors: [ { messageId: 'noLeadingOrTrailingWhitespace' } ],
		},
		{
			code: '__( "\u0009Leading unicode tab." );',
			output: `__( 'Leading unicode tab.' );`,
			errors: [ { messageId: 'noLeadingOrTrailingWhitespace' } ],
		},
		{
			code: `__( "Trailing tab.\t" );`,
			output: `__( 'Trailing tab.' );`,
			errors: [ { messageId: 'noLeadingOrTrailingWhitespace' } ],
		},
		{
			code: `__( "\tTrailing and leading tab.\t" );`,
			output: `__( 'Trailing and leading tab.' );`,
			errors: [ { messageId: 'noLeadingOrTrailingWhitespace' } ],
		},
	],
} );
