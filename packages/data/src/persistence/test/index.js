/**
 * External dependencies
 */
import { pick } from 'lodash';

/**
 * Internal dependencies
 */
import {
	createPersistenceInterface,
	createPersistOnChange,
	setDefaults,
	withInitialState,
} from '../';
import objectStorage from '../storage/object';

describe( 'persistence', () => {
	beforeAll( () => {
		jest.spyOn( objectStorage, 'setItem' );
	} );

	beforeEach( () => {
		objectStorage.clear();
		objectStorage.setItem.mockClear();
	} );

	describe( 'createPersistOnChange', () => {
		it( 'should not persist when state matches initial', () => {
			// Caveat: State is compared by strict equality. This doesn't work for
			// object types in rehydrating from persistence, since:
			//   JSON.parse( {} ) !== JSON.parse( {} )
			// It's more important for runtime to check equal-ness, which is
			// expected to be reflected even for object types by reducer.
			const state = 1;
			const persistence = createPersistenceInterface( { storage: objectStorage, storageKey: 'FOO' } );

			objectStorage.setItem( 'WP_DATA', JSON.stringify( { test: state } ) );
			objectStorage.setItem.mockClear();

			const persist = createPersistOnChange( () => state, 'test', true, persistence );
			persist();

			expect( objectStorage.setItem ).not.toHaveBeenCalled();
		} );

		it( 'should persist when state changes', () => {
			const initialState = { value: 'initial' };
			const nextState = { value: 'next' };

			const persistence = createPersistenceInterface( { storage: objectStorage, storageKey: 'FOO' } );

			let state = initialState;
			function getState() {
				return state;
			}
			const persist = createPersistOnChange( getState, 'test', true, persistence );

			state = nextState;
			persist();

			expect( objectStorage.setItem ).toHaveBeenCalledTimes( 1 );
			expect( objectStorage.setItem ).toHaveBeenCalledWith( 'FOO', JSON.stringify( { test: nextState } ) );
		} );

		it( 'should persist a subset of keys', () => {
			const initialState = { persistValue: 'initial', nonPersistedValue: 'initial' };
			const nextState = { persistValue: 'next', nonPersistedValue: 'next' };

			const persistence = createPersistenceInterface( { storage: objectStorage, storageKey: 'FOO' } );

			let state = initialState;
			function getState() {
				return state;
			}
			const persist = createPersistOnChange( getState, 'test', [ 'persistValue' ], persistence );

			state = nextState;
			persist();

			const pickState = pick( nextState, [ 'persistValue' ] );
			expect( objectStorage.setItem ).toHaveBeenCalledTimes( 1 );
			expect( objectStorage.setItem ).toHaveBeenCalledWith( 'FOO', JSON.stringify( { test: pickState } ) );
		} );
	} );

	describe( 'createPersistenceInterface', () => {
		const storage = objectStorage;
		const storageKey = 'FOO';

		let get, set;
		beforeEach( () => {
			( { get, set } = createPersistenceInterface( { storage, storageKey } ) );
		} );

		describe( 'get', () => {
			it( 'returns an empty object if not set', () => {
				const data = get();

				expect( data ).toEqual( {} );
			} );

			it( 'returns the current value', () => {
				objectStorage.setItem( storageKey, '{"test":{}}' );
				const data = get();

				expect( data ).toEqual( { test: {} } );
			} );
		} );

		describe( 'set', () => {
			it( 'sets JSON by object', () => {
				set( 'test', {} );

				expect( objectStorage.setItem ).toHaveBeenCalledWith( storageKey, '{"test":{}}' );
			} );

			it( 'merges to existing', () => {
				set( 'test1', {} );
				set( 'test2', {} );

				expect( objectStorage.setItem ).toHaveBeenCalledWith( storageKey, '{"test1":{}}' );
				expect( objectStorage.setItem ).toHaveBeenCalledWith( storageKey, '{"test1":{},"test2":{}}' );
			} );
		} );
	} );

	describe( 'withInitialState', () => {
		it( 'should return a reducer function', () => {
			const reducer = ( state = 1 ) => state;
			const enhanced = withInitialState( reducer );

			expect( enhanced() ).toBe( 1 );
		} );

		it( 'should assign a default state by argument', () => {
			const reducer = ( state = 1 ) => state;
			const enhanced = withInitialState( reducer, 2 );

			expect( enhanced() ).toBe( 2 );
		} );
	} );

	describe( 'setDefaults', () => {
		it( 'sets default options for persistence', () => {
			const mockStorage = {
				getItem: jest.fn( ( key ) => ( key + '_VALUE' ) ),
				setItem: jest.fn(),
			};

			setDefaults( { storage: mockStorage, storageKey: 'testStorage' } );

			const persistence = createPersistenceInterface();

			persistence.get();
			expect( mockStorage.getItem ).toHaveBeenCalledTimes( 1 );
			expect( mockStorage.getItem ).toHaveBeenCalledWith( 'testStorage' );

			persistence.set( 'myKey', 'myValue' );
			expect( mockStorage.setItem ).toHaveBeenCalledTimes( 1 );
			expect( mockStorage.setItem ).toHaveBeenCalledWith(
				'testStorage',
				JSON.stringify( { myKey: 'myValue' } )
			);
		} );
	} );
} );
