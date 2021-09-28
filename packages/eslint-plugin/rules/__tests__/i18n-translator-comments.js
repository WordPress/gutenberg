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
// translators: %s: Color
sprintf( __( 'Color: %s' ), color );`,
		},
		{
			code: `
sprintf(
	// translators: %s: Address.
	__( 'Address: %s' ),
	address
);`,
		},
		{
			code: `
// translators: %s: Color
i18n.sprintf( i18n.__( 'Color: %s' ), color );`,
		},
	],
	invalid: [
		{
			code: `
sprintf( __( 'Color: %s' ), color );`,
			errors: [ { messageId: 'missing' } ],
		},
		{
			code: `
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
		{
			code: `
// translators: %s: Surname
console.log(
	sprintf( __( 'Surname: %s' ), name )
);`,
			errors: [ { messageId: 'missing' } ],
		},
		{
			code: `
// translators: %s: Preference
console.log(
	sprintf(
		__( 'Preference: %s' ),
		preference
	)
);`,
			errors: [ { messageId: 'missing' } ],
		},
		{
			code: `
i18n.sprintf( i18n.__( 'Color: %s' ), color );`,
			errors: [ { messageId: 'missing' } ],
		},
	],
} );
