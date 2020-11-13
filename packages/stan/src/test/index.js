/**
 * Internal dependencies
 */
/**
 * External dependencies
 */
import {
	createAtomRegistry,
	createAtom,
	createDerivedAtom,
	createAtomFamily,
} from '../';

async function flushImmediatesAndTicks( count = 1 ) {
	for ( let i = 0; i < count; i++ ) {
		await jest.runAllTicks();
		await jest.runAllImmediates();
	}
}

describe( 'creating atoms and derived atoms', () => {
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
		expect( sumInstance.get() ).toEqual( 3 );
		registry.getAtom( count1 ).set( 2 );
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

describe( 'creating and updating atom families', () => {
	it( 'should allow adding and removing items to families', () => {
		const itemsByIdAtom = createAtom( {} );
		const itemFamilyAtom = createAtomFamily( ( key ) => ( get ) =>
			get( itemsByIdAtom )[ key ]
		);

		const registry = createAtomRegistry();
		// Retrieve family atom
		const firstItemAtom = registry.getAtom( itemFamilyAtom( 1 ) );
		expect( firstItemAtom ).toBe( registry.getAtom( itemFamilyAtom( 1 ) ) );
		// Atoms don't compute any value unless there's a subscriber.
		const unsubscribe = firstItemAtom.subscribe( () => {} );
		expect( firstItemAtom.get() ).toBe( undefined );

		// Add some items
		const itemsByIdAtomInstance = registry.getAtom( itemsByIdAtom );
		itemsByIdAtomInstance.set( {
			1: { name: 'first' },
			2: { name: 'second' },
		} );

		// Should update the value automatically as we set the items.
		expect( firstItemAtom.get() ).toEqual( { name: 'first' } );

		// Remove items
		itemsByIdAtomInstance.set( {
			2: { name: 'second' },
		} );

		// Should update the value automatically as we unset the items.
		expect( firstItemAtom.get() ).toBe( undefined );
		unsubscribe();
	} );

	it( 'should allow creating families based on other families', () => {
		const itemsByIdAtom = createAtom( {}, 'items-by-id' );
		const itemFamilyAtom = createAtomFamily(
			( key ) => ( get ) => {
				return get( itemsByIdAtom )[ key ];
			},
			undefined,
			false,
			'atom'
		);
		// Family atom that depends on another family atom.
		const itemNameFamilyAtom = createAtomFamily(
			( key ) => ( get ) => {
				return get( itemFamilyAtom( key ) )?.name;
			},
			undefined,
			false,
			'atomname'
		);

		const registry = createAtomRegistry();
		const itemsByIdAtomInstance = registry.getAtom( itemsByIdAtom );
		itemsByIdAtomInstance.set( {
			1: { name: 'first' },
			2: { name: 'second' },
		} );

		const firstItemNameAtom = registry.getAtom( itemNameFamilyAtom( 1 ) );
		expect( firstItemNameAtom ).toBe(
			registry.getAtom( itemNameFamilyAtom( 1 ) )
		);
		// Atoms don't compute any value unless there's a subscriber.
		const unsubscribe = firstItemNameAtom.subscribe( () => {} );
		expect( firstItemNameAtom.get() ).toEqual( 'first' );
		unsubscribe();
	} );

	it( 'should not recompute a family dependency if its untouched', () => {
		const itemsByIdAtom = createAtom( {}, 'items-by-id' );
		const itemFamilyAtom = createAtomFamily(
			( key ) => ( get ) => {
				return get( itemsByIdAtom )[ key ];
			},
			undefined,
			false,
			'atom'
		);
		// Family atom that depends on another family atom.
		const itemNameFamilyAtom = createAtomFamily(
			( key ) => ( get ) => {
				return get( itemFamilyAtom( key ) )?.name;
			},
			undefined,
			false,
			'atomname'
		);

		const registry = createAtomRegistry();
		const itemsByIdAtomInstance = registry.getAtom( itemsByIdAtom );
		const initialItems = {
			1: { name: 'first' },
			2: { name: 'second' },
		};
		itemsByIdAtomInstance.set( initialItems );

		const name1Listener = jest.fn();
		const name2Listener = jest.fn();

		const name1 = registry.getAtom( itemNameFamilyAtom( 1 ) );
		const name2 = registry.getAtom( itemNameFamilyAtom( 2 ) );

		const unsubscribe = name1.subscribe( name1Listener );
		const unsubscribe2 = name2.subscribe( name2Listener );

		// If I update item 1, item 2 dedendencies shouldn't recompute.
		itemsByIdAtomInstance.set( {
			...initialItems,
			1: { name: 'updated first' },
		} );

		expect( name1.get() ).toEqual( 'updated first' );
		expect( name2.get() ).toEqual( 'second' );
		expect( name1Listener ).toHaveBeenCalledTimes( 1 );
		expect( name2Listener ).not.toHaveBeenCalled();

		unsubscribe();
		unsubscribe2();
	} );
} );
