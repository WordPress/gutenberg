import { getHrefAndDestination, normalizeLinkTo } from '../utils';

describe( 'normalizeLinkTo', () => {
	it( 'normalizes the values WordPress stores in image_default_link_type', () => {
		expect( normalizeLinkTo( 'file' ) ).toBe( 'media' );
		expect( normalizeLinkTo( 'post' ) ).toBe( 'attachment' );
	} );

	it( 'passes every other value through unchanged', () => {
		expect( normalizeLinkTo( 'media' ) ).toBe( 'media' );
		expect( normalizeLinkTo( 'attachment' ) ).toBe( 'attachment' );
		expect( normalizeLinkTo( 'lightbox' ) ).toBe( 'lightbox' );
		expect( normalizeLinkTo( 'none' ) ).toBe( 'none' );
		expect( normalizeLinkTo( undefined ) ).toBeUndefined();
	} );
} );

describe( 'getHrefAndDestination', () => {
	// It no longer has cases of its own for the WordPress values, so check it
	// still resolves them through normalizeLinkTo.
	it( 'resolves the values WordPress stores', () => {
		const image = {
			url: 'https://example.com/pic.jpg',
			link: 'https://example.com/pic/',
		};

		expect( getHrefAndDestination( image, 'file' ) ).toMatchObject( {
			href: image.url,
			linkDestination: 'media',
		} );
		expect( getHrefAndDestination( image, 'post' ) ).toMatchObject( {
			href: image.link,
			linkDestination: 'attachment',
		} );
	} );
} );
