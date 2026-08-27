import variations, {
	isGifVariation,
	isLivePhotoVariation,
} from '../variations';

const GIF_ATTRIBUTES = {
	controls: false,
	loop: true,
	autoplay: true,
	muted: true,
	playsInline: true,
};

const LIVE_PHOTO_ATTRIBUTES = {
	controls: false,
	loop: true,
	autoplay: false,
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

	it( 'does not match a Live photo, which does not autoplay', () => {
		expect( isGifVariation( LIVE_PHOTO_ATTRIBUTES ) ).toBe( false );
	} );

	it( 'handles missing attributes', () => {
		expect( isGifVariation() ).toBe( false );
		expect( isGifVariation( {} ) ).toBe( false );
	} );
} );

describe( 'isLivePhotoVariation', () => {
	it( 'matches a muted, looping, inline video that neither autoplays nor shows controls', () => {
		expect( isLivePhotoVariation( LIVE_PHOTO_ATTRIBUTES ) ).toBe( true );
	} );

	it( 'does not match when controls are shown', () => {
		expect(
			isLivePhotoVariation( {
				...LIVE_PHOTO_ATTRIBUTES,
				controls: true,
			} )
		).toBe( false );
	} );

	it.each( [ 'loop', 'muted', 'playsInline' ] )(
		'does not match when %s is missing',
		( attribute ) => {
			expect(
				isLivePhotoVariation( {
					...LIVE_PHOTO_ATTRIBUTES,
					[ attribute ]: false,
				} )
			).toBe( false );
		}
	);

	it( 'does not match a GIF, which autoplays', () => {
		expect( isLivePhotoVariation( GIF_ATTRIBUTES ) ).toBe( false );
	} );

	it( 'does not match a default video block', () => {
		expect( isLivePhotoVariation( { controls: true } ) ).toBe( false );
	} );

	it( 'handles missing attributes', () => {
		expect( isLivePhotoVariation() ).toBe( false );
		expect( isLivePhotoVariation( {} ) ).toBe( false );
	} );
} );

describe( 'video variations', () => {
	it.each( [
		[ 'gif', GIF_ATTRIBUTES ],
		[ 'live-photo', LIVE_PHOTO_ATTRIBUTES ],
		[ 'video', { controls: true } ],
	] )( 'activates only the %s variation', ( name, attributes ) => {
		const active = variations.filter( ( variation ) =>
			variation.isActive( attributes )
		);

		expect( active ).toHaveLength( 1 );
		expect( active[ 0 ].name ).toBe( name );
	} );

	it.each( [ 'gif', 'live-photo' ] )(
		'keeps the %s variation out of the inserter',
		( name ) => {
			const variation = variations.find(
				( candidate ) => candidate.name === name
			);
			expect( variation.scope ).not.toContain( 'inserter' );
		}
	);
} );
