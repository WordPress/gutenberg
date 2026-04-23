/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../i18n-no-variables';

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'i18n-no-variables', rule, {
	valid: [
		{
			code: `__( 'Hello World' )`,
		},
		{
			code: `__( 'Hello' + 'World' )`,
		},
		{
			code: `_x( 'Hello World', 'context' )`,
		},
		{
			code: `var number = ''; _n( 'Singular', 'Plural', number)`,
		},
		{
			code: `var number = ''; _nx( 'Singular', 'Plural', number, 'context' )`,
		},
		{
			code: `__( 'Hello World', 'foo' )`,
		},
		{
			code: `_x( 'Hello World', 'context', 'foo' )`,
		},
		{
			code: `var number = ''; _n( 'Singular', 'Plural', number, 'foo' )`,
		},
		{
			code: `var number = ''; _nx( 'Singular', 'Plural', number, 'context', 'foo' )`,
		},
		{
			code: `i18n.__( 'Hello World' )`,
		},
	],
	invalid: [
		{
			code: `__(foo)`,
			errors: [ { messageId: 'invalidArgument' } ],
		},
		{
			code: '__(`Hello ${foo}`)',
			errors: [ { messageId: 'invalidArgument' } ],
		},
		{
			code: `_x(foo, 'context' )`,
			errors: [ { messageId: 'invalidArgument' } ],
		},
		{
			code: `_x( 'Hello World', bar)`,
			errors: [ { messageId: 'invalidArgument' } ],
		},
		{
			code: `var number = ''; _n(foo,'Plural', number)`,
			errors: [ { messageId: 'invalidArgument' } ],
		},
		{
			code: `var number = ''; _n( 'Singular', bar, number)`,
			errors: [ { messageId: 'invalidArgument' } ],
		},
		{
			code: `var number = ''; _nx(foo, 'Plural', number, 'context' )`,
			errors: [ { messageId: 'invalidArgument' } ],
		},
		{
			code: `var number = ''; _nx( 'Singular', bar, number, 'context' )`,
			errors: [ { messageId: 'invalidArgument' } ],
		},
		{
			code: `var number = ''; _nx( 'Singular', 'Plural', number, baz)`,
			errors: [ { messageId: 'invalidArgument' } ],
		},
		{
			code: `i18n.__(foo)`,
			errors: [ { messageId: 'invalidArgument' } ],
		},
	],
} );
