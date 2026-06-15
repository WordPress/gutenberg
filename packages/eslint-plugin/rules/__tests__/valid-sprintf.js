/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../valid-sprintf';

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
			errors: [ { messageId: 'noOrderedPlaceholders' } ],
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
