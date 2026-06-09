/**
 * Internal dependencies
 */
import type { BasePost } from '../../../types';
import { getTitleWithFallbackName } from '../utils';

describe( 'getTitleWithFallbackName', () => {
	it( 'returns the decoded post title when present', () => {
		expect(
			getTitleWithFallbackName( {
				id: 1,
				type: 'page',
				title: { rendered: 'Parent &amp; page' },
				content: { rendered: '' },
			} as BasePost )
		).toBe( 'Parent & page' );
	} );

	it( 'uses an excerpt snippet for titleless posts', () => {
		expect(
			getTitleWithFallbackName( {
				id: 1,
				type: 'page',
				title: { rendered: '' },
				excerpt: { rendered: '<p>A recognizable parent page</p>' },
				content: { rendered: '' },
			} as BasePost )
		).toBe( '(no title) A recognizable parent page' );
	} );

	it( 'uses the fallback when the post has no identifying text', () => {
		expect(
			getTitleWithFallbackName( {
				id: 1,
				type: 'page',
				title: { rendered: '' },
				content: { rendered: '' },
			} as BasePost )
		).toBe( '(no title)' );
	} );
} );
