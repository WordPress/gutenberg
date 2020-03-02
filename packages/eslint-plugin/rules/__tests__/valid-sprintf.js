/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../valid-sprintf';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'valid-sprintf', rule, {
	valid: [
		{
			code: `sprintf( '%s', 'substitute' )`,
		},
		{
			code: `sprintf( __( '%s' ), 'substitute' )`,
		},
		{
			code: `sprintf( _x( '%s' ), 'substitute' )`,
		},
		{
			code: `sprintf( _n( '%s', '%s' ), 'substitute' )`,
		},
		{
			code: `sprintf( _nx( '%s', '%s' ), 'substitute' )`,
		},
		{
			code: `var getValue = () => ''; sprintf( getValue(), 'substitute' )`,
		},
		{
			code: `var value = ''; sprintf( value, 'substitute' )`,
		},
	],
	invalid: [
		{
			code: `sprintf()`,
			errors: [ { messageId: 'noFormatString' } ],
		},
		{
			code: `sprintf( '%s' )`,
			errors: [ { messageId: 'noPlaceholderArgs' } ],
		},
		{
			code: `sprintf( 1, 'substitute' )`,
			errors: [ { messageId: 'invalidFormatString' } ],
		},
		{
			code: `sprintf( [], 'substitute' )`,
			errors: [ { messageId: 'invalidFormatString' } ],
		},
		{
			code: `sprintf( '%%', 'substitute' )`,
			errors: [ { messageId: 'noPlaceholders' } ],
		},
		{
			code: `sprintf( __( '%%' ), 'substitute' )`,
			errors: [ { messageId: 'noPlaceholders' } ],
		},
		{
			code: `sprintf( _n( '%s', '' ), 'substitute' )`,
			errors: [ { messageId: 'placeholderMismatch' } ],
		},
		{
			code: `sprintf( _n( '%s', '%s %s' ), 'substitute' )`,
			errors: [ { messageId: 'placeholderMismatch' } ],
		},
	],
} );
