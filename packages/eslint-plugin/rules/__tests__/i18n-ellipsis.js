/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../i18n-ellipsis';

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'i18n-ellipsis', rule, {
	valid: [
		{
			code: `__( 'Hello World…' )`,
		},
		{
			code: `__( 'Hello' + 'World…' )`,
		},
		{
			code: `_x( 'Hello World…', 'context' )`,
		},
		{
			code: `_n( 'Singular…', 'Plural…', number)`,
		},
		{
			code: `i18n.__( 'Hello World…' )`,
		},
	],
	invalid: [
		{
			code: `__( 'Hello World...' )`,
			output: `__( 'Hello World…' )`,
			errors: [ { messageId: 'foundThreeDots' } ],
		},
		{
			code: `__( 'Hello' + 'World...' )`,
			output: `__( 'Hello' + 'World…' )`,
			errors: [ { messageId: 'foundThreeDots' } ],
		},
		{
			code: `_x( 'Hello World...', 'context' )`,
			output: `_x( 'Hello World…', 'context' )`,
			errors: [ { messageId: 'foundThreeDots' } ],
		},
		{
			code: `_n( 'Singular...', 'Plural...', number)`,
			output: `_n( 'Singular…', 'Plural…', number)`,
			errors: [
				{ messageId: 'foundThreeDots' },
				{ messageId: 'foundThreeDots' },
			],
		},
		{
			code: `i18n.__( 'Hello World...' )`,
			output: `i18n.__( 'Hello World…' )`,
			errors: [ { messageId: 'foundThreeDots' } ],
		},
	],
} );
