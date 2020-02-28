/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../valid-text-domain';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'valid-text-domain', rule, {
	valid: [
		{
			code: `__('Hello World')`,
			options: [ { allowDefault: true } ],
		},
		{
			code: `_x('Hello World', 'context')`,
			options: [ { allowDefault: true } ],
		},
		{
			code: `var number = ''; _n('Singular', 'Plural', number)`,
			options: [ { allowDefault: true } ],
		},
		{
			code: `var number = ''; _nx('Singular', 'Plural', number, 'context')`,
			options: [ { allowDefault: true } ],
		},
		{
			code: `__('Hello World', 'foo')`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
		},
		{
			code: `_x('Hello World', 'context', 'foo')`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
		},
		{
			code: `var number = ''; _n('Singular', 'Plural', number, 'foo')`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
		},
		{
			code: `var number = ''; _nx('Singular', 'Plural', number, 'context', 'foo')`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
		},
	],
	invalid: [
		{
			code: `__('Hello World')`,
			errors: [ { message: 'Missing text domain' } ],
		},
		{
			code: `_x('Hello World', 'context')`,
			errors: [ { message: 'Missing text domain' } ],
		},
		{
			code: `var number = ''; _n('Singular', 'Plural', number)`,
			errors: [ { message: 'Missing text domain' } ],
		},
		{
			code: `var number = ''; _nx('Singular', 'Plural', number, 'context')`,
			errors: [ { message: 'Missing text domain' } ],
		},
		{
			code: `__('Hello World', 'bar')`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
			errors: [ { message: 'Invalid text domain: bar' } ],
		},
		{
			code: `_x('Hello World', 'context', 'bar')`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
			errors: [ { message: 'Invalid text domain: bar' } ],
		},
		{
			code: `var number = ''; _n('Singular', 'Plural', number, 'bar')`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
			errors: [ { message: 'Invalid text domain: bar' } ],
		},
		{
			code: `var number = ''; _nx('Singular', 'Plural', number, 'context', 'bar')`,
			options: [ { allowedTextDomains: [ 'foo' ] } ],
			errors: [ { message: 'Invalid text domain: bar' } ],
		},
		{
			code: `var value = ''; __('Hello World', value)`,
			errors: [ { message: 'Text domain is not a string literal' } ],
		},
		{
			code: `var value = ''; _x('Hello World', 'context', value)`,
			errors: [ { message: 'Text domain is not a string literal' } ],
		},
		{
			code: `var value = ''; var number = ''; _n('Singular', 'Plural', number, value)`,
			errors: [ { message: 'Text domain is not a string literal' } ],
		},
		{
			code: `var value = ''; var number = ''; _nx('Singular', 'Plural', number, 'context', value)`,
			errors: [ { message: 'Text domain is not a string literal' } ],
		},
		{
			code: `__('Hello World', 'default')`,
			options: [ { allowDefault: true } ],
			errors: [ { message: 'Unnecessary default text domain' } ],
		},
		{
			code: `_x('Hello World', 'context', 'default')`,
			options: [ { allowDefault: true } ],
			errors: [ { message: 'Unnecessary default text domain' } ],
		},
		{
			code: `var number = ''; _n('Singular', 'Plural', number, 'default')`,
			options: [ { allowDefault: true } ],
			errors: [ { message: 'Unnecessary default text domain' } ],
		},
		{
			code: `var number = ''; _nx('Singular', 'Plural', number, 'context', 'default')`,
			options: [ { allowDefault: true } ],
			errors: [ { message: 'Unnecessary default text domain' } ],
		},
	],
} );
