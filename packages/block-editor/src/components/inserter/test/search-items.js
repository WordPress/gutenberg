/**
 * Internal dependencies
 */
import items, {
	categories,
	textItem,
	advancedTextItem,
	moreItem,
	youtubeItem,
	textEmbedItem,
} from './fixtures';
import { searchItems, normalizeTerm } from '../search-items';

describe( 'normalizeTerm', () => {
	it( 'should remove diacritics', () => {
		expect( normalizeTerm( 'média' ) ).toEqual(
			'media'
		);
	} );

	it( 'should trim whitespace', () => {
		expect( normalizeTerm( '  média  ' ) ).toEqual(
			'media'
		);
	} );

	it( 'should convert to lowercase', () => {
		expect( normalizeTerm( '  Média  ' ) ).toEqual(
			'media'
		);
	} );
} );

describe( 'searchItems', () => {
	it( 'should search items using the title ignoring case', () => {
		expect( searchItems( items, categories, 'TEXT' ) ).toEqual(
			[ textItem, advancedTextItem, textEmbedItem ]
		);
	} );

	it( 'should search items using the keywords', () => {
		expect( searchItems( items, categories, 'GOOGL' ) ).toEqual(
			[ youtubeItem ]
		);
	} );

	it( 'should search items using the categories', () => {
		expect( searchItems( items, categories, 'LAYOUT' ) ).toEqual(
			[ moreItem ]
		);
	} );

	it( 'should ignore a leading slash on a search term', () => {
		expect( searchItems( items, categories, '/GOOGL' ) ).toEqual(
			[ youtubeItem ]
		);
	} );
} );
