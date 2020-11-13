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
			( get ) => get( count1 ) + get( count2 ) + get( count3 )
		);
		const registry = createAtomRegistry();
		const sumInstance = registry.getAtom( sum );

		// Atoms don't compute any value unless there's a subscriber.
		const unsubscribe = sumInstance.subscribe( () => {} );
		expect( sumInstance.get() ).toEqual( 3 );
		registry.getAtom( count1 ).set( 2 );
		expect( sumInstance.get() ).toEqual( 4 );
		unsubscribe();
	} );

	it( 'should allow async derived atoms', async () => {
		const count1 = createAtom( 1 );
		const sum = createDerivedAtom( async ( get ) => {
			const value = await Promise.resolve( 10 );
			return get( count1 ) + value;
		} );
		const registry = createAtomRegistry();
		const sumInstance = registry.getAtom( sum );
		// Atoms don't compute any value unless there's a subscriber.
		const unsubscribe = sumInstance.subscribe( () => {} );
		await flushImmediatesAndTicks();
		expect( sumInstance.get() ).toEqual( 11 );
		unsubscribe();
	} );

	it( 'should allow nesting derived atoms', async () => {
		const count1 = createAtom( 1 );
		const count2 = createAtom( 10 );
		const asyncCount = createDerivedAtom( async ( get ) => {
			return ( await get( count2 ) ) * 2;
		} );
		const sum = createDerivedAtom( async ( get ) => {
			return get( count1 ) + get( asyncCount );
		} );
		const registry = createAtomRegistry();
		const sumInstance = registry.getAtom( sum );
		// Atoms don't compute any value unless there's a subscriber.
		const unsubscribe = sumInstance.subscribe( () => {} );
		await flushImmediatesAndTicks( 2 );
		expect( sumInstance.get() ).toEqual( 21 );
		unsubscribe();
	} );

	it( 'should only compute derived atoms when they have subscribers be lazy', () => {
		const count1 = createAtom( 1 );
		const count2 = createAtom( 1 );
		const sum = createDerivedAtom(
			( get ) => get( count1 ) + get( count2 )
		);
		const registry = createAtomRegistry();
		const sumInstance = registry.getAtom( sum );
		expect( sumInstance.get() ).toEqual( null );
		const unsubscribe = sumInstance.subscribe( () => {} );
		expect( sumInstance.get() ).toEqual( 2 );
		unsubscribe();
		// This shouldn't recompute the derived atom because it doesn't have any subscriber.
		registry.getAtom( count1 ).set( 2 );
		expect( sumInstance.get() ).toEqual( 2 );
	} );

	it( 'should notify subscribers on change', () => {
		const count1 = createAtom( 1 );
		const count2 = createAtom( 1 );
		const sum = createDerivedAtom(
			( get ) => get( count1 ) + get( count2 )
		);
		const registry = createAtomRegistry();
		const sumInstance = registry.getAtom( sum );
		const listener = jest.fn();
		const unsubscribe = sumInstance.subscribe( listener );

		registry.getAtom( count1 ).set( 2 );
		expect( listener ).toHaveBeenCalledTimes( 1 );

		registry.getAtom( count2 ).set( 2 );
		expect( listener ).toHaveBeenCalledTimes( 2 );

		unsubscribe();
	} );
} );

describe( 'updating derived atoms', () => {
	it( 'should allow derived atoms to update dependencies', () => {
		const count1 = createAtom( 1 );
		const count2 = createAtom( 1 );
		const sum = createDerivedAtom(
			( get ) => get( count1 ) + get( count2 ),
			( get, set, value ) => {
				set( count1, value / 2 );
				set( count2, value / 2 );
			}
		);
		const registry = createAtomRegistry();
		const sumInstance = registry.getAtom( sum );
		sumInstance.set( 4 );
		expect( registry.getAtom( count1 ).get() ).toEqual( 2 );
		expect( registry.getAtom( count2 ).get() ).toEqual( 2 );
	} );

	it( 'should allow nested derived atoms to update dependencies', () => {
		const count1 = createAtom( 1 );
		const count2 = createAtom( 1 );
		const sum = createDerivedAtom(
			( get ) => get( count1 ) + get( count2 ),
			( get, set, value ) => {
				set( count1, value / 2 );
				set( count2, value / 2 );
			}
		);
		const multiply = createDerivedAtom(
			( get ) => get( sum ) * 3,
			( get, set, value ) => {
				set( sum, value / 3 );
			}
		);
		const registry = createAtomRegistry();
		const multiplyInstance = registry.getAtom( multiply );
		multiplyInstance.set( 18 );
		expect( registry.getAtom( count1 ).get() ).toEqual( 3 );
		expect( registry.getAtom( count2 ).get() ).toEqual( 3 );
	} );
} );
