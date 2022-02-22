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

	describe( 'single resolution', () => {
		it( 'should return with started resolution', () => {
			const state = reducer( undefined, {
				type: 'START_RESOLUTION',
				selectorName: 'getFoo',
				args: [],
			} );

			// { test: { getFoo: EquivalentKeyMap( [] =>  isResolving: true } ) } }
			expect( state.getFoo.get( [] ) ).toEqual( { isResolving: true } );
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

			// { test: { getFoo: EquivalentKeyMap( [] => { isResolving: false } ) } }
			expect( state.getFoo.get( [] ) ).toEqual( { isResolving: false } );
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

			// { getFoo: EquivalentKeyMap( [] => { isResolving: false } ) }
			expect( state.getFoo.get( [ 'post' ] ) ).toEqual( {
				isResolving: false,
			} );
			expect( state.getFoo.get( [ 'block' ] ) ).toEqual( {
				isResolving: true,
			} );
		} );

		it(
			'should remove invalidation for store level and leave others ' +
				'intact',
			() => {
				const original = reducer( undefined, {
					type: 'FINISH_RESOLUTION',
					selectorName: 'getFoo',
					args: [ 'post' ],
				} );
				const state = reducer( deepFreeze( original ), {
					type: 'INVALIDATE_RESOLUTION_FOR_STORE',
				} );

				expect( state ).toEqual( {} );
			}
		);

		it(
			'should remove invalidation for store and selector name level and ' +
				'leave other selectors at store level intact',
			() => {
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
				// { getFoo: EquivalentKeyMap( [] => { isResolving: false } ) }
				expect( state.getFoo.get( [ 'post' ] ) ).toEqual( {
					isResolving: false,
				} );
			}
		);

		it( 'should normalize args array when dispatching actions', () => {
			const started = reducer( undefined, {
				type: 'START_RESOLUTION',
				selectorName: 'getFoo',
				args: [ 1, undefined ],
			} );
			expect( started.getFoo.get( [ 1 ] ) ).toEqual( {
				isResolving: true,
			} );

			const finished = reducer( started, {
				type: 'FINISH_RESOLUTION',
				selectorName: 'getFoo',
				args: [ 1, undefined, undefined ],
			} );
			expect( finished.getFoo.get( [ 1 ] ) ).toEqual( {
				isResolving: false,
			} );
		} );
	} );

	describe( 'resolution batch', () => {
		it( 'should return with started resolutions', () => {
			const state = reducer( undefined, {
				type: 'START_RESOLUTIONS',
				selectorName: 'getFoo',
				args: [ [ 'post' ], [ 'block' ] ],
			} );

			expect( state.getFoo.get( [ 'post' ] ) ).toEqual( {
				isResolving: true,
			} );
			expect( state.getFoo.get( [ 'block' ] ) ).toEqual( {
				isResolving: true,
			} );
		} );

		it( 'should return with finished resolutions', () => {
			const original = reducer( undefined, {
				type: 'START_RESOLUTIONS',
				selectorName: 'getFoo',
				args: [ [ 'post' ], [ 'block' ] ],
			} );
			const state = reducer( deepFreeze( original ), {
				type: 'FINISH_RESOLUTIONS',
				selectorName: 'getFoo',
				args: [ [ 'post' ], [ 'block' ] ],
			} );

			expect( state.getFoo.get( [ 'post' ] ) ).toEqual( {
				isResolving: false,
			} );
			expect( state.getFoo.get( [ 'block' ] ) ).toEqual( {
				isResolving: false,
			} );
		} );

		it( 'should remove invalidations', () => {
			let state = reducer( undefined, {
				type: 'START_RESOLUTIONS',
				selectorName: 'getFoo',
				args: [ [ 'post' ], [ 'block' ] ],
			} );
			state = reducer( deepFreeze( state ), {
				type: 'FINISH_RESOLUTIONS',
				selectorName: 'getFoo',
				args: [ [ 'post' ], [ 'block' ] ],
			} );
			state = reducer( deepFreeze( state ), {
				type: 'INVALIDATE_RESOLUTION',
				selectorName: 'getFoo',
				args: [ 'post' ],
			} );

			expect( state.getFoo.get( [ 'post' ] ) ).toBe( undefined );
			expect( state.getFoo.get( [ 'block' ] ) ).toEqual( {
				isResolving: false,
			} );
		} );

		it( 'different arguments should not conflict', () => {
			const original = reducer( undefined, {
				type: 'START_RESOLUTIONS',
				selectorName: 'getFoo',
				args: [ [ 'post' ] ],
			} );
			let state = reducer( deepFreeze( original ), {
				type: 'FINISH_RESOLUTIONS',
				selectorName: 'getFoo',
				args: [ [ 'post' ] ],
			} );
			state = reducer( deepFreeze( state ), {
				type: 'START_RESOLUTIONS',
				selectorName: 'getFoo',
				args: [ [ 'block' ] ],
			} );

			expect( state.getFoo.get( [ 'post' ] ) ).toEqual( {
				isResolving: false,
			} );
			expect( state.getFoo.get( [ 'block' ] ) ).toEqual( {
				isResolving: true,
			} );
		} );

		it(
			'should remove invalidation for store level and leave others ' +
				'intact',
			() => {
				const original = reducer( undefined, {
					type: 'FINISH_RESOLUTIONS',
					selectorName: 'getFoo',
					args: [ [ 'post' ], [ 'block' ] ],
				} );
				const state = reducer( deepFreeze( original ), {
					type: 'INVALIDATE_RESOLUTION_FOR_STORE',
				} );

				expect( state ).toEqual( {} );
			}
		);

		it(
			'should remove invalidation for store and selector name level and ' +
				'leave other selectors at store level intact',
			() => {
				const original = reducer( undefined, {
					type: 'FINISH_RESOLUTIONS',
					selectorName: 'getFoo',
					args: [ [ 'post' ], [ 'block' ] ],
				} );
				let state = reducer( deepFreeze( original ), {
					type: 'FINISH_RESOLUTIONS',
					selectorName: 'getBar',
					args: [ [ 'postBar' ] ],
				} );
				state = reducer( deepFreeze( state ), {
					type: 'INVALIDATE_RESOLUTION_FOR_STORE_SELECTOR',
					selectorName: 'getBar',
				} );

				expect( state.getBar ).toBeUndefined();
				expect( state.getFoo.get( [ 'post' ] ) ).toEqual( {
					isResolving: false,
				} );
				expect( state.getFoo.get( [ 'block' ] ) ).toEqual( {
					isResolving: false,
				} );
			}
		);

		it( 'should normalize args array when dispatching actions', () => {
			const started = reducer( undefined, {
				type: 'START_RESOLUTIONS',
				selectorName: 'getFoo',
				args: [
					[ 1, undefined ],
					[ 2, undefined, undefined ],
				],
			} );
			expect( started.getFoo.get( [ 1 ] ) ).toEqual( {
				isResolving: true,
			} );
			expect( started.getFoo.get( [ 2 ] ) ).toEqual( {
				isResolving: true,
			} );

			const finished = reducer( started, {
				type: 'FINISH_RESOLUTIONS',
				selectorName: 'getFoo',
				args: [
					[ 1, undefined, undefined ],
					[ 2, undefined ],
				],
			} );
			expect( finished.getFoo.get( [ 1 ] ) ).toEqual( {
				isResolving: false,
			} );
			expect( finished.getFoo.get( [ 2 ] ) ).toEqual( {
				isResolving: false,
			} );
		} );
	} );
} );
