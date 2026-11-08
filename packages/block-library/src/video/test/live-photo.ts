import { describe, expect, it } from 'vitest';
import { isLivePhoto, LIVE_PHOTO_ATTRIBUTES } from '../live-photo';

describe( 'isLivePhoto', () => {
	it( 'matches a muted, looping, inline video that neither autoplays nor shows controls', () => {
		expect( isLivePhoto( LIVE_PHOTO_ATTRIBUTES ) ).toBe( true );
	} );

	it( 'does not match when controls are shown', () => {
		expect(
			isLivePhoto( { ...LIVE_PHOTO_ATTRIBUTES, controls: true } )
		).toBe( false );
	} );

	it.each( [ 'loop', 'muted', 'playsInline' ] )(
		'does not match when %s is missing',
		( attribute ) => {
			expect(
				isLivePhoto( {
					...LIVE_PHOTO_ATTRIBUTES,
					[ attribute ]: false,
				} )
			).toBe( false );
		}
	);

	it( 'does not match an autoplaying loop, which plays like a GIF', () => {
		expect(
			isLivePhoto( { ...LIVE_PHOTO_ATTRIBUTES, autoplay: true } )
		).toBe( false );
	} );

	it( 'does not match a default video block', () => {
		expect( isLivePhoto( { controls: true } ) ).toBe( false );
	} );

	it( 'handles missing attributes', () => {
		expect( isLivePhoto() ).toBe( false );
		expect( isLivePhoto( {} ) ).toBe( false );
	} );
} );
