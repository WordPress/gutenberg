/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import reducer from '../reducer';

describe( 'reducer', () => {
	it( 'should default to an empty object', () => {
		const state = reducer( undefined, {} );

		expect( state ).toEqual( {} );
	} );

	it( 'should return with started resolution', () => {
		const state = reducer( undefined, {
			type: 'START_RESOLUTION',
			reducerKey: 'test',
			selectorName: 'getFoo',
			args: [],
		} );

		// { test: { getFoo: EquivalentKeyMap( [] => true ) } }
		expect( state.test.getFoo.get( [] ) ).toBe( true );
	} );

	it( 'should return with finished resolution', () => {
		const original = reducer( undefined, {
			type: 'START_RESOLUTION',
			reducerKey: 'test',
			selectorName: 'getFoo',
			args: [],
		} );
		const state = reducer( deepFreeze( original ), {
			type: 'FINISH_RESOLUTION',
			reducerKey: 'test',
			selectorName: 'getFoo',
			args: [],
		} );

		// { test: { getFoo: EquivalentKeyMap( [] => false ) } }
		expect( state.test.getFoo.get( [] ) ).toBe( false );
	} );

	it( 'should remove invalidations', () => {
		let state = reducer( undefined, {
			type: 'START_RESOLUTION',
			reducerKey: 'test',
			selectorName: 'getFoo',
			args: [],
		} );
		state = reducer( deepFreeze( state ), {
			type: 'FINISH_RESOLUTION',
			reducerKey: 'test',
			selectorName: 'getFoo',
			args: [],
		} );
		state = reducer( deepFreeze( state ), {
			type: 'INVALIDATE_RESOLUTION',
			reducerKey: 'test',
			selectorName: 'getFoo',
			args: [],
		} );

		// { test: { getFoo: EquivalentKeyMap( [] => undefined ) } }
		expect( state.test.getFoo.get( [] ) ).toBe( undefined );
	} );

	it( 'different arguments should not conflict', () => {
		const original = reducer( undefined, {
			type: 'START_RESOLUTION',
			reducerKey: 'test',
			selectorName: 'getFoo',
			args: [ 'post' ],
		} );
		let state = reducer( deepFreeze( original ), {
			type: 'FINISH_RESOLUTION',
			reducerKey: 'test',
			selectorName: 'getFoo',
			args: [ 'post' ],
		} );
		state = reducer( deepFreeze( state ), {
			type: 'START_RESOLUTION',
			reducerKey: 'test',
			selectorName: 'getFoo',
			args: [ 'block' ],
		} );

		// { test: { getFoo: EquivalentKeyMap( [] => false ) } }
		expect( state.test.getFoo.get( [ 'post' ] ) ).toBe( false );
		expect( state.test.getFoo.get( [ 'block' ] ) ).toBe( true );
	} );

	it( 'should remove invalidation for store level and leave others ' +
		'intact', () => {
		const original = reducer( undefined, {
			type: 'FINISH_RESOLUTION',
			reducerKey: 'testA',
			selectorName: 'getFoo',
			args: [ 'post' ],
		} );
		let state = reducer( deepFreeze( original ), {
			type: 'FINISH_RESOLUTION',
			reducerKey: 'testB',
			selectorName: 'getBar',
			args: [ 'postBar' ],
		} );
		state = reducer( deepFreeze( state ), {
			type: 'INVALIDATE_RESOLUTION_FOR_STORE',
			reducerKey: 'testA',
		} );

		expect( state.testA ).toBeUndefined();
		// { testB: { getBar: EquivalentKeyMap( [] => false ) } }
		expect( state.testB.getBar.get( [ 'postBar' ] ) ).toBe( false );
	} );

	it( 'should remove invalidation for store and selector name level and ' +
		'leave other selectors at store level intact', () => {
		const original = reducer( undefined, {
			type: 'FINISH_RESOLUTION',
			reducerKey: 'test',
			selectorName: 'getFoo',
			args: [ 'post' ],
		} );
		let state = reducer( deepFreeze( original ), {
			type: 'FINISH_RESOLUTION',
			reducerKey: 'test',
			selectorName: 'getBar',
			args: [ 'postBar' ],
		} );
		state = reducer( deepFreeze( state ), {
			type: 'INVALIDATE_RESOLUTION_FOR_STORE_SELECTOR',
			reducerKey: 'test',
			selectorName: 'getBar',
		} );

		expect( state.test.getBar ).toBeUndefined();
		// { test: { getFoo: EquivalentKeyMap( [] => false ) } }
		expect( state.test.getFoo.get( [ 'post' ] ) ).toBe( false );
	} );
} );
