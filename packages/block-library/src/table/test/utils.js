/**
 * Internal dependencies
 */
import { getListItemBullet } from '../utils';

describe( 'getListItemBullet', () => {
	it( 'UL list item', () => {
		expect( getListItemBullet( 'UL', false, 0 ) ).toBe( '-' );
		expect( getListItemBullet( 'UL', false, 100 ) ).toBe( '-' );
	} );
	it( 'OL numeric item', () => {
		expect( getListItemBullet( 'OL', true, 0 ) ).toBe( '1.' );
		expect( getListItemBullet( 'OL', true, 26 ) ).toBe( '27.' );
		expect( getListItemBullet( 'OL', true, 53 ) ).toBe( '54.' );
	} );
	it( 'OL character list item', () => {
		expect( getListItemBullet( 'OL', false, 0 ) ).toBe( 'a.' );
		expect( getListItemBullet( 'OL', false, 26 ) ).toBe( 'aa.' );
		expect( getListItemBullet( 'OL', false, 53 ) ).toBe( 'bbb.' );
	} );
} );
