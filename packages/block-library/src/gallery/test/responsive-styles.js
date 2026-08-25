import {
	getGalleryResponsiveLayoutCSS,
	getUpdatedGalleryStyle,
} from '../responsive-styles';

const MEDIA_QUERIES = {
	'@tablet': '@media (480px < width <= 782px)',
	'@mobile': '@media (width <= 480px)',
};

describe( 'Gallery responsive layout styles', () => {
	it( 'updates columns for the active viewport', () => {
		expect(
			getUpdatedGalleryStyle( {
				style: undefined,
				viewport: '@mobile',
				baseSettings: { columns: 2, imageCrop: true },
				settings: { columns: 1 },
			} )
		).toEqual( {
			'@mobile': { layout: { columns: 1 } },
		} );
	} );

	it( 'updates crop to fit for the active viewport', () => {
		expect(
			getUpdatedGalleryStyle( {
				style: {
					spacing: { blockGap: '10px' },
					'@mobile': { layout: { columns: 1 } },
				},
				viewport: '@tablet',
				baseSettings: { columns: 2, imageCrop: true },
				settings: { imageCrop: false },
			} )
		).toEqual( {
			spacing: { blockGap: '10px' },
			'@mobile': { layout: { columns: 1 } },
			'@tablet': { layout: { imageCrop: false } },
		} );
	} );

	it( 'removes a viewport override when it matches the base setting', () => {
		expect(
			getUpdatedGalleryStyle( {
				style: {
					'@mobile': {
						layout: { columns: 1, imageCrop: false },
					},
				},
				viewport: '@mobile',
				baseSettings: { columns: 2, imageCrop: true },
				settings: { columns: 2 },
			} )
		).toEqual( {
			'@mobile': { layout: { imageCrop: false } },
		} );
	} );

	it( 'applies a viewport-specific column count', () => {
		const css = getGalleryResponsiveLayoutCSS(
			'#block-test',
			{
				'@mobile': {
					layout: { columns: 3 },
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
			const css = getGalleryResponsiveLayoutCSS(
				'#block-test',
				{
					'@tablet': {
						layout: { imageCrop },
					},
				},
				MEDIA_QUERIES
			);

			expect( css ).toContain( objectFitRule );
			expect( css ).toContain( wrapperDisplayRule );
		}
	);

	it( 'ignores malformed viewport layout values', () => {
		const css = getGalleryResponsiveLayoutCSS(
			'#block-test',
			{
				'@tablet': {
					layout: { columns: '3', imageCrop: 'false' },
				},
				'@mobile': { layout: [] },
			},
			MEDIA_QUERIES
		);

		expect( css ).toBe( '' );
	} );
} );
