import {
	getGalleryResponsiveCSS,
	getUpdatedGalleryStyle,
} from '../responsive-styles';

const MEDIA_QUERIES = {
	'@tablet': '@media (480px < width <= 782px)',
	'@mobile': '@media (width <= 480px)',
};

describe( 'Gallery responsive styles', () => {
	it( 'updates crop to fit for the active viewport', () => {
		expect(
			getUpdatedGalleryStyle( {
				style: {
					spacing: { blockGap: '10px' },
					'@mobile': { columns: 1 },
				},
				viewport: '@tablet',
				baseSettings: { columns: 2, imageCrop: true },
				settings: { imageCrop: false },
			} )
		).toEqual( {
			spacing: { blockGap: '10px' },
			'@mobile': { columns: 1 },
			'@tablet': { imageCrop: false },
		} );
	} );

	it( 'removes a Gallery override without removing viewport layout settings', () => {
		expect(
			getUpdatedGalleryStyle( {
				style: {
					'@mobile': {
						columns: 1,
						imageCrop: false,
						layout: { columnCount: 2 },
					},
				},
				viewport: '@mobile',
				baseSettings: { columns: 2, imageCrop: true },
				settings: { columns: 2 },
			} )
		).toEqual( {
			'@mobile': {
				imageCrop: false,
				layout: { columnCount: 2 },
			},
		} );
	} );

	it( 'applies a viewport-specific column count', () => {
		const css = getGalleryResponsiveCSS(
			'#block-test',
			{
				'@mobile': {
					columns: 3,
					layout: { columnCount: 2 },
				},
			},
			MEDIA_QUERIES
		);

		expect( css ).toContain( '@media (width <= 480px)' );
		expect( css ).toContain(
			'width:calc((100% - (var(--wp--style--unstable-gallery-gap, 16px) * 2)) / 3)'
		);
		expect( css ).not.toContain( '@media (480px < width <= 782px)' );
	} );

	it.each( [
		[ true, 'object-fit:cover', 'display:flex' ],
		[ false, 'object-fit:fill', 'display:block' ],
	] )(
		'applies crop to fit set to %s for a viewport',
		( imageCrop, objectFitRule, wrapperDisplayRule ) => {
			const css = getGalleryResponsiveCSS(
				'#block-test',
				{
					'@tablet': {
						imageCrop,
					},
				},
				MEDIA_QUERIES
			);

			expect( css ).toContain( objectFitRule );
			expect( css ).toContain( wrapperDisplayRule );
		}
	);

	it( 'removes a viewport aspect ratio that matches the base value', () => {
		expect(
			getUpdatedGalleryStyle( {
				style: { '@mobile': { aspectRatio: '4/3', columns: 1 } },
				viewport: '@mobile',
				baseSettings: { aspectRatio: '16/9' },
				settings: { aspectRatio: '16/9' },
			} )
		).toEqual( { '@mobile': { columns: 1 } } );
	} );

	it( 'applies a viewport-specific aspect ratio in every Gallery layout', () => {
		const css = getGalleryResponsiveCSS(
			'#block-test',
			{ '@mobile': { aspectRatio: '16/9' } },
			MEDIA_QUERIES
		);

		expect( css ).toContain( '@media (width <= 480px)' );
		expect( css ).toContain( 'aspect-ratio:16/9 !important' );
		expect( css ).toContain( 'object-fit:cover !important' );
		// Columns and cropping are Flex-only, but an aspect ratio applies to
		// the images whichever layout the Gallery uses.
		expect( css ).not.toContain( 'is-layout-flex' );
	} );

	it( 'cancels the base aspect ratio for a viewport set to Original', () => {
		const css = getGalleryResponsiveCSS(
			'#block-test',
			{ '@tablet': { aspectRatio: 'auto' } },
			MEDIA_QUERIES
		);

		// `auto` would override the `width`/`height` presentational hint a
		// lazy-loaded image relies on for its placeholder ratio, so the
		// declaration is rolled out of the cascade instead.
		expect( css ).toContain( 'aspect-ratio:revert-layer !important' );
		expect( css ).not.toContain( 'aspect-ratio:auto' );
		// The base `object-fit` is left in place so a cropped Gallery keeps
		// cropping at this viewport.
		expect( css ).not.toContain( 'object-fit' );
	} );

	it( 'ignores malformed viewport Gallery values', () => {
		const css = getGalleryResponsiveCSS(
			'#block-test',
			{
				'@tablet': {
					columns: '3',
					imageCrop: 'false',
					aspectRatio: 16 / 9,
				},
				'@mobile': [],
			},
			MEDIA_QUERIES
		);

		expect( css ).toBe( '' );
	} );

	it( 'ignores an aspect ratio that would break out of the generated rule', () => {
		const css = getGalleryResponsiveCSS(
			'#block-test',
			{ '@mobile': { aspectRatio: '16/9;} body{display:none;' } },
			MEDIA_QUERIES
		);

		expect( css ).toBe( '' );
	} );
} );
