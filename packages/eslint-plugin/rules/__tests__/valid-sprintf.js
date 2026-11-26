import { describe, it } from 'vitest';
import configureRuleTester from '../../test-utils/configure-rule-tester';
import rule from '../valid-sprintf';

const RuleTester = configureRuleTester( { describe, it } );

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'valid-sprintf', rule, {
	valid: [
		{
			code: `sprintf( '%s', 'substitute' )`,
		},
		{
			code: `sprintf( '%1$d%%', 500 )`,
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
		{
			code: `
sprintf(
	/* translators: 1: number of blocks. 2: average rating. */
	_n(
		'This author has %1$d block, with an average rating of %2$d.',
		'This author has %1$d blocks, with an average rating of %2$d.',
		authorBlockCount
	),
	authorBlockCount,
	authorBlockRating
);`,
		},
		{
			code: `i18n.sprintf( '%s', 'substitute' )`,
		},
		{
			// Unordered placeholders in translatable strings are reported
			// by `i18n-ordered-placeholders` instead.
			code: `
sprintf(
	/* translators: 1: number of blocks. 2: average rating. */
	_n(
		'This author has %d block, with an average rating of %d.',
		'This author has %d blocks, with an average rating of %d.',
		authorBlockCount
	),
	authorBlockCount,
	authorBlockRating
);`,
		},
		{
			code: `sprintf( '%1$s, %2$s and %1$s', 'foo', 'bar' )`,
		},
		{
			code: `sprintf( __( '%s and %s' ), [ 'foo', 'bar' ] )`,
		},
		{
			code: `sprintf( __( '%s and %s' ), ...values )`,
		},
		{
			code: `sprintf( _n( '%d item', plural, n ), n )`,
		},
		{
			code: `sprintf( '%%%s', a )`,
		},
		{
			code: `sprintf( __( 'Progress: %%%d' ), a )`,
		},
		{
			// Ordering does not matter in strings that are not translated.
			code: `sprintf( '%s %s', a, b )`,
		},
		{
			code: `sprintf( __( '%s' ), value )`,
		},
		{
			code: `sprintf( '%(first)s and %(second)s', { first, second } )`,
		},
		{
			code: `sprintf( '%.*f', 2, 3.14159 )`,
		},
		{
			code: `sprintf( '100%% of %s', 'foo' )`,
		},
		{
			code: `i18n.sprintf( i18n.__( '%s' ), 'substitute' )`,
		},
		{
			code: `sprintf( ...args )`,
		},
		{
			code: `sprintf( '%1$s %2$s', 'foo', 'bar' )`,
		},
		{
			code: `sprintf( '%(greeting)s', 'Hello' )`,
		},
		{
			code: `sprintf( '%(greeting)s %(toWhom)s', 'Hello', 'World' )`,
		},
		{
			code: `sprintf( 'Rotated at %d %% degrees', 90 )`,
		},
		{
			code: `sprintf( 'Rotated at %d%% degrees', 90 )`,
		},
		{
			code: `sprintf( __( 'Rotated at %d%% degrees' ), 90 )`,
		},
		{
			code: `sprintf( 'Rotated at %1$d %% degrees, %2$d %% angles', 90, 180 )`,
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
		{
			code: `sprintf( '%1$s %s', 'foo', 'bar' )`,
			errors: [ { messageId: 'noOrderedPlaceholders' } ],
		},
		{
			code: `sprintf( __( '%s and %s' ), 'foo' )`,
			errors: [
				{
					messageId: 'argumentCountMismatch',
					data: { expected: 2, actual: 1 },
				},
			],
		},
		{
			code: `sprintf( __( '%1$s and %2$s' ), 'foo', 'bar', 'baz' )`,
			errors: [
				{
					messageId: 'argumentCountMismatch',
					data: { expected: 2, actual: 3 },
				},
			],
		},
		{
			code: `sprintf( '%3$s', 'foo', 'bar' )`,
			errors: [
				{
					messageId: 'argumentCountMismatch',
					data: { expected: 3, actual: 2 },
				},
			],
		},
		{
			code: `sprintf( '%1$s %s', 'foo' )`,
			errors: [ { messageId: 'noOrderedPlaceholders' } ],
		},
		{
			code: `sprintf( _n( '%1$d block', '%1$d blocks', count ), count, total )`,
			errors: [
				{
					messageId: 'argumentCountMismatch',
					data: { expected: 1, actual: 2 },
				},
			],
		},
		{
			code: `sprintf( __( '%s and %s' ), [ 'foo' ] )`,
			errors: [
				{
					messageId: 'argumentCountMismatch',
					data: { expected: 2, actual: 1 },
				},
			],
		},
		{
			code: `sprintf( __( '%.*f' ), 2 )`,
			errors: [
				{
					messageId: 'argumentCountMismatch',
					data: { expected: 2, actual: 1 },
				},
			],
		},
		{
			code: `sprintf( __( '%1$s of %2$s' ), total )`,
			errors: [
				{
					messageId: 'argumentCountMismatch',
					data: { expected: 2, actual: 1 },
				},
			],
		},
		{
			code: `sprintf( 'Save 20% %s', a )`,
			errors: [ { messageId: 'noPlaceholders' } ],
		},
		{
			code: `i18n.sprintf()`,
			errors: [ { messageId: 'noFormatString' } ],
		},
		{
			code: `i18n.sprintf( i18n.__( '%%' ), 'substitute' )`,
			errors: [ { messageId: 'noPlaceholders' } ],
		},
	],
} );
