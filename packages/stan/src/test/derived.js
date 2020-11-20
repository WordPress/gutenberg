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

jest.useFakeTimers();

describe( 'creating derived atoms', () => {
	it( 'should allow creating derived atom', async () => {
		const count1 = createAtom( 1 );
		const count2 = createAtom( 1 );
		const count3 = createAtom( 1 );
		const sum = createDerivedAtom(
			async ( { get } ) =>
				( await get( count1 ) ) +
				( await get( count2 ) ) +
				( await get( count3 ) )
		);
		const registry = createAtomRegistry();

		// Atoms don't compute any value unless there's a subscriber.
		const unsubscribe = await registry.subscribe( sum, () => {} );
		expect( await registry.get( sum ) ).toEqual( 3 );
		await registry.set( count1, 2 );
		expect( await registry.get( sum ) ).toEqual( 4 );
		unsubscribe();
	} );

	it( 'should allow async derived atoms', async () => {
		const count1 = createAtom( 1 );
		const sum = createDerivedAtom( async ( { get } ) => {
			const value = await Promise.resolve( 10 );
			return ( await get( count1 ) ) + value;
		} );
		const registry = createAtomRegistry();
		// Atoms don't compute any value unless there's a subscriber.
		const unsubscribe = await registry.subscribe( sum, () => {} );
		expect( await registry.get( sum ) ).toEqual( 11 );
		unsubscribe();
	} );

	it( 'should allow parallel async atoms', async () => {
		const count1 = createDerivedAtom( async () => {
			await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) );
			return 10;
		} );
		const count2 = createDerivedAtom( async () => {
			await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) );
			return 10;
		} );
		const sum = createDerivedAtom( async ( { get } ) => {
			const [ c1, c2 ] = await Promise.all( [
				get( count1 ),
				get( count2 ),
			] );
			return c1 + c2;
		} );
		const registry = createAtomRegistry();
		// Atoms don't compute any value unless there's a subscriber.
		const unsubscribePromise = registry.subscribe( sum, () => {} );
		await jest.advanceTimersByTime( 1000 );
		await flushImmediatesAndTicks();
		const unsubscribe = await unsubscribePromise;
		expect( await registry.get( sum ) ).toEqual( 20 );
		unsubscribe();
	} );

	it( 'should allow nesting derived atoms', async () => {
		const count1 = createAtom( 1 );
		const count2 = createAtom( 10 );
		const asyncCount = createDerivedAtom( async ( { get } ) => {
			return ( await get( count2 ) ) * 2;
		} );
		const sum = createDerivedAtom( async ( { get } ) => {
			return ( await get( count1 ) ) + ( await get( asyncCount ) );
		} );
		const registry = createAtomRegistry();
		// Atoms don't compute any value unless there's a subscriber.
		const unsubscribe = await registry.subscribe( sum, () => {} );
		expect( await registry.get( sum ) ).toEqual( 21 );
		unsubscribe();
	} );

	it( 'should only compute derived atoms when they have subscribers or when you try to retrieve their value', async () => {
		const mock = jest.fn();
		mock.mockImplementation( () => 10 );
		const count1 = createAtom( 1 );
		const count2 = createAtom( 1 );
		const sum = createDerivedAtom(
			async ( { get } ) =>
				( await get( count1 ) ) + ( await get( count2 ) ) + mock()
		);
		const registry = createAtomRegistry();
		// Creating an atom or adding it to the registry don't trigger its resolution
		expect( mock ).not.toHaveBeenCalled();
		expect( await registry.get( sum ) ).toEqual( 12 );
		// Calling "get" triggers a resolution.
		expect( mock ).toHaveBeenCalledTimes( 1 );

		// This shouldn't trigger the resolution because the atom has no listener.
		await registry.set( count1, 2 );
		expect( mock ).toHaveBeenCalledTimes( 1 );

		// Subscribing triggers the resolution again.
		const unsubscribe = await registry.subscribe( sum, () => {} );
		expect( mock ).toHaveBeenCalledTimes( 2 );
		expect( await registry.get( sum ) ).toEqual( 13 );
		unsubscribe();
	} );

	it( 'should notify subscribers on change', async () => {
		const count1 = createAtom( 1 );
		const count2 = createAtom( 1 );
		const sum = createDerivedAtom(
			async ( { get } ) =>
				( await get( count1 ) ) + ( await get( count2 ) )
		);
		const registry = createAtomRegistry();
		const listener = jest.fn();
		const unsubscribe = await registry.subscribe( sum, listener );

		await registry.set( count1, 2 );
		expect( listener ).toHaveBeenCalledTimes( 1 );

		await registry.set( count2, 2 );
		expect( listener ).toHaveBeenCalledTimes( 2 );

		unsubscribe();
	} );
} );

describe( 'error handling in derived atoms', () => {
	it( 'should not suppress resolution errors in get (async)', () => {
		const asyncCount = createDerivedAtom( () =>
			Promise.reject( 'test123' )
		);
		const sum = createDerivedAtom( async ( { get } ) => {
			return get( asyncCount );
		} );
		const registry = createAtomRegistry();
		expect( registry.get( sum ) ).rejects.toThrow( 'test123' );
	} );

	it( 'should not suppress resolution errors in subscribe (async)', () => {
		const asyncCount = createDerivedAtom( () =>
			Promise.reject( 'test123' )
		);
		const sum = createDerivedAtom( async ( { get } ) => {
			return get( asyncCount );
		} );
		const registry = createAtomRegistry();
		expect( registry.subscribe( sum, () => {} ) ).rejects.toThrow(
			'test123'
		);
	} );

	it( 'should not suppress resolution errors in get', () => {
		const count = createDerivedAtom( () => {
			throw new Error( 'test123' );
		} );
		const sum = createDerivedAtom( async ( { get } ) => {
			return await get( count );
		} );
		const registry = createAtomRegistry();
		expect( registry.subscribe( sum, () => {} ) ).rejects.toThrow(
			'test123'
		);
	} );

	it( 'should not suppress resolution errors in subscribe', () => {
		const count = createDerivedAtom( () => {
			throw new Error( 'test123' );
		} );
		const sum = createDerivedAtom( async ( { get } ) => {
			return await get( count );
		} );
		const registry = createAtomRegistry();
		expect( registry.subscribe( sum, () => {} ) ).rejects.toThrow(
			'test123'
		);
	} );
} );

describe( 'updating derived atoms', () => {
	it( 'should allow derived atoms to update dependencies', async () => {
		const count1 = createAtom( 1 );
		const count2 = createAtom( 1 );
		const sum = createDerivedAtom(
			async ( { get } ) =>
				( await get( count1 ) ) + ( await get( count2 ) ),
			async ( { set }, value ) => {
				await set( count1, value / 2 );
				await set( count2, value / 2 );
			}
		);
		const registry = createAtomRegistry();
		await registry.set( sum, 4 );
		expect( await registry.get( count1 ) ).toEqual( 2 );
		expect( await registry.get( count2 ) ).toEqual( 2 );
	} );

	it( 'should allow nested derived atoms to update dependencies', async () => {
		const count1 = createAtom( 1 );
		const count2 = createAtom( 1 );
		const sum = createDerivedAtom(
			async ( { get } ) =>
				( await get( count1 ) ) + ( await get( count2 ) ),
			async ( { set }, value ) => {
				await set( count1, value / 2 );
				await set( count2, value / 2 );
			}
		);
		const multiply = createDerivedAtom(
			async ( { get } ) => ( await get( sum ) ) * 3,
			async ( { set }, value ) => {
				await set( sum, value / 3 );
			}
		);
		const registry = createAtomRegistry();
		await registry.set( multiply, 18 );
		expect( await registry.get( count1 ) ).toEqual( 3 );
		expect( await registry.get( count2 ) ).toEqual( 3 );
	} );
} );
