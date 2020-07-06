/**
 * Internal dependencies
 */
import items, {
	categories,
	collections,
	paragraphItem,
	advancedParagraphItem,
	moreItem,
	youtubeItem,
	paragraphEmbedItem,
} from './fixtures';
import { normalizeSearchTerm, searchBlockItems } from '../search-items';

describe( 'normalizeSearchTerm', () => {
	it( 'should return an empty array when no words detected', () => {
		expect( normalizeSearchTerm( ' - !? *** ' ) ).toEqual( [] );
	} );

	it( 'should remove diacritics', () => {
		expect( normalizeSearchTerm( 'média' ) ).toEqual( [ 'media' ] );
	} );

	it( 'should trim whitespace', () => {
		expect( normalizeSearchTerm( '  média  ' ) ).toEqual( [ 'media' ] );
	} );

	it( 'should convert to lowercase', () => {
		expect( normalizeSearchTerm( '  Média  ' ) ).toEqual( [ 'media' ] );
	} );

	it( 'should extract only words', () => {
		expect(
			normalizeSearchTerm( '  Média  &   Text Tag-Cloud > 123' )
		).toEqual( [ 'media', 'text', 'tag', 'cloud', '123' ] );
	} );
} );

describe( 'searchBlockItems', () => {
	it( 'should return back all items when no terms detected', () => {
		expect(
			searchBlockItems( items, categories, collections, ' - ? * ' )
		).toBe( items );
	} );

	it( 'should search items using the title ignoring case', () => {
		expect(
			searchBlockItems( items, categories, collections, 'paragraph' )
		).toEqual( [
			paragraphItem,
			advancedParagraphItem,
			paragraphEmbedItem,
		] );
	} );

	it( 'should search items using the keywords and partial terms', () => {
		expect(
			searchBlockItems( items, categories, collections, 'GOOGL' )
		).toEqual( [ youtubeItem ] );
	} );

	it( 'should search items using the categories', () => {
		expect(
			searchBlockItems( items, categories, collections, 'DESIGN' )
		).toEqual( [ moreItem ] );
	} );

	it( 'should ignore a leading slash on a search term', () => {
		expect(
			searchBlockItems( items, categories, collections, '/GOOGL' )
		).toEqual( [ youtubeItem ] );
	} );

	it( 'should match words using the mix of the title, category and keywords', () => {
		expect(
			searchBlockItems(
				items,
				categories,
				collections,
				'youtube embed video'
			)
		).toEqual( [ youtubeItem ] );
	} );

	it( 'should match words using also variations and return all matched variations', () => {
		const filteredItems = searchBlockItems(
			items,
			categories,
			collections,
			'variation'
		);

		expect( filteredItems ).toHaveLength( 1 );
		expect( filteredItems[ 0 ].variations ).toHaveLength( 3 );
	} );

	it( 'should match words using also variations and filter out unmatched variations', () => {
		const filteredItems = searchBlockItems(
			items,
			categories,
			collections,
			'variations two three'
		);

		expect( filteredItems ).toHaveLength( 1 );
		expect( filteredItems[ 0 ].variations ).toHaveLength( 2 );
		expect( filteredItems[ 0 ].variations[ 0 ].title ).toBe(
			'Variation Two'
		);
		expect( filteredItems[ 0 ].variations[ 1 ].title ).toBe(
			'Variation Three'
		);
	} );
} );
