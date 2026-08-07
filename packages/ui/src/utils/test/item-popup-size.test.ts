import itemPopupStyles from '../css/item-popup.module.css';
import {
	getItemPopupSizeClassName,
	normalizeItemPopupSize,
} from '../item-popup-size';

describe( 'item-popup-size', () => {
	describe( 'normalizeItemPopupSize', () => {
		it.each( [
			[ undefined, 'default' ],
			[ 'default', 'default' ],
			[ 'compact', 'default' ],
			[ 'small', 'small' ],
		] as const )( 'maps %s to %s', ( size, expected ) => {
			expect( normalizeItemPopupSize( size ) ).toBe( expected );
		} );
	} );

	describe( 'getItemPopupSizeClassName', () => {
		it( 'returns the small size class only for small items', () => {
			expect(
				getItemPopupSizeClassName( 'small', itemPopupStyles )
			).toBe( itemPopupStyles[ 'is-size-small' ] );
		} );

		it( 'returns undefined for default and legacy compact sizes', () => {
			expect(
				getItemPopupSizeClassName( 'default', itemPopupStyles )
			).toBeUndefined();
			expect(
				getItemPopupSizeClassName( 'compact', itemPopupStyles )
			).toBeUndefined();
			expect(
				getItemPopupSizeClassName( undefined, itemPopupStyles )
			).toBeUndefined();
		} );
	} );
} );
