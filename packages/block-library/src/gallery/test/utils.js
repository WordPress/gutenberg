import { getHrefAndDestination, normalizeLinkTo } from '../utils';

describe( 'normalizeLinkTo', () => {
	it( 'translates the values WordPress stores in image_default_link_type', () => {
		expect( normalizeLinkTo( 'file' ) ).toBe( 'media' );
		expect( normalizeLinkTo( 'post' ) ).toBe( 'attachment' );
	} );

	it( "leaves the block's own values alone", () => {
		expect( normalizeLinkTo( 'media' ) ).toBe( 'media' );
		expect( normalizeLinkTo( 'attachment' ) ).toBe( 'attachment' );
		expect( normalizeLinkTo( 'lightbox' ) ).toBe( 'lightbox' );
		expect( normalizeLinkTo( 'none' ) ).toBe( 'none' );
	} );

	it( 'passes a missing value through so the caller can fall back', () => {
		expect( normalizeLinkTo( undefined ) ).toBeUndefined();
		expect( normalizeLinkTo( '' ) ).toBe( '' );
	} );
} );

describe( 'linkTo seeding', () => {
	// Mirrors the expression in GalleryEdit's effect, which only runs when the
	// gallery has no stored value yet.
	function seedLinkTo( optionValue ) {
		return normalizeLinkTo( optionValue ) || 'none';
	}

	it( "stores the option in the block's own vocabulary", () => {
		expect( seedLinkTo( 'file' ) ).toBe( 'media' );
		expect( seedLinkTo( 'post' ) ).toBe( 'attachment' );
	} );

	it( 'falls back to none when the option is unset', () => {
		expect( seedLinkTo( undefined ) ).toBe( 'none' );
		expect( seedLinkTo( '' ) ).toBe( 'none' );
	} );
} );

describe( 'getHrefAndDestination', () => {
	const image = {
		url: 'https://example.com/pic.jpg',
		link: 'https://example.com/pic/',
	};

	it( 'accepts the values WordPress stores, without them being migrated', () => {
		expect( getHrefAndDestination( image, 'file' ) ).toMatchObject( {
			href: image.url,
			linkDestination: 'media',
		} );
		expect( getHrefAndDestination( image, 'post' ) ).toMatchObject( {
			href: image.link,
			linkDestination: 'attachment',
		} );
	} );

	it( "accepts the block's own values", () => {
		expect( getHrefAndDestination( image, 'media' ) ).toMatchObject( {
			href: image.url,
			linkDestination: 'media',
		} );
		expect( getHrefAndDestination( image, 'attachment' ) ).toMatchObject( {
			href: image.link,
			linkDestination: 'attachment',
		} );
	} );

	it( 'translates a per-image value too', () => {
		expect( getHrefAndDestination( image, 'none', 'file' ) ).toMatchObject(
			{
				href: image.url,
				linkDestination: 'media',
			}
		);
	} );
} );
