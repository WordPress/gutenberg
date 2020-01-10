/**
 * Internal dependencies
 */
import items, {
	categories,
	collections,
	textItem,
	advancedTextItem,
	moreItem,
	youtubeItem,
	textEmbedItem,
} from './fixtures';
import {
	normalizeSearchTerm,
	searchItems,
} from '../search-items';

describe( 'normalizeSearchTerm', () => {
	it( 'should return an empty array when no words detected', () => {
		expect( normalizeSearchTerm( ' - !? *** ' ) ).toEqual(
			[]
		);
	} );

	it( 'should remove diacritics', () => {
		expect( normalizeSearchTerm( 'média' ) ).toEqual(
			[ 'media' ]
		);
	} );

	it( 'should trim whitespace', () => {
		expect( normalizeSearchTerm( '  média  ' ) ).toEqual(
			[ 'media' ]
		);
	} );

	it( 'should convert to lowercase', () => {
		expect( normalizeSearchTerm( '  Média  ' ) ).toEqual(
			[ 'media' ]
		);
	} );

	it( 'should extract only words', () => {
		expect( normalizeSearchTerm( '  Média  &   Text Tag-Cloud > 123' ) ).toEqual(
			[ 'media', 'text', 'tag', 'cloud', '123' ]
		);
	} );
} );

describe( 'searchItems', () => {
	it( 'should return back all items when no terms detected', () => {
		expect( searchItems( items, categories, collections, ' - ? * ' ) ).toBe(
			items
		);
	} );

	it( 'should search items using the title ignoring case', () => {
		expect( searchItems( items, categories, collections, 'TEXT' ) ).toEqual(
			[ textItem, advancedTextItem, textEmbedItem ]
		);
	} );

	it( 'should search items using the keywords and partial terms', () => {
		expect( searchItems( items, categories, collections, 'GOOGL' ) ).toEqual(
			[ youtubeItem ]
		);
	} );

	it( 'should search items using the categories', () => {
		expect( searchItems( items, categories, collections, 'LAYOUT' ) ).toEqual(
			[ moreItem ]
		);
	} );

	it( 'should ignore a leading slash on a search term', () => {
		expect( searchItems( items, categories, collections, '/GOOGL' ) ).toEqual(
			[ youtubeItem ]
		);
	} );

	it( 'should match words using the mix of the title, category and keywords', () => {
		expect( searchItems( items, categories, collections, 'youtube embed video' ) ).toEqual(
			[ youtubeItem ]
		);
	} );
} );
