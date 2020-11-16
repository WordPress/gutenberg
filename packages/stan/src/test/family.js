/**
 * Internal dependencies
 */
import { createAtomRegistry, createAtom, createAtomFamily } from '../';

describe( 'creating and subscribing to atom families', () => {
	it( 'should allow adding and removing items to families', () => {
		const itemsByIdAtom = createAtom( {} );
		const itemFamilyAtom = createAtomFamily( ( key ) => ( { get } ) =>
			get( itemsByIdAtom )[ key ]
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
		const unsubscribe = registry.subscribe( itemFamilyAtom( 1 ), () => {} );
		expect( firstItemAtom.get() ).toBe( undefined );

		// Add some items
		registry.set( itemsByIdAtom, {
			1: { name: 'first' },
			2: { name: 'second' },
		} );

		// Should update the value automatically as we set the items.
		expect( registry.get( itemFamilyAtom( 1 ) ) ).toEqual( {
			name: 'first',
		} );

		// Remove items
		registry.set( itemsByIdAtom, {
			2: { name: 'second' },
		} );

		// Should update the value automatically as we unset the items.
		expect( registry.get( itemFamilyAtom( 1 ) ) ).toBe( undefined );
		unsubscribe();
	} );

	it( 'should allow creating families based on other families', () => {
		const itemsByIdAtom = createAtom( {}, 'items-by-id' );
		const itemFamilyAtom = createAtomFamily( ( key ) => ( { get } ) => {
			return get( itemsByIdAtom )[ key ];
		} );
		// Family atom that depends on another family atom.
		const itemNameFamilyAtom = createAtomFamily( ( key ) => ( { get } ) => {
			return get( itemFamilyAtom( key ) )?.name;
		} );

		const registry = createAtomRegistry();
		registry.set( itemsByIdAtom, {
			1: { name: 'first' },
			2: { name: 'second' },
		} );

		// Atoms don't compute any value unless there's a subscriber.
		const unsubscribe = registry.subscribe(
			itemNameFamilyAtom( 1 ),
			() => {}
		);
		expect( registry.get( itemNameFamilyAtom( 1 ) ) ).toEqual( 'first' );
		unsubscribe();
	} );

	it( 'should not recompute a family dependency if its untouched', () => {
		const itemsByIdAtom = createAtom( {}, 'items-by-id' );
		const itemFamilyAtom = createAtomFamily( ( key ) => ( { get } ) => {
			return get( itemsByIdAtom )[ key ];
		} );
		// Family atom that depends on another family atom.
		const itemNameFamilyAtom = createAtomFamily( ( key ) => ( { get } ) => {
			return get( itemFamilyAtom( key ) )?.name;
		} );

		const registry = createAtomRegistry();
		const initialItems = {
			1: { name: 'first' },
			2: { name: 'second' },
		};
		registry.set( itemsByIdAtom, initialItems );

		const name1Listener = jest.fn();
		const name2Listener = jest.fn();

		const name1 = itemNameFamilyAtom( 1 );
		const name2 = itemNameFamilyAtom( 2 );

		const unsubscribe = registry.subscribe( name1, name1Listener );
		const unsubscribe2 = registry.subscribe( name2, name2Listener );

		// If I update item 1, item 2 dedendencies shouldn't recompute.
		registry.set( itemsByIdAtom, {
			...initialItems,
			1: { name: 'updated first' },
		} );

		expect( registry.get( name1 ) ).toEqual( 'updated first' );
		expect( registry.get( name2 ) ).toEqual( 'second' );
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
			( key ) => ( { get } ) => get( itemsByIdAtom )[ key ],
			( key ) => ( { get, set }, value ) => {
				set( itemsByIdAtom, {
					...get( itemsByIdAtom ),
					[ key ]: value,
				} );
			}
		);
		const registry = createAtomRegistry();
		registry.set( itemFamilyAtom( 1 ), { name: 'first' } );
		expect( registry.get( itemsByIdAtom ) ).toEqual( {
			1: { name: 'first' },
		} );
	} );

	it( 'should allow updating nested family atoms', () => {
		const itemsByIdAtom = createAtom( {} );
		const itemFamilyAtom = createAtomFamily(
			( key ) => ( { get } ) => get( itemsByIdAtom )[ key ],
			( key ) => ( { get, set }, value ) => {
				set( itemsByIdAtom, {
					...get( itemsByIdAtom ),
					[ key ]: value,
				} );
			}
		);
		const itemNameFamilyAtom = createAtomFamily(
			( key ) => ( { get } ) => get( itemFamilyAtom( key ) ).name,
			( key ) => ( { get, set }, value ) => {
				set( itemFamilyAtom( key ), {
					...get( itemFamilyAtom( key ) ),
					name: value,
				} );
			}
		);
		const registry = createAtomRegistry();
		registry.set( itemNameFamilyAtom( 1 ), 'first' );
		expect( registry.get( itemsByIdAtom ) ).toEqual( {
			1: { name: 'first' },
		} );
	} );
} );
