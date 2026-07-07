/**
 * Internal dependencies
 */
import variations, { isGifVariation } from '../variations';

const GIF_ATTRIBUTES = {
	controls: false,
	loop: true,
	autoplay: true,
	muted: true,
	playsInline: true,
};

describe( 'isGifVariation', () => {
	it( 'matches a muted, looping, autoplaying, inline video without controls', () => {
		expect( isGifVariation( GIF_ATTRIBUTES ) ).toBe( true );
	} );

	it( 'does not match when controls are shown', () => {
		expect( isGifVariation( { ...GIF_ATTRIBUTES, controls: true } ) ).toBe(
			false
		);
	} );

	it.each( [ 'loop', 'autoplay', 'muted', 'playsInline' ] )(
		'does not match when %s is missing',
		( attribute ) => {
			expect(
				isGifVariation( { ...GIF_ATTRIBUTES, [ attribute ]: false } )
			).toBe( false );
		}
	);

	it( 'does not match a default video block', () => {
		expect( isGifVariation( { controls: true } ) ).toBe( false );
	} );

	it( 'handles missing attributes', () => {
		expect( isGifVariation() ).toBe( false );
		expect( isGifVariation( {} ) ).toBe( false );
	} );
} );

describe( 'video variations', () => {
	it( 'registers exactly one active variation for any attributes', () => {
		const active = variations.filter( ( variation ) =>
			variation.isActive( GIF_ATTRIBUTES )
		);
		expect( active ).toHaveLength( 1 );
		expect( active[ 0 ].name ).toBe( 'gif' );

		const activeForVideo = variations.filter( ( variation ) =>
			variation.isActive( { controls: true } )
		);
		expect( activeForVideo ).toHaveLength( 1 );
		expect( activeForVideo[ 0 ].name ).toBe( 'video' );
	} );

	it( 'keeps the GIF variation out of the inserter', () => {
		const gif = variations.find(
			( variation ) => variation.name === 'gif'
		);
		expect( gif.scope ).not.toContain( 'inserter' );
	} );
} );
