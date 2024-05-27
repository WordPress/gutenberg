/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';


store( '', {
	state: {
		url: '/some-url',
	},
} );

store( 'namespace', {
	state: {
		url: '/some-url',
	},
} );

store( 'other', {
	state: {
		url: '/other-store-url',
	},
} );

store( 'null', {
	state: {
		url: '/some-url',
	},
} );

store( '2', {
	state: {
		url: '/some-url',
	},
} );

store( '{}', {
	state: {
		url: '/other-store-url',
	},
} );

store( 'true', {
	state: {
		url: '/some-url',
	},
} );

store( 'false', {
	state: {
		url: '/some-url',
	},
} );

store( '[]', {
	state: {
		url: '/some-url',
	},
} );

store( '"quoted string"', {
	state: {
		url: '/some-url',
	},
} );





