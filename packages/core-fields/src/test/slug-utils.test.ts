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

	it( 'derives the slug from the current title, not the server-generated slug', () => {
		expect(
			getSlug( {
				id: 123,
				title: 'Hello Slug',
				generated_slug: 'auto-draft',
			} )
		).toBe( 'hello-slug' );
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
