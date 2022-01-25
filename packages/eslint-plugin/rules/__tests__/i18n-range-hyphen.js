/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../i18n-range-hyphen';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'i18n-range-hyphen', rule, {
	valid: [
		{
			code: `__( 'Hypenated-words are ok' )`,
		},
		{
			code: `__( 'Hyphen - when used in this case - is ok' )`,
		},

		{
			code: `__('en dash – and em dash — are ok')`,
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
	],
} );
