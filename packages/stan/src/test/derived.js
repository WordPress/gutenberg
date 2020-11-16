/**
 * Internal dependencies
 */
import { createAtomRegistry, createAtom, createDerivedAtom } from '../';

async function flushImmediatesAndTicks( count = 1 ) {
	for ( let i = 0; i < count; i++ ) {
		await jest.runAllTicks();
		await jest.runAllImmediates();
	}
}

describe( 'creating derived atoms', () => {
	it( 'should allow creating derived atom', async () => {
		const count1 = createAtom( 1 );
		const count2 = createAtom( 1 );
		const count3 = createAtom( 1 );
		const sum = createDerivedAtom(
			( { get } ) => get( count1 ) + get( count2 ) + get( count3 )
		);
		const registry = createAtomRegistry();

		// Atoms don't compute any value unless there's a subscriber.
		const unsubscribe = registry.subscribe( sum, () => {} );
		expect( registry.get( sum ) ).toEqual( 3 );
		registry.set( count1, 2 );
		expect( registry.get( sum ) ).toEqual( 4 );
		unsubscribe();
	} );

	it( 'should allow async derived atoms', async () => {
		const count1 = createAtom( 1 );
		const sum = createDerivedAtom( async ( { get } ) => {
			const value = await Promise.resolve( 10 );
			return get( count1 ) + value;
		} );
		const registry = createAtomRegistry();
		// Atoms don't compute any value unless there's a subscriber.
		const unsubscribe = registry.subscribe( sum, () => {} );
		await flushImmediatesAndTicks();
		expect( registry.get( sum ) ).toEqual( 11 );
		unsubscribe();
	} );

	it( 'should allow nesting derived atoms', async () => {
		const count1 = createAtom( 1 );
		const count2 = createAtom( 10 );
		const asyncCount = createDerivedAtom( async ( { get } ) => {
			return ( await get( count2 ) ) * 2;
		} );
		const sum = createDerivedAtom( async ( { get } ) => {
			return get( count1 ) + get( asyncCount );
		} );
		const registry = createAtomRegistry();
		// Atoms don't compute any value unless there's a subscriber.
		const unsubscribe = registry.subscribe( sum, () => {} );
		await flushImmediatesAndTicks( 2 );
		expect( registry.get( sum ) ).toEqual( 21 );
		unsubscribe();
	} );

	it( 'should only compute derived atoms when they have subscribers or when you try to retrieve their value', () => {
		const mock = jest.fn();
		mock.mockImplementation( () => 10 );
		const count1 = createAtom( 1 );
		const count2 = createAtom( 1 );
		const sum = createDerivedAtom(
			( { get } ) => get( count1 ) + get( count2 ) + mock()
		);
		const registry = createAtomRegistry();
		// Creating an atom or adding it to the registry don't trigger its resolution
		expect( mock ).not.toHaveBeenCalled();
		expect( registry.get( sum ) ).toEqual( 12 );
		// Calling "get" triggers a resolution.
		expect( mock ).toHaveBeenCalledTimes( 1 );

		// This shouldn't trigger the resolution because the atom has no listener.
		registry.set( count1, 2 );
		expect( mock ).toHaveBeenCalledTimes( 1 );

		// Subscribing triggers the resolution again.
		const unsubscribe = registry.subscribe( sum, () => {} );
		expect( mock ).toHaveBeenCalledTimes( 2 );
		expect( registry.get( sum ) ).toEqual( 13 );
		unsubscribe();
	} );

	it( 'should notify subscribers on change', () => {
		const count1 = createAtom( 1 );
		const count2 = createAtom( 1 );
		const sum = createDerivedAtom(
			( { get } ) => get( count1 ) + get( count2 )
		);
		const registry = createAtomRegistry();
		const listener = jest.fn();
		const unsubscribe = registry.subscribe( sum, listener );

		registry.set( count1, 2 );
		expect( listener ).toHaveBeenCalledTimes( 1 );

		registry.set( count2, 2 );
		expect( listener ).toHaveBeenCalledTimes( 2 );

		unsubscribe();
	} );
} );

describe( 'updating derived atoms', () => {
	it( 'should allow derived atoms to update dependencies', () => {
		const count1 = createAtom( 1 );
		const count2 = createAtom( 1 );
		const sum = createDerivedAtom(
			( { get } ) => get( count1 ) + get( count2 ),
			( { set }, value ) => {
				set( count1, value / 2 );
				set( count2, value / 2 );
			}
		);
		const registry = createAtomRegistry();
		registry.set( sum, 4 );
		expect( registry.get( count1 ) ).toEqual( 2 );
		expect( registry.get( count2 ) ).toEqual( 2 );
	} );

	it( 'should allow nested derived atoms to update dependencies', () => {
		const count1 = createAtom( 1 );
		const count2 = createAtom( 1 );
		const sum = createDerivedAtom(
			( { get } ) => get( count1 ) + get( count2 ),
			( { set }, value ) => {
				set( count1, value / 2 );
				set( count2, value / 2 );
			}
		);
		const multiply = createDerivedAtom(
			( { get } ) => get( sum ) * 3,
			( { set }, value ) => {
				set( sum, value / 3 );
			}
		);
		const registry = createAtomRegistry();
		registry.set( multiply, 18 );
		expect( registry.get( count1 ) ).toEqual( 3 );
		expect( registry.get( count2 ) ).toEqual( 3 );
	} );
} );
