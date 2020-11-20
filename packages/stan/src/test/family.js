/**
 * Internal dependencies
 */
import { createAtomRegistry, createAtom, createAtomFamily } from '../';

describe( 'creating and subscribing to atom families', () => {
	it( 'should allow adding and removing items to families', async () => {
		const itemsByIdAtom = createAtom( {} );
		const itemFamilyAtom = createAtomFamily( ( key ) => async ( { get } ) =>
			( await get( itemsByIdAtom ) )[ key ]
		);

		const registry = createAtomRegistry();
		// Retrieve family atom
		const firstItemAtom = registry.__unstableGetAtomState(
			itemFamilyAtom( 1 )
		);
		expect( firstItemAtom ).toBe(
			registry.__unstableGetAtomState( itemFamilyAtom( 1 ) )
		);
		// Atoms don't compute any value unless there's a subscriber.
		const unsubscribe = await registry.subscribe(
			itemFamilyAtom( 1 ),
			() => {}
		);
		expect( await firstItemAtom.get() ).toBe( undefined );

		// Add some items
		await registry.set( itemsByIdAtom, {
			1: { name: 'first' },
			2: { name: 'second' },
		} );

		// Should update the value automatically as we set the items.
		expect( await registry.get( itemFamilyAtom( 1 ) ) ).toEqual( {
			name: 'first',
		} );

		// Remove items
		await registry.set( itemsByIdAtom, {
			2: { name: 'second' },
		} );

		// Should update the value automatically as we unset the items.
		expect( await registry.get( itemFamilyAtom( 1 ) ) ).toBe( undefined );
		unsubscribe();
	} );

	it( 'should allow creating families based on other families', async () => {
		const itemsByIdAtom = createAtom( {} );
		const itemFamilyAtom = createAtomFamily(
			( key ) => async ( { get } ) => {
				return ( await get( itemsByIdAtom ) )[ key ];
			}
		);
		// Family atom that depends on another family atom.
		const itemNameFamilyAtom = createAtomFamily(
			( key ) => async ( { get } ) => {
				return ( await get( itemFamilyAtom( key ) ) )?.name;
			}
		);

		const registry = createAtomRegistry();
		await registry.set( itemsByIdAtom, {
			1: { name: 'first' },
			2: { name: 'second' },
		} );

		// Atoms don't compute any value unless there's a subscriber.
		const unsubscribe = await registry.subscribe(
			itemNameFamilyAtom( 1 ),
			() => {}
		);
		expect( await registry.get( itemNameFamilyAtom( 1 ) ) ).toEqual(
			'first'
		);
		unsubscribe();
	} );

	it( 'should not recompute a family dependency if its untouched', async () => {
		const itemsByIdAtom = createAtom( {} );
		const itemFamilyAtom = createAtomFamily(
			( key ) => async ( { get } ) => {
				return ( await get( itemsByIdAtom ) )[ key ];
			}
		);
		// Family atom that depends on another family atom.
		const itemNameFamilyAtom = createAtomFamily(
			( key ) => async ( { get } ) => {
				return ( await get( itemFamilyAtom( key ) ) )?.name;
			}
		);

		const registry = createAtomRegistry();
		const initialItems = {
			1: { name: 'first' },
			2: { name: 'second' },
		};
		await registry.set( itemsByIdAtom, initialItems );

		const name1Listener = jest.fn();
		const name2Listener = jest.fn();

		const name1 = itemNameFamilyAtom( 1 );
		const name2 = itemNameFamilyAtom( 2 );

		const unsubscribe = await registry.subscribe( name1, name1Listener );
		const unsubscribe2 = await registry.subscribe( name2, name2Listener );

		// If I update item 1, item 2 dedendencies shouldn't recompute.
		await registry.set( itemsByIdAtom, {
			...initialItems,
			1: { name: 'updated first' },
		} );

		expect( await registry.get( name1 ) ).toEqual( 'updated first' );
		expect( await registry.get( name2 ) ).toEqual( 'second' );
		expect( name1Listener ).toHaveBeenCalledTimes( 1 );
		expect( name2Listener ).not.toHaveBeenCalled();

		unsubscribe();
		unsubscribe2();
	} );
} );

describe( 'updating family atoms', () => {
	it( 'should allow family atoms to update dependencies', async () => {
		const itemsByIdAtom = createAtom( {} );
		const itemFamilyAtom = createAtomFamily(
			( key ) => async ( { get } ) =>
				( await get( itemsByIdAtom ) )[ key ],
			( key ) => async ( { get, set }, value ) =>
				set( itemsByIdAtom, {
					...( await get( itemsByIdAtom ) ),
					[ key ]: value,
				} )
		);
		const registry = createAtomRegistry();
		await registry.set( itemFamilyAtom( 1 ), { name: 'first' } );
		expect( await registry.get( itemsByIdAtom ) ).toEqual( {
			1: { name: 'first' },
		} );
	} );

	it( 'should allow updating nested family atoms', async () => {
		const itemsByIdAtom = createAtom( {} );
		const itemFamilyAtom = createAtomFamily(
			( key ) => async ( { get } ) =>
				( await get( itemsByIdAtom ) )[ key ],
			( key ) => async ( { get, set }, value ) =>
				set( itemsByIdAtom, {
					...( await get( itemsByIdAtom ) ),
					[ key ]: value,
				} )
		);
		const itemNameFamilyAtom = createAtomFamily(
			( key ) => async ( { get } ) =>
				( await get( itemsByIdAtom ) )[ key ],
			( key ) => async ( { get, set }, value ) =>
				set( itemFamilyAtom( key ), {
					...( await get( itemsByIdAtom )[ key ] ),
					name: value,
				} )
		);
		const registry = createAtomRegistry();
		await registry.set( itemNameFamilyAtom( 1 ), 'first' );
		expect( await registry.get( itemsByIdAtom ) ).toEqual( {
			1: { name: 'first' },
		} );
	} );
} );
