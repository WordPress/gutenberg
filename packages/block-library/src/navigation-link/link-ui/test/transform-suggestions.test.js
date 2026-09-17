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
const aPostFormat = {
	id: 7,
	url: 'http://wordpress.local/type/aside/',
	title: 'Aside',
	type: 'post-format',
	kind: 'taxonomy',
};
// A custom post type whose slug contains a hyphen, which updateAttributes
// stores with an underscore.
const aCustomPostType = {
	id: 8,
	url: 'http://wordpress.local/event-series/summer/',
	title: 'Summer Series',
	type: 'event-series',
	kind: 'post-type',
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
	it( 'removes attachments and keeps every other entity', () => {
		const results = transformSuggestions(
			[ aPage, anAttachment, aPost, aCategory, aTag ],
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

	it.each( [
		[ 'tag', 'post_tag', aTag ],
		[ 'post_format', 'post-format', aPostFormat ],
		[ 'event_series', 'event-series', aCustomPostType ],
	] )(
		'matches the block’s %s type against the API’s %s subtype',
		( type, _subtype, expected ) => {
			const results = transformSuggestions(
				[ aPage, aCategory, aTag, aPostFormat, aCustomPostType ],
				{ type, kind: expected.kind }
			);

			expect( ids( results )[ 0 ] ).toBe( expected.id );
		}
	);

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

	it.each( [
		[ 'a freshly appended item', {} ],
		[ 'a custom link', { type: 'custom', kind: 'custom' } ],
	] )( 'prioritises pages for %s', ( _label, attributes ) => {
		const results = transformSuggestions(
			[ aCategory, aPost, aPage ],
			attributes
		);

		expect( ids( results )[ 0 ] ).toBe( aPage.id );
	} );

	it( 'never prioritises a suggestion that is not an entity', () => {
		// e.g. LinkControl's "Create page" option, which carries no kind. Were
		// it treated as an entity it would take the page fallback and sort
		// above the category.
		const createOption = {
			title: 'Contact',
			url: 'Contact',
			type: '__CREATE__',
		};

		const results = transformSuggestions( [ aCategory, createOption ], {} );

		expect( results ).toEqual( [ aCategory, createOption ] );
	} );

	describe( 'ordering', () => {
		const contactPage = { ...aPage, id: 30, title: 'Contact' };
		const contactUsPage = { ...aPage, id: 31, title: 'Contact us' };
		const contactCategory = { ...aCategory, id: 32, title: 'Contact' };
		const pageAttributes = { type: 'page', kind: 'post-type' };

		it( 'keeps the preferred type first when another type matches only the whole title', () => {
			// "Coffee Guide" matches everything that was typed. The category
			// is not a better answer just because its title stops there.
			const coffeeGuidePage = { ...aPage, id: 33, title: 'Coffee Guide' };
			const coffeeCategory = { ...aCategory, id: 34, title: 'Coffee' };

			const results = transformSuggestions(
				[ coffeeCategory, coffeeGuidePage ],
				pageAttributes,
				'coffee'
			);

			expect( ids( results ) ).toEqual( [
				coffeeGuidePage.id,
				coffeeCategory.id,
			] );
		} );

		it( 'keeps the preferred type first when it matches as well as another type', () => {
			const results = transformSuggestions(
				[ contactCategory, contactPage, contactUsPage ],
				pageAttributes,
				'contact'
			);

			expect( ids( results ) ).toEqual( [
				contactPage.id,
				contactUsPage.id,
				contactCategory.id,
			] );
		} );

		it( 'leads with another type when only it matches what was typed', () => {
			const results = transformSuggestions(
				[ aPage, aPost, aCategory ],
				pageAttributes,
				'favorites'
			);

			// aCategory is titled "Favorites"; no page matches at all.
			expect( ids( results )[ 0 ] ).toBe( aCategory.id );
		} );

		it( 'shows no more than three of the preferred type before the rest', () => {
			const pages = [ 1, 2, 3, 4 ].map( ( n ) => ( {
				...aPage,
				id: 40 + n,
				title: `Page ${ n }`,
			} ) );

			// The category is less relevant than the fourth page, but only
			// three pages come first, so it is no longer last.
			const results = transformSuggestions(
				[ ...pages.slice( 0, 3 ), aCategory, pages[ 3 ] ],
				pageAttributes,
				'zzz'
			);

			expect( ids( results ) ).toEqual( [
				41,
				42,
				43,
				aCategory.id,
				44,
			] );
		} );

		it( 'does not elevate on a short search', () => {
			const results = transformSuggestions(
				[ aPage, contactCategory ],
				pageAttributes,
				'con'
			);

			expect( ids( results )[ 0 ] ).toBe( aPage.id );
		} );

		it( 'removes an entity returned by more than one search', () => {
			const results = transformSuggestions(
				[ contactPage, contactPage, contactCategory ],
				pageAttributes,
				'contact'
			);

			expect( ids( results ) ).toEqual( [
				contactPage.id,
				contactCategory.id,
			] );
		} );
	} );

	it( 'returns the list untouched when nothing matches the priority type', () => {
		const results = transformSuggestions( [ aPost, aCategory, aTag ], {
			type: 'page',
			kind: 'post-type',
		} );

		expect( ids( results ) ).toEqual( [ aPost.id, aCategory.id, aTag.id ] );
	} );
} );
