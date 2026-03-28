/**
 * Internal dependencies
 */
import { buildButtonUrlEntityBinding } from '../use-button-url-entity-binding';

describe( 'buildButtonUrlEntityBinding', () => {
	it( 'builds core/post-data binding with postType in args', () => {
		expect(
			buildButtonUrlEntityBinding( {
				id: 5,
				kind: 'post-type',
				type: 'page',
				url: 'https://example.com',
			} )
		).toEqual( {
			url: {
				source: 'core/post-data',
				args: {
					field: 'link',
					id: 5,
					postType: 'page',
				},
			},
		} );
	} );

	it( 'builds core/term-data binding and maps tag to post_tag', () => {
		expect(
			buildButtonUrlEntityBinding( {
				id: 7,
				kind: 'taxonomy',
				type: 'tag',
				url: 'https://example.com/tag/js',
			} )
		).toEqual( {
			url: {
				source: 'core/term-data',
				args: {
					field: 'link',
					id: 7,
					taxonomy: 'post_tag',
				},
			},
		} );
	} );

	it( 'maps LinkControl media kind to core/post-data with postType attachment', () => {
		expect(
			buildButtonUrlEntityBinding( {
				id: 68,
				kind: 'media',
				type: 'attachment',
				url: 'https://example.com/wp-content/uploads/file.jpg',
			} )
		).toEqual( {
			url: {
				source: 'core/post-data',
				args: {
					field: 'link',
					id: 68,
					postType: 'attachment',
				},
			},
		} );
	} );

	it( 'returns null for custom links without entity metadata', () => {
		expect(
			buildButtonUrlEntityBinding( { url: 'https://example.org' } )
		).toBeNull();
	} );
} );
