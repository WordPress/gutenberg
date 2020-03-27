/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../i18n-text-domain';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'i18n-text-domain', rule, {
	valid: [
		{
			code: `__( 'Hello World' )`,
			options: [ { allowedTextDomains: [ 'default' ] } ],
		},
		{
			code: `_x( 'Hello World', 'context' )`,
			options: [ { allowedTextDomains: [ 'default' ] } ],
		},
		{
			code: `var number = ''; _n( 'Singular', 'Plural', number)`,
			options: [ { allowedTextDomains: [ 'default' ] } ],
		},
		{
			code: `var number = ''; _nx( 'Singular', 'Plural', number, 'context' )`,
			options: [ { allowedTextDomains: [ 'default' ] } ],
		},
		{
			code: `__( 'Hello World', 'foo' )`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
		},
		{
			code: `_x( 'Hello World', 'context', 'foo' )`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
		},
		{
			code: `var number = ''; _n( 'Singular', 'Plural', number, 'foo' )`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
		},
		{
			code: `var number = ''; _nx( 'Singular', 'Plural', number, 'context', 'foo' )`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
		},
		{
			code: `i18n.__( 'Hello World' )`,
			options: [ { allowedTextDomains: [ 'default' ] } ],
		},
	],
	invalid: [
		{
			code: `__( 'Hello World' )`,
			output: `__( 'Hello World', 'foo' )`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
			errors: [ { messageId: 'missing' } ],
		},
		{
			code: `_x( 'Hello World', 'context' )`,
			output: `_x( 'Hello World', 'context', 'foo' )`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
			errors: [ { messageId: 'missing' } ],
		},
		{
			code: `var number = ''; _n( 'Singular', 'Plural', number)`,
			output: `var number = ''; _n( 'Singular', 'Plural', number, 'foo' )`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
			errors: [ { messageId: 'missing' } ],
		},
		{
			code: `var number = ''; _nx( 'Singular', 'Plural', number, 'context' )`,
			output: `var number = ''; _nx( 'Singular', 'Plural', number, 'context', 'foo' )`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
			errors: [ { messageId: 'missing' } ],
		},
		{
			code: `__( 'Hello World', 'bar' )`,
			output: `__( 'Hello World', 'foo' )`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
			errors: [ { messageId: 'invalidValue' } ],
		},
		{
			code: `_x( 'Hello World', 'context', 'bar' )`,
			output: `_x( 'Hello World', 'context', 'foo' )`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
			errors: [ { messageId: 'invalidValue' } ],
		},
		{
			code: `var number = ''; _n( 'Singular', 'Plural', number, 'bar' )`,
			output: `var number = ''; _n( 'Singular', 'Plural', number, 'foo' )`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
			errors: [ { messageId: 'invalidValue' } ],
		},
		{
			code: `var number = ''; _nx( 'Singular', 'Plural', number, 'context', 'bar' )`,
			output: `var number = ''; _nx( 'Singular', 'Plural', number, 'context', 'foo' )`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
			errors: [ { messageId: 'invalidValue' } ],
		},
		{
			code: `var value = ''; __( 'Hello World', value)`,
			errors: [ { messageId: 'invalidType' } ],
		},
		{
			code: `var value = ''; _x( 'Hello World', 'context', value)`,
			errors: [ { messageId: 'invalidType' } ],
		},
		{
			code: `var value = ''; var number = ''; _n( 'Singular', 'Plural', number, value)`,
			errors: [ { messageId: 'invalidType' } ],
		},
		{
			code: `var value = ''; var number = ''; _nx( 'Singular', 'Plural', number, 'context', value)`,
			errors: [ { messageId: 'invalidType' } ],
		},
		{
			code: `__( 'Hello World', 'default' )`,
			output: `__( 'Hello World' )`,
			options: [ { allowedTextDomains: [ 'default' ] } ],
			errors: [ { messageId: 'unnecessaryDefault' } ],
		},
		{
			code: `__( 'default', 'default' )`,
			output: `__( 'default' )`,
			options: [ { allowedTextDomains: [ 'default' ] } ],
			errors: [ { messageId: 'unnecessaryDefault' } ],
		},
		{
			code: `_x( 'Hello World', 'context', 'default' )`,
			output: `_x( 'Hello World', 'context' )`,
			options: [ { allowedTextDomains: [ 'default' ] } ],
			errors: [ { messageId: 'unnecessaryDefault' } ],
		},
		{
			code: `var number = ''; _n( 'Singular', 'Plural', number, 'default' )`,
			output: `var number = ''; _n( 'Singular', 'Plural', number)`,
			options: [ { allowedTextDomains: [ 'default' ] } ],
			errors: [ { messageId: 'unnecessaryDefault' } ],
		},
		{
			code: `var number = ''; _nx( 'Singular', 'Plural', number, 'context', 'default' )`,
			output: `var number = ''; _nx( 'Singular', 'Plural', number, 'context' )`,
			options: [ { allowedTextDomains: [ 'default' ] } ],
			errors: [ { messageId: 'unnecessaryDefault' } ],
		},
		{
			code: `i18n.__( 'Hello World' )`,
			output: `i18n.__( 'Hello World', 'foo' )`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
			errors: [ { messageId: 'missing' } ],
		},
	],
} );
