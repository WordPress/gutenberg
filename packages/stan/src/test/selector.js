/**
 * Internal dependencies
 */
import { createAtomRegistry, createAtom, createAtomSelector } from '../';

describe( 'creating and subscribing to atom selectoors', () => {
	it( 'should allow adding and removing items into/from selectors', () => {
		const itemsByIdAtom = createAtom( {} );
		const itemSelector = createAtomSelector( ( key ) => ( { get } ) =>
			get( itemsByIdAtom )[ key ]
		);

		const registry = createAtomRegistry();
		// Retrieve atom selector
		const firstItem = registry.__unstableGetAtomState( itemSelector( 1 ) );
		expect( firstItem ).toBe(
			registry.__unstableGetAtomState( itemSelector( 1 ) )
		);
		// Atoms don't compute any value unless there's a subscriber.
		const unsubscribe = registry.subscribe( itemSelector( 1 ), () => {} );
		expect( firstItem.get() ).toBe( undefined );

		// Add some items
		registry.set( itemsByIdAtom, {
			1: { name: 'first' },
			2: { name: 'second' },
		} );

		// Should update the value automatically as we set the items.
		expect( registry.get( itemSelector( 1 ) ) ).toEqual( {
			name: 'first',
		} );

		// Remove items
		registry.set( itemsByIdAtom, {
			2: { name: 'second' },
		} );

		// Should update the value automatically as we unset the items.
		expect( registry.get( itemSelector( 1 ) ) ).toBe( undefined );
		unsubscribe();
	} );

	it( 'should allow creating selectors based on other selectors', () => {
		const itemsByIdAtom = createAtom( {} );
		const itemSelector = createAtomSelector( ( key ) => ( { get } ) => {
			return get( itemsByIdAtom )[ key ];
		} );
		// Atom selector that depends on another atom selector.
		const itemNameSelector = createAtomSelector( ( key ) => ( { get } ) => {
			return get( itemSelector( key ) )?.name;
		} );

		const registry = createAtomRegistry();
		registry.set( itemsByIdAtom, {
			1: { name: 'first' },
			2: { name: 'second' },
		} );

		// Atoms don't compute any value unless there's a subscriber.
		const unsubscribe = registry.subscribe(
			itemNameSelector( 1 ),
			() => {}
		);
		expect( registry.get( itemNameSelector( 1 ) ) ).toEqual( 'first' );
		unsubscribe();
	} );

	it( 'should allow creating multi argument atom selectors', () => {
		const itemsByIdAtom = createAtom( {} );
		const itemPropertySelector = createAtomSelector(
			( key, property ) => ( { get } ) => {
				return get( itemsByIdAtom )[ key ][ property ];
			}
		);

		const registry = createAtomRegistry();
		registry.set( itemsByIdAtom, {
			1: { name: 'first' },
			2: { name: 'second' },
		} );

		// Retrieve atom selector
		const firstItemName = registry.__unstableGetAtomState(
			itemPropertySelector( 1, 'name' )
		);
		expect( firstItemName ).toBe(
			registry.__unstableGetAtomState( itemPropertySelector( 1, 'name' ) )
		);

		// Atoms don't compute any value unless there's a subscriber.
		const unsubscribe = registry.subscribe(
			itemPropertySelector( 1, 'name' ),
			() => {}
		);
		expect( registry.get( itemPropertySelector( 1, 'name' ) ) ).toEqual(
			'first'
		);
		registry.set( itemsByIdAtom, {
			1: { name: 'first modified' },
			2: { name: 'second' },
		} );
		expect( registry.get( itemPropertySelector( 1, 'name' ) ) ).toEqual(
			'first modified'
		);
		unsubscribe();
	} );

	it( 'should not recompute a selector dependency if its untouched', () => {
		const itemsByIdAtom = createAtom( {} );
		const itemSelector = createAtomSelector( ( key ) => ( { get } ) => {
			return get( itemsByIdAtom )[ key ];
		} );
		const itemNameSelector = createAtomSelector( ( key ) => ( { get } ) => {
			return get( itemSelector( key ) )?.name;
		} );

		const registry = createAtomRegistry();
		const initialItems = {
			1: { name: 'first' },
			2: { name: 'second' },
		};
		registry.set( itemsByIdAtom, initialItems );

		const name1Listener = jest.fn();
		const name2Listener = jest.fn();

		const name1 = itemNameSelector( 1 );
		const name2 = itemNameSelector( 2 );

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

describe( 'updating atom selectors', () => {
	it( 'should allow atom selectors to update dependencies', () => {
		const itemsByIdAtom = createAtom( {} );
		const itemSelector = createAtomSelector(
			( key ) => ( { get } ) => get( itemsByIdAtom )[ key ],
			( key ) => ( { get, set }, value ) => {
				set( itemsByIdAtom, {
					...get( itemsByIdAtom ),
					[ key ]: value,
				} );
			}
		);
		const registry = createAtomRegistry();
		registry.set( itemSelector( 1 ), { name: 'first' } );
		expect( registry.get( itemsByIdAtom ) ).toEqual( {
			1: { name: 'first' },
		} );
	} );

	it( 'should allow updating nested atom selectors', () => {
		const itemsByIdAtom = createAtom( {} );
		const itemSelector = createAtomSelector(
			( key ) => ( { get } ) => get( itemsByIdAtom )[ key ],
			( key ) => ( { get, set }, value ) => {
				set( itemsByIdAtom, {
					...get( itemsByIdAtom ),
					[ key ]: value,
				} );
			}
		);
		const itemNameSelector = createAtomSelector(
			( key ) => ( { get } ) => get( itemSelector( key ) ).name,
			( key ) => ( { get, set }, value ) => {
				set( itemSelector( key ), {
					...get( itemSelector( key ) ),
					name: value,
				} );
			}
		);
		const registry = createAtomRegistry();
		registry.set( itemNameSelector( 1 ), 'first' );
		expect( registry.get( itemsByIdAtom ) ).toEqual( {
			1: { name: 'first' },
		} );
	} );
} );
