/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../i18n-no-collapsible-whitespace';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'i18n-no-collapsible-whitespace', rule, {
	valid: [
		{
			code: `__( 'Hello World…' )`,
		},
		{
			code: '__( `A long string ` +\n `spread over ` +\n  `multiple lines.` );',
		},
	],
	invalid: [
		{
			code: '__( "My double-quoted string\\nwith a newline" );',
			errors: [ { messageId: 'noCollapsibleWhitespace' } ],
		},
		{
			code: "__( 'My single quoted string\\nwith a newline' );",
			errors: [ { messageId: 'noCollapsibleWhitespace' } ],
		},
		{
			code: '__( `My template literal\non two lines` );',
			errors: [ { messageId: 'noCollapsibleWhitespace' } ],
		},
		{
			code: "__( '	My tab-indented string.' );",
			errors: [ { messageId: 'noCollapsibleWhitespace' } ],
		},
		{
			code: "__( '\tMy string with a tab escape sequence.' );",
			errors: [ { messageId: 'noCollapsibleWhitespace' } ],
		},
		{
			code: "__( '\u0009My string with a unicode tab.' );",
			errors: [ { messageId: 'noCollapsibleWhitespace' } ],
		},
		{
			code: '__( `A string with \r a carriage return.` );',
			errors: [ { messageId: 'noCollapsibleWhitespace' } ],
		},
		{
			code: "__( 'A string with consecutive spaces.  These two are after a full stop.' );",
			errors: [ { messageId: 'noCollapsibleWhitespace' } ],
		},
	],
} );
