import { describe, expect, it } from 'vitest';
import { getImageAttributes, isGalleryFlexLayout } from '../shared';

const MEDIA = {
	id: 1,
	caption: { raw: 'Media caption' },
	alt_text: 'Media alt',
};

const GALLERY = {
	linkTo: 'media',
	linkTarget: '_blank',
	sizeSlug: 'medium',
	aspectRatio: '4/3',
};

describe( 'isGalleryFlexLayout', () => {
	it.each( [
		[ 'missing', undefined ],
		[ 'null', null ],
		[ 'a string', 'grid' ],
		[ 'an array', [ 'grid' ] ],
		[ 'an object without a type', {} ],
		[ 'an object with an empty type', { type: '' } ],
		[ 'an explicit Flex layout', { type: 'flex' } ],
	] )( 'treats %s layout data as Flex', ( label, layout ) => {
		expect( isGalleryFlexLayout( layout ) ).toBe( true );
	} );

	it.each( [
		[ 'Grid', { type: 'grid' } ],
		[ 'another explicit layout type', { type: 'constrained' } ],
	] )( 'does not treat %s as Flex', ( label, layout ) => {
		expect( isGalleryFlexLayout( layout ) ).toBe( false );
	} );
} );

describe( 'getImageAttributes', () => {
	it( 'applies the gallery settings to an added image', () => {
		expect(
			getImageAttributes( GALLERY, { id: 1, caption: '' }, MEDIA )
		).toMatchObject( {
			linkTarget: '_blank',
			sizeSlug: 'medium',
			caption: 'Media caption',
			alt: 'Media alt',
			aspectRatio: '4/3',
			scale: 'cover',
		} );
	} );

	it( 'keeps the link target, caption and alt of an image transformed into the gallery', () => {
		expect(
			getImageAttributes(
				GALLERY,
				{
					id: 1,
					caption: 'Own caption',
					alt: 'Own alt',
					className: 'is-style-rounded',
					rel: 'nofollow',
				},
				MEDIA
			)
		).toMatchObject( {
			linkTarget: undefined,
			rel: 'nofollow',
			className: 'is-style-rounded',
			caption: 'Own caption',
			alt: 'Own alt',
		} );
	} );

	it( 'keeps the "Enlarge on click" setting of an image transformed into the gallery', () => {
		expect(
			getImageAttributes(
				GALLERY,
				{
					id: 1,
					caption: '',
					linkDestination: 'none',
					lightbox: { enabled: true },
				},
				MEDIA
			)
		).toMatchObject( {
			linkDestination: 'none',
			lightbox: { enabled: true },
		} );
	} );

	it( 'applies the gallery lightbox to an added image without a link destination', () => {
		expect(
			getImageAttributes(
				{ ...GALLERY, linkTo: 'lightbox' },
				{ id: 1, caption: '' },
				MEDIA
			)
		).toMatchObject( {
			linkDestination: 'none',
			lightbox: { enabled: true },
		} );
	} );

	it( 'keeps the aspect ratio of an image transformed into a gallery without one', () => {
		expect(
			getImageAttributes(
				{ ...GALLERY, aspectRatio: 'auto' },
				{ id: 1, caption: '', aspectRatio: '16/9', scale: 'cover' },
				MEDIA
			)
		).toMatchObject( { aspectRatio: '16/9', scale: 'cover' } );
	} );

	it( 'applies the gallery aspect ratio to an image transformed into the gallery', () => {
		expect(
			getImageAttributes(
				GALLERY,
				{ id: 1, caption: '', aspectRatio: '16/9', scale: 'contain' },
				MEDIA
			)
		).toMatchObject( { aspectRatio: '4/3', scale: 'cover' } );
	} );
} );
