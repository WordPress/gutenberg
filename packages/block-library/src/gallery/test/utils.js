import { normalizeLinkTo } from '../utils';

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
	// Mirrors the expression in GalleryEdit's linkTo effect, which is where the
	// stored value is decided from the block attribute and the WordPress option.
	function resolveLinkTo( linkTo, optionValue ) {
		return normalizeLinkTo( linkTo || optionValue ) || 'none';
	}

	it( "seeds a new gallery from the option in the block's vocabulary", () => {
		expect( resolveLinkTo( undefined, 'file' ) ).toBe( 'media' );
		expect( resolveLinkTo( undefined, 'post' ) ).toBe( 'attachment' );
	} );

	it( 'falls back to none when the option is unset', () => {
		expect( resolveLinkTo( undefined, undefined ) ).toBe( 'none' );
		expect( resolveLinkTo( undefined, '' ) ).toBe( 'none' );
	} );

	it( 'translates a value an earlier version stored untranslated', () => {
		expect( resolveLinkTo( 'file', 'none' ) ).toBe( 'media' );
		expect( resolveLinkTo( 'post', 'none' ) ).toBe( 'attachment' );
	} );

	it( 'leaves a gallery that already has a supported value untouched', () => {
		expect( resolveLinkTo( 'lightbox', 'file' ) ).toBe( 'lightbox' );
		expect( resolveLinkTo( 'none', 'file' ) ).toBe( 'none' );
		expect( resolveLinkTo( 'media', 'post' ) ).toBe( 'media' );
	} );
} );
