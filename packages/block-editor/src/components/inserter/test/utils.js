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
