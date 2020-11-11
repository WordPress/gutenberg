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

describe( 'createAtom', () => {
	it( 'should allow getting and setting atom values', () => {
		const atomCreator = createAtom( 1 );
		const registry = createAtomRegistry();
		const count = registry.getAtom( atomCreator );
		expect( count.get() ).toEqual( 1 );
		count.set( 2 );
		expect( count.get() ).toEqual( 2 );
	} );

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
		await flushImmediatesAndTicks();
		expect( sumInstance.get() ).toEqual( 3 );
		registry.getAtom( count1 ).set( 2 );
		await flushImmediatesAndTicks();
		expect( sumInstance.get() ).toEqual( 4 );
		unsubscribe();
	} );

	it( 'should allow async derived data', async () => {
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

	it( 'should allow nesting derived data', async () => {
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
} );
