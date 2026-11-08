import { describe, it } from 'vitest';
import configureRuleTester from '../../test-utils/configure-rule-tester';
import rule from '../i18n-no-flanking-whitespace';

const RuleTester = configureRuleTester( { describe, it } );

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
			errors: [ { messageId: 'noFlankingWhitespace' } ],
		},
		{
			code: `__( ' Leading whitespace.' );`,
			errors: [ { messageId: 'noFlankingWhitespace' } ],
		},
		{
			code: `__( 'Trailing whitespace. ' );`,
			errors: [ { messageId: 'noFlankingWhitespace' } ],
		},
		{
			code: `__( ' Flanking whitespace. ' );`,
			errors: [ { messageId: 'noFlankingWhitespace' } ],
		},
		{
			code: '__( "\tLeading tab." );',
			errors: [ { messageId: 'noFlankingWhitespace' } ],
		},
		{
			code: '__( "\u0009Leading unicode tab." );',
			errors: [ { messageId: 'noFlankingWhitespace' } ],
		},
		{
			code: `__( "Trailing tab.\t" );`,
			errors: [ { messageId: 'noFlankingWhitespace' } ],
		},
		{
			code: `__( "\tFlanking tab.\t" );`,
			errors: [ { messageId: 'noFlankingWhitespace' } ],
		},

		{
			code: '__( ` Template literals ` )',
			errors: [ { messageId: 'noFlankingWhitespace' } ],
		},
	],
} );
