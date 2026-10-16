import { describe, expect, it } from 'vitest';
import type { BasePost } from '../../../types';
import { getSlug } from '../utils';

const createPost = ( overrides: Partial< BasePost > ): BasePost => ( {
	id: 123,
	type: 'post',
	title: 'Sample Post',
	content: '',
	...overrides,
} );

describe( 'getSlug', () => {
	it( 'returns the slug if one exists', () => {
		expect(
			getSlug(
				createPost( {
					status: 'publish',
					slug: 'custom-slug',
					title: 'Edited Title',
				} )
			)
		).toBe( 'custom-slug' );
	} );

	it( 'derives the slug from the current title, not the server-generated slug', () => {
		expect(
			getSlug(
				createPost( {
					status: 'draft',
					title: 'Hello Slug',
					generated_slug: 'auto-draft',
				} )
			)
		).toBe( 'hello-slug' );
	} );

	it( 'returns an empty string for a post without a slug or a title', () => {
		expect(
			getSlug(
				createPost( {
					status: 'auto-draft',
					title: '',
					generated_slug: 'auto-draft',
				} )
			)
		).toBe( '' );
	} );
} );
