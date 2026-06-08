/**
 * Internal dependencies
 */
import { getPostTitleWithFallbackSnippet } from '../get-post-title-with-fallback-snippet';

describe( 'getPostTitleWithFallbackSnippet', () => {
	it( 'returns a decoded plain-text title when present', () => {
		expect(
			getPostTitleWithFallbackSnippet( {
				title: { raw: '', rendered: '<strong>Attached</strong> post' },
				excerpt: { raw: 'Excerpt', rendered: 'Excerpt' },
			} )
		).toBe( 'Attached post' );
	} );

	it( 'uses the excerpt for a titleless post', () => {
		expect(
			getPostTitleWithFallbackSnippet( {
				title: { raw: '', rendered: '' },
				excerpt: {
					raw: 'Attached excerpt',
					rendered: '<p>Attached excerpt</p>',
				},
			} )
		).toBe( '(no title) Attached excerpt' );
	} );

	it( 'uses the content when the title and excerpt are empty', () => {
		expect(
			getPostTitleWithFallbackSnippet( {
				title: { raw: '', rendered: '' },
				excerpt: { raw: '', rendered: '' },
				content: {
					raw: 'Attached content',
					rendered: '<p>Attached content</p>',
				},
			} )
		).toBe( '(no title) Attached content' );
	} );

	it( 'returns only the fallback when no snippet is available', () => {
		expect(
			getPostTitleWithFallbackSnippet( {
				title: { raw: '', rendered: '' },
				excerpt: { raw: '', rendered: '' },
				content: { raw: '', rendered: '' },
			} )
		).toBe( '(no title)' );
	} );
} );
