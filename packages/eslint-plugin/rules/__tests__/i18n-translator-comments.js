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
		{
			code: `
sprintf(
	/*
	 * translators: %s is the name of the city we couldn't locate.
	 * Replace the examples with cities related to your locale. Test that
	 * they match the expected location and have upcoming events before
	 * including them. If no cities related to your locale have events,
	 * then use cities related to your locale that would be recognizable
	 * to most users. Use only the city name itself, without any region
	 * or country. Use the endonym (native locale name) instead of the
	 * English name if possible.
	 */
	__( 'We couldn’t locate %s. Please try another nearby city. For example: Kansas City; Springfield; Portland.' ),
templateParams.unknownCity
);`,
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
