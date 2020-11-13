/**
 * Internal dependencies
 */
import { createAtomRegistry, createAtom, createAtomFamily } from '../';

describe( 'creating and subscribing to atom families', () => {
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

describe( 'updating family atoms', () => {
	it( 'should allow family atoms to update dependencies', () => {
		const itemsByIdAtom = createAtom( {} );
		const itemFamilyAtom = createAtomFamily(
			( key ) => ( get ) => get( itemsByIdAtom )[ key ],
			( key ) => ( get, set, value ) => {
				set( itemsByIdAtom, {
					...get( itemsByIdAtom ),
					[ key ]: value,
				} );
			}
		);
		const registry = createAtomRegistry();
		const firstItemInstance = registry.getAtom( itemFamilyAtom( 1 ) );
		firstItemInstance.set( { name: 'first' } );
		expect( registry.getAtom( itemsByIdAtom ).get() ).toEqual( {
			1: { name: 'first' },
		} );
	} );

	it( 'should allow updating nested family atoms', () => {
		const itemsByIdAtom = createAtom( {} );
		const itemFamilyAtom = createAtomFamily(
			( key ) => ( get ) => get( itemsByIdAtom )[ key ],
			( key ) => ( get, set, value ) => {
				set( itemsByIdAtom, {
					...get( itemsByIdAtom ),
					[ key ]: value,
				} );
			}
		);
		const itemNameFamilyAtom = createAtomFamily(
			( key ) => ( get ) => get( itemFamilyAtom( key ) ).name,
			( key ) => ( get, set, value ) => {
				set( itemFamilyAtom( key ), {
					...get( itemFamilyAtom( key ) ),
					name: value,
				} );
			}
		);
		const registry = createAtomRegistry();
		const firstItemInstance = registry.getAtom( itemNameFamilyAtom( 1 ) );
		firstItemInstance.set( 'first' );
		expect( registry.getAtom( itemsByIdAtom ).get() ).toEqual( {
			1: { name: 'first' },
		} );
	} );
} );
