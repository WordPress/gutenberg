/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../i18n-translator-comments';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'i18n-translator-comments', rule, {
	valid: [
		{
			code: `
var color = '';
// translators: %s: Color
sprintf( __( 'Color: %s' ), color );`,
		},
		{
			code: `
var address = '';
sprintf(
	// translators: %s: Address.
	__( 'Address: %s' ),
	address
);`,
		},
	],
	invalid: [
		{
			code: `
var color = '';
sprintf( __( 'Color: %s' ), color );`,
			errors: [ { messageId: 'missing' } ],
		},
		{
			code: `
var address = '';
sprintf(
	__( 'Address: %s' ),
	address
);`,
			errors: [ { messageId: 'missing' } ],
		},
		{
			code: `
// translators: %s: Name
var name = '';
sprintf( __( 'Name: %s' ), name );`,
			errors: [ { messageId: 'missing' } ],
		},
	],
} );
