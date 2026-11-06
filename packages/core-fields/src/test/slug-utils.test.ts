import { describe, expect, it } from 'vitest';
import { getSlug } from '../post_type_supports/slug/utils';

describe( 'getSlug', () => {
	it( 'returns the slug if one exists', () => {
		expect(
			getSlug( {
				id: 123,
				slug: 'custom-slug',
				title: 'Edited Title',
			} )
		).toBe( 'custom-slug' );
	} );

	it( 'decodes a percent-encoded slug', () => {
		expect(
			getSlug( {
				id: 123,
				slug: '%e3%83%86%e3%82%b9%e3%83%88',
				title: 'Edited Title',
			} )
		).toBe( 'テスト' );
	} );

	it( 'derives the slug from the current title, not the server-generated slug', () => {
		expect(
			getSlug( {
				id: 123,
				title: 'Hello Slug',
				generated_slug: 'auto-draft',
			} )
		).toBe( 'hello-slug' );
	} );

	it( 'decodes the slug derived from the title', () => {
		expect(
			getSlug( {
				id: 123,
				title: '50%20',
				generated_slug: 'auto-draft',
			} )
		).toBe( '50 ' );
	} );

	it( 'returns an empty string for a post without a slug or a title', () => {
		expect(
			getSlug( {
				id: 123,
				title: '',
				generated_slug: 'auto-draft',
			} )
		).toBe( '' );
	} );
} );
