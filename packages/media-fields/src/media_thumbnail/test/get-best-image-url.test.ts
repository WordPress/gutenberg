/**
 * Internal dependencies
 */
import { getBestImageUrl } from '../view';

type Media = Parameters< typeof getBestImageUrl >[ 0 ];

const baseMedia: Media = {
	id: 1,
	date: '2024-01-01T00:00:00',
	date_gmt: '2024-01-01T00:00:00',
	guid: {
		raw: 'https://example.com/?attachment_id=1',
		rendered: 'https://example.com/?attachment_id=1',
	},
	modified: '2024-01-01T00:00:00',
	modified_gmt: '2024-01-01T00:00:00',
	slug: 'test-image',
	status: 'publish',
	type: 'attachment',
	link: 'https://example.com/test-image/',
	title: { raw: 'Test Image', rendered: 'Test Image' },
	author: 1,
	featured_media: 0,
	comment_status: 'open',
	ping_status: 'closed',
	template: '',
	permalink_template: '',
	generated_slug: 'test-image',
	class_list: [ 'attachment' ],
	caption: { raw: '', rendered: '' },
	description: { raw: '', rendered: '' },
	alt_text: 'A test image',
	media_type: 'image',
	mime_type: 'image/jpeg',
	post: null,
	source_url: 'https://example.com/original.jpg',
	missing_image_sizes: [],
	meta: {},
	media_details: {
		sizes: {
			thumbnail: {
				file: 'original-150x150.jpg',
				width: 150,
				height: 150,
				mime_type: 'image/jpeg',
				source_url: 'https://example.com/thumb.jpg',
			},
			medium: {
				file: 'original-300x200.jpg',
				width: 300,
				height: 200,
				mime_type: 'image/jpeg',
				source_url: 'https://example.com/medium.jpg',
			},
			large: {
				file: 'original-1024x683.jpg',
				width: 1024,
				height: 683,
				mime_type: 'image/jpeg',
				source_url: 'https://example.com/large.jpg',
			},
		},
	},
};

describe( 'getBestImageUrl', () => {
	describe( 'when media_details.sizes is unavailable', () => {
		it( 'returns source_url when media_details has no sizes', () => {
			const media = {
				...baseMedia,
				media_details: { sizes: {} },
			};
			expect( getBestImageUrl( media ) ).toBe( baseMedia.source_url );
		} );
	} );

	describe( 'when configSizes is not provided or unparseable', () => {
		it( 'returns source_url when configSizes is undefined', () => {
			expect( getBestImageUrl( baseMedia ) ).toBe( baseMedia.source_url );
		} );

		it( 'returns source_url when configSizes is not a number', () => {
			expect( getBestImageUrl( baseMedia, 'auto' ) ).toBe(
				baseMedia.source_url
			);
		} );
	} );

	describe( 'size selection with a valid target width', () => {
		it( 'picks the smallest size >= target width', () => {
			expect( getBestImageUrl( baseMedia, '200px' ) ).toBe(
				'https://example.com/medium.jpg'
			);
		} );

		it( 'picks an exact match', () => {
			expect( getBestImageUrl( baseMedia, '300px' ) ).toBe(
				'https://example.com/medium.jpg'
			);
		} );

		it( 'picks the smallest available size when target is very small', () => {
			expect( getBestImageUrl( baseMedia, '50px' ) ).toBe(
				'https://example.com/thumb.jpg'
			);
		} );

		it( 'falls back to the largest size when target exceeds all sizes', () => {
			expect( getBestImageUrl( baseMedia, '2000px' ) ).toBe(
				'https://example.com/large.jpg'
			);
		} );
	} );

	// These tests deliberately omit required Size fields (width, height, etc.)
	// to verify runtime defensiveness, so we cast via `unknown` to bypass TS.
	describe( 'when size entries have missing or invalid widths', () => {
		it( 'skips entries without a width and selects from valid ones', () => {
			const media = {
				...baseMedia,
				media_details: {
					sizes: {
						broken: {
							source_url: 'https://example.com/broken.jpg',
						},
						medium: {
							file: 'original-300x200.jpg',
							width: 300,
							height: 200,
							mime_type: 'image/jpeg',
							source_url: 'https://example.com/medium.jpg',
						},
					},
				},
			} as unknown as Media;
			expect( getBestImageUrl( media, '200px' ) ).toBe(
				'https://example.com/medium.jpg'
			);
		} );

		it( 'falls back to source_url when all entries lack a valid width', () => {
			const media = {
				...baseMedia,
				media_details: {
					sizes: {
						broken: {
							source_url: 'https://example.com/broken.jpg',
						},
						also_broken: {
							source_url: 'https://example.com/also-broken.jpg',
						},
					},
				},
			} as unknown as Media;
			expect( getBestImageUrl( media, '200px' ) ).toBe(
				baseMedia.source_url
			);
		} );
	} );
} );
