/**
 * Internal dependencies
 */
import withHistory from '../';

describe( 'withHistory', () => {
	const counter = ( state = { count: 0 }, { type } ) => {
		if ( type === 'INCREMENT' ) {
			return { count: state.count + 1 };
		}

		if ( type === 'RESET' ) {
			return { count: 0 };
		}

		return state;
	};

	const reducer = withHistory( counter, {
		shouldOverwriteState: ( { type } ) => type === 'INCREMENT',
		resetTypes: [ 'RESET_HISTORY' ],
	} );

	it( 'should return a new reducer', () => {
		const state = reducer( undefined, {} );

		expect( state ).toEqual( {
			past: [],
			present: { count: 0 },
			future: [],
		} );
	} );

	it( 'should track changes in present', () => {
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

	it( 'should perform undo of buffer', () => {
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

	it( 'should perform undo of last level', () => {
		let state;
		state = reducer( undefined, {} );
		state = reducer( state, { type: 'INCREMENT' } );
		state = reducer( state, { type: 'CREATE_UNDO_LEVEL' } );
		state = reducer( state, { type: 'UNDO' } );

		expect( state ).toEqual( {
			past: [],
			present: { count: 0 },
			future: [ { count: 1 } ],
		} );

		expect( state ).toBe( reducer( state, { type: 'UNDO' } ) );
	} );

	it( 'should perform redo', () => {
		let state;
		state = reducer( undefined, {} );
		state = reducer( state, { type: 'INCREMENT' } );
		state = reducer( state, { type: 'CREATE_UNDO_LEVEL' } );
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
		let state;
		state = reducer( undefined, {} );
		state = reducer( state, { type: 'INCREMENT' } );
		state = reducer( state, { type: 'CREATE_UNDO_LEVEL' } );
		state = reducer( state, { type: 'RESET_HISTORY' } );

		expect( state ).toEqual( {
			past: [],
			present: { count: 1 },
			future: [],
		} );
	} );

	it( 'should create history record for non buffer types', () => {
		let state;
		state = reducer( undefined, {} );
		state = reducer( state, { type: 'INCREMENT' } );
		state = reducer( state, { type: 'RESET' } );

		expect( state ).toEqual( {
			past: [ { count: 0 }, { count: 1 } ],
			present: { count: 0 },
			future: [],
		} );
	} );
} );
