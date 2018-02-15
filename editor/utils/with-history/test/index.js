/**
 * Internal dependencies
 */
import withHistory from '../';

describe( 'withHistory', () => {
	const counter = ( state = { count: 0 }, { type } ) => {
		return type === 'INCREMENT' ? { count: state.count + 1 } : state;
	};

	it( 'should return a new reducer', () => {
		const reducer = withHistory( counter );
		const state = reducer( undefined, {} );

		expect( state ).toEqual( {
			past: [],
			present: { count: 0 },
			future: [],
		} );
	} );

	it( 'should track changes in present', () => {
		const reducer = withHistory( counter );

		let state;
		state = reducer( undefined, {} );
		state = reducer( state, { type: 'INCREMENT' } );

		expect( state ).toEqual( {
			past: [ { count: 0 } ],
			present: { count: 1 },
			future: [],
		} );
	} );

	it( 'should create undo level', () => {
		const reducer = withHistory( counter );

		let state;
		state = reducer( undefined, {} );
		state = reducer( state, { type: 'INCREMENT' } );
		// state = reducer( state, { type: 'CREATE_UNDO_LEVEL' } );

		expect( state ).toEqual( {
			past: [ { count: 0 } ],
			present: { count: 1 },
			future: [],
		} );

		state = reducer( state, { type: 'INCREMENT' } );

		expect( state ).toEqual( {
			past: [ { count: 0 }, { count: 1 } ],
			present: { count: 2 },
			future: [],
		} );
	} );

	it( 'should perform undo', () => {
		const reducer = withHistory( counter );

		let state;
		state = reducer( undefined, {} );
		state = reducer( state, { type: 'INCREMENT' } );
		state = reducer( state, { type: 'UNDO' } );

		expect( state ).toEqual( {
			past: [],
			present: { count: 0 },
			future: [ { count: 1 } ],
		} );

		expect( state ).toBe( reducer( state, { type: 'UNDO' } ) );
	} );

	it( 'should perform redo', () => {
		const reducer = withHistory( counter );

		let state;
		state = reducer( undefined, {} );
		state = reducer( state, { type: 'INCREMENT' } );
		state = reducer( state, { type: 'UNDO' } );
		state = reducer( state, { type: 'REDO' } );

		expect( state ).toEqual( {
			past: [ { count: 0 } ],
			present: { count: 1 },
			future: [],
		} );

		expect( state ).toBe( reducer( state, { type: 'REDO' } ) );
	} );

	it( 'should reset history by options.resetTypes', () => {
		const reducer = withHistory( counter, { resetTypes: [ 'RESET_HISTORY' ] } );

		let state;
		state = reducer( undefined, {} );
		state = reducer( state, { type: 'INCREMENT' } );
		state = reducer( state, { type: 'RESET_HISTORY' } );

		expect( state ).toEqual( {
			past: [],
			present: { count: 1 },
			future: [],
		} );
	} );

	it( 'should overwrite present state with option.shouldOverwriteState', () => {
		const reducer = withHistory( counter, {
			shouldOverwriteState: ( { type } ) => type === 'INCREMENT',
		} );

		let state;
		state = reducer( undefined, {} );
		state = reducer( state, { type: 'INCREMENT' } );

		expect( state ).toEqual( {
			past: [ { count: 0 } ],
			present: { count: 1 },
			future: [],
		} );

		state = reducer( state, { type: 'INCREMENT' } );

		expect( state ).toEqual( {
			past: [ { count: 0 } ],
			present: { count: 2 },
			future: [],
		} );
	} );

	it( 'should create undo level with option.shouldOverwriteState and CREATE_UNDO_LEVEL', () => {
		const reducer = withHistory( counter, {
			shouldOverwriteState: ( { type } ) => type === 'INCREMENT',
		} );

		let state;
		state = reducer( undefined, {} );
		state = reducer( state, { type: 'INCREMENT' } );
		state = reducer( state, { type: 'CREATE_UNDO_LEVEL' } );

		expect( state ).toEqual( {
			past: [ { count: 0 } ],
			present: { count: 1 },
			future: [],
		} );

		state = reducer( state, { type: 'INCREMENT' } );

		expect( state ).toEqual( {
			past: [ { count: 0 }, { count: 1 } ],
			present: { count: 2 },
			future: [],
		} );
	} );
} );
