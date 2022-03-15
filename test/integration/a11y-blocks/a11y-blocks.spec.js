const apiFetch = require( '@wordpress/api-fetch' );

describe( 'A test suite', () => {
	let post;
	beforeEach( async () => {
		post = await apiFetch( {
			path: '/wp/v2/posts/',
			method: 'POST',
			data: { title: 'New Post Title' },
		} );
		console.log( post );
	} );

	it( 'should pass', () => {
		expect( post ).toBeTruthy();
		console.log( post );
	} );
} );
