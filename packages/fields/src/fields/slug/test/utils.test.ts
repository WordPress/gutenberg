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
					status: 'draft',
					slug: 'custom-slug',
					generated_slug: 'sample-post',
				} )
			)
		).toBe( 'custom-slug' );
	} );

	it( 'returns the server-generated slug if no slug exists', () => {
		expect(
			getSlug(
				createPost( {
					status: 'draft',
					generated_slug: 'server-generated-slug',
				} )
			)
		).toBe( 'server-generated-slug' );
	} );

	it( 'ignores the server-generated slug of an auto-draft', () => {
		expect(
			getSlug(
				createPost( {
					status: 'auto-draft',
					title: 'Hello Slug',
					generated_slug: 'auto-draft',
				} )
			)
		).toBe( 'hello-slug' );
	} );
} );
