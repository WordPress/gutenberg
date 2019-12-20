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
			selectorName: 'getFoo',
			args: [],
		} );

		// { test: { getFoo: EquivalentKeyMap( [] => true ) } }
		expect( state.getFoo.get( [] ) ).toBe( true );
	} );

	it( 'should return with finished resolution', () => {
		const original = reducer( undefined, {
			type: 'START_RESOLUTION',
			selectorName: 'getFoo',
			args: [],
		} );
		const state = reducer( deepFreeze( original ), {
			type: 'FINISH_RESOLUTION',
			selectorName: 'getFoo',
			args: [],
		} );

		// { test: { getFoo: EquivalentKeyMap( [] => false ) } }
		expect( state.getFoo.get( [] ) ).toBe( false );
	} );

	it( 'should remove invalidations', () => {
		let state = reducer( undefined, {
			type: 'START_RESOLUTION',
			selectorName: 'getFoo',
			args: [],
		} );
		state = reducer( deepFreeze( state ), {
			type: 'FINISH_RESOLUTION',
			selectorName: 'getFoo',
			args: [],
		} );
		state = reducer( deepFreeze( state ), {
			type: 'INVALIDATE_RESOLUTION',
			selectorName: 'getFoo',
			args: [],
		} );

		// { getFoo: EquivalentKeyMap( [] => undefined ) }
		expect( state.getFoo.get( [] ) ).toBe( undefined );
	} );

	it( 'different arguments should not conflict', () => {
		const original = reducer( undefined, {
			type: 'START_RESOLUTION',
			selectorName: 'getFoo',
			args: [ 'post' ],
		} );
		let state = reducer( deepFreeze( original ), {
			type: 'FINISH_RESOLUTION',
			selectorName: 'getFoo',
			args: [ 'post' ],
		} );
		state = reducer( deepFreeze( state ), {
			type: 'START_RESOLUTION',
			selectorName: 'getFoo',
			args: [ 'block' ],
		} );

		// { getFoo: EquivalentKeyMap( [] => false ) }
		expect( state.getFoo.get( [ 'post' ] ) ).toBe( false );
		expect( state.getFoo.get( [ 'block' ] ) ).toBe( true );
	} );

	it( 'should remove invalidation for store level and leave others ' +
		'intact', () => {
		const original = reducer( undefined, {
			type: 'FINISH_RESOLUTION',
			selectorName: 'getFoo',
			args: [ 'post' ],
		} );
		const state = reducer( deepFreeze( original ), {
			type: 'INVALIDATE_RESOLUTION_FOR_STORE',
		} );

		expect( state ).toEqual( {} );
	} );

	it( 'should remove invalidation for store and selector name level and ' +
		'leave other selectors at store level intact', () => {
		const original = reducer( undefined, {
			type: 'FINISH_RESOLUTION',
			selectorName: 'getFoo',
			args: [ 'post' ],
		} );
		let state = reducer( deepFreeze( original ), {
			type: 'FINISH_RESOLUTION',
			selectorName: 'getBar',
			args: [ 'postBar' ],
		} );
		state = reducer( deepFreeze( state ), {
			type: 'INVALIDATE_RESOLUTION_FOR_STORE_SELECTOR',
			selectorName: 'getBar',
		} );

		expect( state.getBar ).toBeUndefined();
		// { getFoo: EquivalentKeyMap( [] => false ) }
		expect( state.getFoo.get( [ 'post' ] ) ).toBe( false );
	} );
} );
