import { describe, expect, it } from 'vitest';
import { getBestImageUrl } from '../attachment/media_thumbnail/view';

const media = {
	source_url: 'https://example.com/original.jpg',
	media_details: {
		sizes: {
			thumbnail: {
				width: 150,
				height: 150,
				source_url: 'https://example.com/thumb.jpg',
			},
			medium: {
				width: 300,
				height: 200,
				source_url: 'https://example.com/medium.jpg',
			},
			large: {
				width: 1024,
				height: 683,
				source_url: 'https://example.com/large.jpg',
			},
		},
	},
};

/*
 * A copy of the `getBestImageUrl` tests of `@wordpress/media-fields`.
 */
describe( 'getBestImageUrl', () => {
	it( 'returns the source URL when the media has no sizes', () => {
		expect(
			getBestImageUrl(
				{ ...media, media_details: { sizes: {} } },
				'200px'
			)
		).toBe( media.source_url );
		expect(
			getBestImageUrl( { source_url: media.source_url }, '200px' )
		).toBe( media.source_url );
	} );

	it.each( [ undefined, 'auto' ] )(
		'returns the source URL when the target width is %s',
		( configSizes ) => {
			expect( getBestImageUrl( media, configSizes ) ).toBe(
				media.source_url
			);
		}
	);

	it.each( [
		[ '200px', 'https://example.com/medium.jpg' ],
		[ '300px', 'https://example.com/medium.jpg' ],
		[ '50px', 'https://example.com/thumb.jpg' ],
		[ '2000px', 'https://example.com/large.jpg' ],
	] )(
		'picks the smallest size at least %s wide, or the largest',
		( configSizes, expected ) => {
			expect( getBestImageUrl( media, configSizes ) ).toBe( expected );
		}
	);

	it( 'skips the sizes without a width', () => {
		expect(
			getBestImageUrl(
				{
					...media,
					media_details: {
						sizes: {
							broken: {
								source_url: 'https://example.com/broken.jpg',
							},
							medium: media.media_details.sizes.medium,
						},
					},
				},
				'200px'
			)
		).toBe( 'https://example.com/medium.jpg' );
		expect(
			getBestImageUrl(
				{
					...media,
					media_details: {
						sizes: {
							broken: {
								source_url: 'https://example.com/broken.jpg',
							},
						},
					},
				},
				'200px'
			)
		).toBe( media.source_url );
	} );
} );
