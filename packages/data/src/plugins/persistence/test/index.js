/**
 * Internal dependencies
 */
import plugin, {
	getPersistedData,
	setPersistedData,
	createPersistMiddleware,
	withInitialState,
} from '../';
import objectStorage from '../storage/object';

describe( 'persistence', () => {
	const registry = { registerStore: jest.fn() };

	let _originalStorage;
	beforeAll( () => {
		_originalStorage = plugin.getStorage();
		plugin.setStorage( objectStorage );

		jest.spyOn( objectStorage, 'setItem' );
	} );

	afterAll( () => {
		plugin.setStorage( _originalStorage );
	} );

	beforeEach( () => {
		objectStorage.clear();
		objectStorage.setItem.mockClear();
	} );

	it( 'should not mutate options', () => {
		const options = Object.freeze( { persist: true, reducer() {} } );

		plugin( registry ).registerStore( 'test', options );
	} );

	it( 'override values passed to registerStore', () => {
		const options = { persist: true, reducer() {} };

		plugin( registry ).registerStore( 'test', options );

		expect( registry.registerStore ).toHaveBeenCalledWith( 'test', {
			persist: true,
			middlewares: expect.arrayContaining( [ expect.any( Function ) ] ),
			reducer: expect.any( Function ),
		} );
		// Replaced reducer:
		expect( registry.registerStore.mock.calls[ 0 ][ 1 ].reducer ).not.toBe( options.reducer );
	} );

	describe( 'getPersistedData', () => {
		it( 'returns an empty object if not set', () => {
			const data = getPersistedData();

			expect( data ).toEqual( {} );
		} );

		it( 'returns the current value', () => {
			objectStorage.setItem( plugin.getStorageKey(), '{"test":{}}' );
			const data = getPersistedData();

			expect( data ).toEqual( { test: {} } );
		} );
	} );

	describe( 'setPersistedData', () => {
		it( 'sets JSON by object', () => {
			setPersistedData( 'test', {} );

			expect( objectStorage.setItem ).toHaveBeenCalledWith( 'WP_DATA', '{"test":{}}' );
		} );

		it( 'merges to existing', () => {
			setPersistedData( 'test1', {} );
			setPersistedData( 'test2', {} );

			expect( objectStorage.setItem ).toHaveBeenCalledWith( 'WP_DATA', '{"test1":{}}' );
			expect( objectStorage.setItem ).toHaveBeenCalledWith( 'WP_DATA', '{"test1":{},"test2":{}}' );
		} );
	} );

	describe( 'createPersistMiddleware', () => {
		const state = { foo: 'bar', baz: 'qux' };
		const store = {
			getState: () => state,
		};

		it( 'should return a middleware function', () => {
			const middleware = createPersistMiddleware( 'test', true );
			const action = {};
			const next = jest.fn().mockReturnValue( action );

			const result = middleware( store )( next )( action );

			expect( next ).toHaveBeenCalledWith( action );
			expect( result ).toBe( action );
		} );

		it( 'should not persist when state matches initial', () => {
			const middleware = createPersistMiddleware( 'test', true, state );
			const action = {};
			const next = jest.fn();

			middleware( store )( next )( action );

			expect( objectStorage.setItem ).not.toHaveBeenCalled();
		} );

		it( 'should persist when state changes', () => {
			const middleware = createPersistMiddleware( 'test', true, {} );
			const action = {};
			const next = jest.fn();

			middleware( store )( next )( action );

			expect( objectStorage.setItem ).toHaveBeenCalledWith( 'WP_DATA', '{"test":{"foo":"bar","baz":"qux"}}' );
		} );

		it( 'should persist a subset of keys', () => {
			const middleware = createPersistMiddleware( 'test', [ 'foo' ], {} );
			const action = {};
			const next = jest.fn();

			middleware( store )( next )( action );

			expect( objectStorage.setItem ).toHaveBeenCalledWith( 'WP_DATA', '{"test":{"foo":"bar"}}' );
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
} );
