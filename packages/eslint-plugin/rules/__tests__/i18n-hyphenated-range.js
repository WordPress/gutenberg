/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../i18n-hyphenated-range';

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'i18n-hyphenated-range', rule, {
	valid: [
		{
			code: `__( 'Hyphenated-words are ok' )`,
		},
		{
			code: `__( 'Hyphen - when used in this case - is ok' )`,
		},
		{
			code: `__('en dash – and em dash — are ok')`,
		},
		{
			code: `__( 'en dash – ranges work 1–99 or 2 – 98' )`,
		},
		{
			code: `__( 'Negative numbers like -99 or -33 are ok' )`,
		},
		{
			code: `__( 'Numbers with trailing hyphens are odd but ok like 99-' )`,
		},
		{
			code: `__( '1 0 -1' )`,
		},
	],
	invalid: [
		{
			code: `__( 'guess a number 1 - 10' )`,
			output: `__( 'guess a number 1 – 10' )`,
			errors: [ { messageId: 'foundHyphen' } ],
		},
		{
			code: `__( 'No spaces: 00-99' )`,
			output: `__( 'No spaces: 00–99' )`,
			errors: [ { messageId: 'foundHyphen' } ],
		},
		{
			code: `__( 'From 0   -   2 many spaces in the range' )`,
			output: `__( 'From 0   –   2 many spaces in the range' )`,
			errors: [ { messageId: 'foundHyphen' } ],
		},
		{
			code: `__( '1-2' + ' fixing multiple strings' )`,
			output: `__( '1–2' + ' fixing multiple strings' )`,
			errors: [ { messageId: 'foundHyphen' } ],
		},
	],
} );
