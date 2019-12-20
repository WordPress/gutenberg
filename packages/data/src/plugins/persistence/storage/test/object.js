/**
 * Internal dependencies
 */
import objectStorage from '../object';

describe( 'objectStorage', () => {
	beforeEach( () => {
		objectStorage.clear();
	} );

	describe( 'getItem', () => {
		it( 'should return null if there is no item with key', () => {
			const result = objectStorage.getItem( 'foo' );

			expect( result ).toBe( null );
		} );

		it( 'should return the value of assigned item', () => {
			objectStorage.setItem( 'foo', 'bar' );
			const result = objectStorage.getItem( 'foo' );

			expect( result ).toBe( 'bar' );
		} );
	} );

	describe( 'setItem', () => {
		it( 'should set item by key for future retrieval', () => {
			objectStorage.setItem( 'foo', 'bar' );
			const result = objectStorage.getItem( 'foo' );

			expect( result ).toBe( 'bar' );
		} );

		it( 'should assign as string', () => {
			objectStorage.setItem( 'foo', null );
			const result = objectStorage.getItem( 'foo' );

			expect( result ).toBe( 'null' );
		} );
	} );
} );
