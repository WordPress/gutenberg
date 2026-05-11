/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../i18n-no-flanking-whitespace';

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'i18n-no-flanking-whitespace', rule, {
	valid: [
		{
			code: `__( 'Hello World…' )`,
		},
		{
			code: '__( `A long string ` +\n `spread over ` +\n  `multiple lines.` );',
		},
		{
			code: `__( 'Not concerned about   \t whitespace rules')`,
		},
	],
	invalid: [
		{
			code: '__( "Double quoted string with a trailing newline\\n" );',
			output: `__( 'Double quoted string with a trailing newline' );`,
			errors: [ { messageId: 'noFlankingWhitespace' } ],
		},
		{
			code: `__( ' Leading whitespace.' );`,
			output: `__( 'Leading whitespace.' );`,
			errors: [ { messageId: 'noFlankingWhitespace' } ],
		},
		{
			code: `__( 'Trailing whitespace. ' );`,
			output: `__( 'Trailing whitespace.' );`,
			errors: [ { messageId: 'noFlankingWhitespace' } ],
		},
		{
			code: `__( ' Flanking whitespace. ' );`,
			output: `__( 'Flanking whitespace.' );`,
			errors: [ { messageId: 'noFlankingWhitespace' } ],
		},
		{
			code: '__( "\tLeading tab." );',
			output: `__( 'Leading tab.' );`,
			errors: [ { messageId: 'noFlankingWhitespace' } ],
		},
		{
			code: '__( "\u0009Leading unicode tab." );',
			output: `__( 'Leading unicode tab.' );`,
			errors: [ { messageId: 'noFlankingWhitespace' } ],
		},
		{
			code: `__( "Trailing tab.\t" );`,
			output: `__( 'Trailing tab.' );`,
			errors: [ { messageId: 'noFlankingWhitespace' } ],
		},
		{
			code: `__( "\tFlanking tab.\t" );`,
			output: `__( 'Flanking tab.' );`,
			errors: [ { messageId: 'noFlankingWhitespace' } ],
		},

		{
			code: '__( ` Template literals ` )',
			errors: [ { messageId: 'noFlankingWhitespace' } ],
		},
	],
} );
