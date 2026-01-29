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
		{
			code: `
		// translators: %s: Name
		sprintf( __( 'Name: %s' ), 'hi' );`,
		},
		{
			code: `// translators: city: City
sprintf( __( 'City: %(city)s' ),{ city: 'New York' });`,
		},
		{
			code: `
// translators: 1: Address, 2: City
sprintf( __( 'Address: %1$s, City: %2$s' ), address, city );`,
		},
		{
			code: `
// translators: %s: 1 or 2
sprintf( __( '%s point' ), number );`,
		},
		{
			code: `
/* translators: accessibility text. %1: current block position (number). %2: next block position (number) */
	__( 'Move block left from position %1$s to position %2$s');`,
		},
		{
			code: `
// translators: %1s: Title of a media work from Openverse; %2s: Work's licence e.g: "CC0 1.0".
_x( '"%1$s"/ %2$s', 'caption' );
`,
		},
		{
			code: `
// translators: %1$s: Title of a media work from Openverse; %2$s: Work's licence e.g: "CC0 1.0".
_x( '"%1$s"/ %2$s', 'caption' );
			`,
		},
		{
			code: ` // translators: %s: Hello at 6:00 AM
		i18n.sprintf( i18n.__( 'Hello at %s' ), '6:00 AM' );`,
		},
		{
			code: `// translators: %.2f: Percentage
		i18n.sprintf( i18n.__( 'Percentage: %.2f' ), 1.00 );`,
		},
		{
			code: `// translators: %.*f: Percentage
		i18n.sprintf( i18n.__( 'Percentage: %.*f' ), 2, 1.00 );`,
		},
		{
			code: `// translators: %(named).2s: truncated name
		i18n.sprintf( i18n.__( 'Truncated name: %(named).2s' ), { named: 'Long Name' } );`,
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
		{
			code: `// translators: %d: Address
		i18n.sprintf( i18n.__( 'Address: %s' ), address );`,
			errors: [ { messageId: 'missingKeys' } ],
		},
		{
			code: ` // translators: %s: City
		i18n.sprintf( i18n.__( 'City: %(city)s' ), { city: 'New York' } );`,
			errors: [
				{ messageId: 'missingKeys', data: { keys: [ 'city' ] } },
			],
		},
		{
			code: `// translators: 1: Address
		i18n.sprintf( i18n.__( 'Address: %1$s, City: %2$s' ), address, city );`,
			errors: [ { messageId: 'missingKeys', data: { keys: [ '2' ] } } ],
		},
		{
			code: `// translators: %s: City %d: Number
		i18n.sprintf( i18n.__( 'City: %s' ), city, number );`,
			errors: [
				{ messageId: 'extraPlaceholders', data: { keys: [ '%d' ] } },
			],
		},
		{
			code: `
// translators: %s: hi, 1: okay, 2: bye
		i18n.sprintf( i18n.__( '%s point' ), number );`,
			errors: [
				{
					messageId: 'extraPlaceholders',
					data: { keys: [ '1', '2' ] },
				},
			],
		},
	],
} );
