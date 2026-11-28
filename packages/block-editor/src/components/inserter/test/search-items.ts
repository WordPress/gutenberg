import { describe, expect, it } from 'vitest';
import items, {
	categories,
	collections,
	paragraphItem,
	advancedParagraphItem,
	moreItem,
	youtubeItem,
	paragraphEmbedItem,
} from './fixtures';
import { searchBlockItems } from '../search-items';

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

	it( 'should use the ranking algorithm to order the blocks', () => {
		expect(
			searchBlockItems( items, categories, collections, 'a para' )
		).toEqual( [
			paragraphEmbedItem,
			paragraphItem,
			advancedParagraphItem,
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
} );
