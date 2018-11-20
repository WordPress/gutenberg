/**
 * External dependencies
 */
import { pick } from 'lodash';

/**
 * Internal dependencies
 */
import createNamespace from '../namespace-store';
import { createRegistry } from '../registry';
import objectStorage from '../persistence/storage/object';

describe( 'createNamespace', () => {
	let registry;

	beforeAll( () => {
		jest.spyOn( objectStorage, 'getItem' );
		jest.spyOn( objectStorage, 'setItem' );
	} );

	beforeEach( () => {
		objectStorage.clear();
		objectStorage.getItem.mockClear();
		objectStorage.setItem.mockClear();

		registry = createRegistry();
	} );

	it( 'should not mutate options', () => {
		const options = Object.freeze( { persist: true, reducer() {} } );

		createNamespace( 'test', options, registry );
	} );

	it( 'overrides values passed to registerStore', () => {
		const options = { persist: true, reducer() {} };

		const namespace = createNamespace( 'test', options, registry );

		expect( namespace.reducer ).not.toBe( options.reducer );
	} );

	it( 'should not persist if option not passed', () => {
		const options = {
			reducer: ( state ) => state,
			selectors: {},
			persistenceOptions: {
				storage: objectStorage,
				storageKey: 'FOO',
			},
		};
		createNamespace( 'test', options, registry );

		expect( objectStorage.getItem ).not.toHaveBeenCalled();
	} );

	it( 'loads initial state from persistence', () => {
		const options = {
			reducer: ( state ) => state,
			selectors: {},
			persist: true,
			persistenceOptions: {
				storage: objectStorage,
				storageKey: 'FOO',
			},
		};
		createNamespace( 'test', options, registry );

		expect( objectStorage.getItem ).toHaveBeenCalledTimes( 1 );
		expect( objectStorage.getItem ).toHaveBeenCalledWith( 'FOO' );
	} );

	it( 'saves state to persistence upon action dispatch', () => {
		const initialState = { value: 'initial' };
		const nextState = { value: 'next' };

		const options = {
			reducer: ( state = initialState, action ) => {
				return ( 'GO' === action.type ? action.state : state );
			},
			selectors: {},
			actions: {
				go() {
					return { type: 'GO', state: nextState };
				},
			},
			persist: true,
			persistenceOptions: {
				storage: objectStorage,
				storageKey: 'FOO',
			},
		};
		const namespace = createNamespace( 'test', options, registry );
		namespace.getActions().go();

		expect( objectStorage.setItem ).toHaveBeenCalledTimes( 1 );
		expect( objectStorage.setItem ).toHaveBeenCalledWith( 'FOO', JSON.stringify( { test: nextState } ) );
	} );

	it( 'only persists the keys given', () => {
		const initialState = { persistedValue: 'initial', nonPersistedValue: 'initial' };
		const nextState = { persistedValue: 'next', nonPersistedValue: 'next' };

		const options = {
			reducer: ( state = initialState, action ) => {
				return ( 'GO' === action.type ? action.state : state );
			},
			selectors: {},
			actions: {
				go() {
					return { type: 'GO', state: nextState };
				},
			},
			persist: [ 'persistedValue' ],
			persistenceOptions: {
				storage: objectStorage,
				storageKey: 'FOO',
			},
		};
		const namespace = createNamespace( 'test', options, registry );
		namespace.getActions().go();

		const pickState = pick( nextState, [ 'persistedValue' ] );
		expect( objectStorage.setItem ).toHaveBeenCalledTimes( 1 );
		expect( objectStorage.setItem ).toHaveBeenCalledWith( 'FOO', JSON.stringify( { test: pickState } ) );
	} );
} );

