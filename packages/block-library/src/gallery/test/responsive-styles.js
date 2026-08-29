import {
	getGalleryResponsiveFlexCSS,
	getUpdatedGalleryStyle,
} from '../responsive-styles';

const MEDIA_QUERIES = {
	'@tablet': '@media (480px < width <= 782px)',
	'@mobile': '@media (width <= 480px)',
};

describe( 'Gallery responsive Flex styles', () => {
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
		const css = getGalleryResponsiveFlexCSS(
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
			const css = getGalleryResponsiveFlexCSS(
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

	it( 'ignores malformed viewport Gallery values', () => {
		const css = getGalleryResponsiveFlexCSS(
			'#block-test',
			{
				'@tablet': {
					columns: '3',
					imageCrop: 'false',
				},
				'@mobile': [],
			},
			MEDIA_QUERIES
		);

		expect( css ).toBe( '' );
	} );
} );
