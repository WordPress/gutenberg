/**
 * External dependencies
 */
import nock from 'nock';

/**
 * Internal dependencies
 */
import hasWordPressProfile from '../has-wordpress-profile';

describe( 'hasWordPressProfile', () => {
	it( 'resolves as false for missing profile', async () => {
		nock( 'https://profiles.wordpress.org' )
			.intercept( '/wp-json/wporg-github/v1/lookup/ghost', 'HEAD' )
			.reply( 404 );

		const result = await hasWordPressProfile( 'ghost' );

		expect( result ).toBe( false );
	} );

	it( 'resolves as true for known profile', async () => {
		nock( 'https://profiles.wordpress.org' )
			.intercept( '/wp-json/wporg-github/v1/lookup/m', 'HEAD' )
			.reply( 200 );

		const result = await hasWordPressProfile( 'm' );

		expect( result ).toBe( true );
	} );
} );
