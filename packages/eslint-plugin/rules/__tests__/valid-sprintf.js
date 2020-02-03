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
			errors: [
				{ message: 'sprintf must be called with a format string' },
			],
		},
		{
			code: `sprintf( '%s' )`,
			errors: [
				{
					message:
						'sprintf must be called with placeholder value argument(s)',
				},
			],
		},
		{
			code: `sprintf( 1, 'substitute' )`,
			errors: [
				{
					message:
						'sprintf must be called with a valid format string',
				},
			],
		},
		{
			code: `sprintf( [], 'substitute' )`,
			errors: [
				{
					message:
						'sprintf must be called with a valid format string',
				},
			],
		},
		{
			code: `sprintf( '%%', 'substitute' )`,
			errors: [
				{
					message:
						'sprintf format string must contain at least one placeholder',
				},
			],
		},
		{
			code: `sprintf( __( '%%' ), 'substitute' )`,
			errors: [
				{
					message:
						'sprintf format string must contain at least one placeholder',
				},
			],
		},
		{
			code: `sprintf( _n( '%s', '' ), 'substitute' )`,
			errors: [
				{
					message:
						'sprintf format string options must have the same number of placeholders',
				},
			],
		},
		{
			code: `sprintf( _n( '%s', '%s %s' ), 'substitute' )`,
			errors: [
				{
					message:
						'sprintf format string options must have the same number of placeholders',
				},
			],
		},
	],
} );
