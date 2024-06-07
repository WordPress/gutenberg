/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';


store( '', {
	state: {
		url: '/empty-string-url',
	},
} );

store( 'namespace', {
	state: {
		url: '/namespace-url',
	},
} );

store( 'other', {
	state: {
		url: '/other-store-url',
	},
} );

store( 'null', {
	state: {
		url: '/null-url',
	},
} );

store( '2', {
	state: {
		url: '/number-url',
	},
} );

store( '{}', {
	state: {
		url: '/object-url',
	},
} );

store( 'true', {
	state: {
		url: '/true-url',
	},
} );

store( 'false', {
	state: {
		url: '/false-url',
	},
} );

store( '[]', {
	state: {
		url: '/array-url',
	},
} );

store( '"quoted string"', {
	state: {
		url: '/quoted-url',
	},
} );





