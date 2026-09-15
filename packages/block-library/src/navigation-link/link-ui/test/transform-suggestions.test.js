import { describe, expect, it } from 'vitest';
import { transformSuggestions } from '../transform-suggestions';

// Data shapes mirror the output of fetchLinkSuggestions from
// core-data/src/fetch/__experimental-fetch-link-suggestions.ts.
const aPage = {
	id: 2,
	url: 'http://wordpress.local/sample-page/',
	title: 'Sample Page',
	type: 'page',
	kind: 'post-type',
};
const aPost = {
	id: 3,
	url: 'http://wordpress.local/hello-world/',
	title: 'Hello world!',
	type: 'post',
	kind: 'post-type',
};
const aCategory = {
	id: 4,
	url: 'http://wordpress.local/category/favorites/',
	title: 'Favorites',
	type: 'category',
	kind: 'taxonomy',
};
const aTag = {
	id: 5,
	url: 'http://wordpress.local/tag/holiday/',
	title: 'Holiday',
	type: 'post_tag',
	kind: 'taxonomy',
};
const anAttachment = {
	id: 6,
	url: 'http://wordpress.local/wp-content/uploads/photo.jpg',
	title: 'photo',
	type: 'attachment',
	kind: 'media',
};

const ids = ( suggestions ) => suggestions.map( ( { id } ) => id );

describe( 'transformSuggestions', () => {
	it( 'removes attachment results', () => {
		const results = transformSuggestions( [ aPage, anAttachment, aPost ], {
			type: 'page',
			kind: 'post-type',
		} );

		expect( ids( results ) ).not.toContain( anAttachment.id );
	} );

	it( 'keeps posts, pages and terms', () => {
		const results = transformSuggestions(
			[ aPage, aPost, aCategory, aTag ],
			{ type: 'page', kind: 'post-type' }
		);

		expect( ids( results ) ).toEqual( [
			aPage.id,
			aPost.id,
			aCategory.id,
			aTag.id,
		] );
	} );

	it( 'orders results matching the block’s own type first', () => {
		const results = transformSuggestions( [ aPost, aCategory, aPage ], {
			type: 'category',
			kind: 'taxonomy',
		} );

		expect( ids( results ) ).toEqual( [
			aCategory.id,
			aPost.id,
			aPage.id,
		] );
	} );

	it( 'preserves relevance order within each group', () => {
		const firstPage = { ...aPage, id: 10, title: 'Contact' };
		const secondPage = { ...aPage, id: 11, title: 'Contact us today' };
		const firstPost = { ...aPost, id: 12, title: 'Contact form tips' };
		const secondPost = { ...aPost, id: 13, title: 'Contacting support' };

		const results = transformSuggestions(
			[ firstPage, firstPost, secondPage, secondPost ],
			{ type: 'page', kind: 'post-type' }
		);

		expect( ids( results ) ).toEqual( [ 10, 11, 12, 13 ] );
	} );

	it( 'treats the block’s tag type as the API’s post_tag subtype', () => {
		const results = transformSuggestions( [ aPage, aCategory, aTag ], {
			type: 'tag',
			kind: 'taxonomy',
		} );

		expect( ids( results )[ 0 ] ).toBe( aTag.id );
	} );

	it( 'distinguishes a post type from a taxonomy sharing a name', () => {
		const eventPostType = {
			id: 20,
			url: 'http://wordpress.local/event/summer-fair/',
			title: 'Summer Fair',
			type: 'event',
			kind: 'post-type',
		};
		const eventTaxonomy = {
			id: 21,
			url: 'http://wordpress.local/event/annual/',
			title: 'Annual',
			type: 'event',
			kind: 'taxonomy',
		};

		const results = transformSuggestions(
			[ eventPostType, eventTaxonomy ],
			{ type: 'event', kind: 'taxonomy' }
		);

		expect( ids( results ) ).toEqual( [
			eventTaxonomy.id,
			eventPostType.id,
		] );
	} );

	it( 'prioritises pages when the block has no type yet', () => {
		const results = transformSuggestions( [ aCategory, aPost, aPage ], {} );

		expect( ids( results )[ 0 ] ).toBe( aPage.id );
	} );

	it( 'prioritises pages for a custom link', () => {
		const results = transformSuggestions( [ aCategory, aPost, aPage ], {
			type: 'custom',
			kind: 'custom',
		} );

		expect( ids( results )[ 0 ] ).toBe( aPage.id );
	} );

	it( 'returns the list untouched when nothing matches the priority type', () => {
		const results = transformSuggestions( [ aPost, aCategory, aTag ], {
			type: 'page',
			kind: 'post-type',
		} );

		expect( ids( results ) ).toEqual( [ aPost.id, aCategory.id, aTag.id ] );
	} );
} );
