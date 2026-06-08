/**
 * Internal dependencies
 */
import {
	getItemExcerptOrContentSnippet,
	getItemTitle,
	getItemTitleWithFallbackSnippet,
} from '../utils';

describe( 'post action utils', () => {
	describe( 'getItemTitle', () => {
		it( 'returns a decoded plain-text title', () => {
			expect(
				getItemTitle( {
					title: { rendered: 'A <strong>bold</strong> title' },
				} )
			).toBe( 'A bold title' );
		} );
	} );

	describe( 'getItemExcerptOrContentSnippet', () => {
		it( 'uses the excerpt before the content', () => {
			expect(
				getItemExcerptOrContentSnippet( {
					title: { rendered: '' },
					excerpt: { rendered: '<p>Excerpt text</p>' },
					content: { rendered: '<p>Content text</p>' },
				} )
			).toBe( 'Excerpt text' );
		} );

		it( 'falls back to the content when the excerpt is empty', () => {
			expect(
				getItemExcerptOrContentSnippet( {
					title: { rendered: '' },
					excerpt: { rendered: '' },
					content: { rendered: '<p>Content &amp; more</p>' },
				} )
			).toBe( 'Content & more' );
		} );

		it( 'trims long snippets', () => {
			expect(
				getItemExcerptOrContentSnippet(
					{
						title: { rendered: '' },
						content: {
							rendered:
								'<p>This content is longer than expected.</p>',
						},
					},
					12
				)
			).toBe( 'This content...' );
		} );
	} );

	describe( 'getItemTitleWithFallbackSnippet', () => {
		it( 'returns the title when one exists', () => {
			expect(
				getItemTitleWithFallbackSnippet( {
					title: { rendered: 'A title' },
					excerpt: { rendered: 'Excerpt text' },
				} )
			).toBe( 'A title' );
		} );

		it( 'adds an excerpt snippet to the fallback title', () => {
			expect(
				getItemTitleWithFallbackSnippet( {
					title: { rendered: '' },
					excerpt: { rendered: '<p>Identifying excerpt</p>' },
				} )
			).toBe( '(no title) Identifying excerpt' );
		} );

		it( 'uses content when title and excerpt are empty', () => {
			expect(
				getItemTitleWithFallbackSnippet( {
					title: { rendered: '' },
					excerpt: { rendered: '' },
					content: { rendered: '<p>Identifying content</p>' },
				} )
			).toBe( '(no title) Identifying content' );
		} );

		it( 'returns only the fallback when no snippet is available', () => {
			expect(
				getItemTitleWithFallbackSnippet( {
					title: { rendered: '' },
					excerpt: { rendered: '' },
					content: { rendered: '' },
				} )
			).toBe( '(no title)' );
		} );
	} );
} );
