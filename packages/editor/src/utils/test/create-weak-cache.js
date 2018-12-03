/**
 * Internal dependencies
 */
import createWeakCache from '../create-weak-cache';

describe( 'createWeakCache', () => {
	const getNumKeys = jest.fn().mockImplementation( ( object ) => Object.keys( object ).length );
	const getNumKeysCached = createWeakCache( getNumKeys );

	beforeEach( () => {
		getNumKeys.mockClear();
	} );

	it( 'should return the value from the function argument', () => {
		const object = { a: 1 };

		expect( getNumKeysCached( object ) ).toBe( 1 );
	} );

	it( 'should return the value from cache', () => {
		const object = { a: 1 };

		expect( getNumKeysCached( object ) ).toBe( 1 );
		expect( getNumKeysCached( object ) ).toBe( 1 );
		expect( getNumKeys ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should return the value from the function argument on new reference', () => {
		expect( getNumKeysCached( { a: 1 } ) ).toBe( 1 );
		expect( getNumKeysCached( { a: 1 } ) ).toBe( 1 );
		expect( getNumKeys ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should throw on invalid key argument', () => {
		expect( () => getNumKeysCached( undefined ) ).toThrow();
	} );

	it( 'should discard additional arguments', () => {
		expect( createWeakCache( ( a, b ) => b || 'ok' )( {}, 10 ) ).toBe( 'ok' );
	} );
} );
