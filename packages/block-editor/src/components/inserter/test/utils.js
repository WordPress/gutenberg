/**
 * Internal dependencies
 */
import {
	moreItem,
	paragraphItem,
	someOtherItem,
	withVariationsItem,
	withSingleVariationItem,
} from './fixtures';
import { includeVariationsInInserterItems } from '../utils';

describe( 'inserter utils', () => {
	describe( 'includeVariationsInInserterItems', () => {
		it( 'should return items if limit is equal to items length', () => {
			const items = [ moreItem, paragraphItem, someOtherItem ];
			const res = includeVariationsInInserterItems( items, 3 );
			expect( res ).toEqual( items );
		} );
		it( 'should slice items if items are more than provided limit', () => {
			const items = [
				moreItem,
				paragraphItem,
				someOtherItem,
				withVariationsItem,
			];
			const res = includeVariationsInInserterItems( items, 2 );
			expect( res ).toEqual( [ moreItem, paragraphItem ] );
		} );
		it( 'should fill the items with variations, if limit is set and items are fewer than limit and variations exist', () => {
			const items = [ moreItem, paragraphItem, withVariationsItem ];
			const res = includeVariationsInInserterItems( items, 5 );
			expect( res.length ).toEqual( 5 );
			expect( res ).toEqual( [
				...items,
				expect.objectContaining( {
					id: 'core/block-with-variations-variation-one',
					title: 'Variation One',
				} ),
				expect.objectContaining( {
					id: 'core/block-with-variations-variation-two',
					title: 'Variation Two',
				} ),
			] );
		} );
		it( 'should return the items, if limit is set and items are fewer than limit and variations do NOT exist', () => {
			const items = [ moreItem, paragraphItem, someOtherItem ];
			const res = includeVariationsInInserterItems( items, 4 );
			expect( res.length ).toEqual( 3 );
			expect( res ).toEqual( items );
		} );
		it( 'should return proper result if no limit provided and block variations do NOT exist', () => {
			const items = [ moreItem, paragraphItem, someOtherItem ];
			const res = includeVariationsInInserterItems( items );
			expect( res ).toEqual( items );
		} );
		it( 'should return proper result if no limit provided and block variations exist', () => {
			const items = [
				moreItem,
				paragraphItem,
				someOtherItem,
				withSingleVariationItem,
			];
			const expected = [
				...items,
				{
					...withSingleVariationItem,
					id: 'core/embed-youtube',
					title: 'YouTube',
					description: 'youtube description',
				},
			];
			const res = includeVariationsInInserterItems( items );
			expect( res ).toEqual( expected );
		} );
	} );
} );
