/**
 * External dependencies
 */
import EquivalentKeyMap from 'equivalent-key-map';

/**
 * Internal dependencies
 */
import {
	getIsResolving,
	hasStartedResolution,
	hasFinishedResolution,
	isResolving,
} from '../selectors';
/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

jest.useFakeTimers();

async function resolve( registry, selector ) {
	const resolution = registry.resolveSelect( 'store' )[ selector ]();
	jest.advanceTimersByTime( 100 );
	try {
		await resolution;
	} catch ( e ) {}
}

describe( 'getIsResolving', () => {
	it( 'should return undefined if no state by reducerKey, selectorName', () => {
		const state = {};
		const result = getIsResolving( state, 'getFoo', [] );

		expect( result ).toBe( undefined );
	} );

	it( 'should return undefined if state by reducerKey, selectorName, but not args', () => {
		const state = {
			getFoo: new EquivalentKeyMap( [ [ [], { isResolving: true } ] ] ),
		};
		const result = getIsResolving( state, 'getFoo', [ 'bar' ] );

		expect( result ).toBe( undefined );
	} );

	it( 'should return value by reducerKey, selectorName', () => {
		const state = {
			getFoo: new EquivalentKeyMap( [ [ [], { isResolving: true } ] ] ),
		};
		const result = getIsResolving( state, 'getFoo', [] );

		expect( result ).toBe( true );
	} );

	it( 'should normalize args ard return the right value', () => {
		const state = {
			getFoo: new EquivalentKeyMap( [ [ [], true ] ] ),
		};
		expect( getIsResolving( state, 'getFoo' ) ).toBe( true );
		expect( getIsResolving( state, 'getFoo', [ undefined ] ) ).toBe( true );
		expect(
			getIsResolving( state, 'getFoo', [ undefined, undefined ] )
		).toBe( true );
	} );
} );

describe( 'hasStartedResolution', () => {
	it( 'returns false if not has started', () => {
		const state = {};
		const result = hasStartedResolution( state, 'getFoo', [] );

		expect( result ).toBe( false );
	} );

	it( 'returns true if has started', () => {
		const state = {
			getFoo: new EquivalentKeyMap( [ [ [], { isResolving: true } ] ] ),
		};
		const result = hasStartedResolution( state, 'getFoo', [] );

		expect( result ).toBe( true );
	} );
} );

describe( 'hasFinishedResolution', () => {
	it( 'returns false if not has finished', () => {
		const state = {
			getFoo: new EquivalentKeyMap( [ [ [], { isResolving: true } ] ] ),
		};
		const result = hasFinishedResolution( state, 'getFoo', [] );

		expect( result ).toBe( false );
	} );

	it( 'returns true if has finished', () => {
		const state = {
			getFoo: new EquivalentKeyMap( [ [ [], { isResolving: false } ] ] ),
		};
		const result = hasFinishedResolution( state, 'getFoo', [] );

		expect( result ).toBe( true );
	} );
} );

describe( 'isResolving', () => {
	it( 'returns false if not has started', () => {
		const state = {};
		const result = isResolving( state, 'getFoo', [] );

		expect( result ).toBe( false );
	} );

	it( 'returns false if has finished', () => {
		const state = {
			getFoo: new EquivalentKeyMap( [ [ [], { isResolving: false } ] ] ),
		};
		const result = isResolving( state, 'getFoo', [] );

		expect( result ).toBe( false );
	} );

	it( 'returns true if has started but not finished', () => {
		const state = {
			getFoo: new EquivalentKeyMap( [ [ [], { isResolving: true } ] ] ),
		};
		const result = isResolving( state, 'getFoo', [] );

		expect( result ).toBe( true );
	} );
} );

describe( 'hasResolutionFailed', () => {
	let registry;

	beforeEach( () => {
		registry = createRegistry();
	} );

	it( 'returns false if the resolution has succeeded', async () => {
		registry.registerStore( 'store', {
			reducer: ( state = null, action ) => {
				if ( action.type === 'RECEIVE' ) {
					return action.items;
				}

				return state;
			},
			selectors: {
				getItems: ( state ) => state,
			},
			resolvers: {
				getItems: () => {},
			},
		} );

		expect(
			registry.select( 'store' ).hasResolutionFailed( 'getItems' )
		).toBeFalsy();

		registry.select( 'store' ).getItems();
		jest.advanceTimersByTime( 1 );

		expect(
			registry.select( 'store' ).hasResolutionFailed( 'getItems' )
		).toBeFalsy();
	} );

	it( 'returns true if the resolution has failed', async () => {
		registry.registerStore( 'store', {
			reducer: ( state = null, action ) => {
				if ( action.type === 'RECEIVE' ) {
					return action.items;
				}

				return state;
			},
			selectors: {
				getItems: ( state ) => state,
			},
			resolvers: {
				getItems: () => {
					throw new Error( 'cannot fetch items' );
				},
			},
		} );

		expect(
			registry.select( 'store' ).hasResolutionFailed( 'getItems' )
		).toBeFalsy();

		await resolve( registry, 'getItems' );

		expect(
			registry.select( 'store' ).hasResolutionFailed( 'getItems' )
		).toBeTruthy();
	} );
} );

describe( 'getResolutionFailure', () => {
	let registry;
	let shouldFail;

	beforeEach( () => {
		shouldFail = false;
		registry = createRegistry();

		registry.registerStore( 'store', {
			reducer: ( state = null, action ) => {
				if ( action.type === 'RECEIVE' ) {
					return action.items;
				}

				return state;
			},
			selectors: {
				getItems: ( state ) => state,
			},
			resolvers: {
				getItems: () => {
					if ( shouldFail ) {
						throw new Error( 'cannot fetch items' );
					}
				},
			},
		} );
	} );

	it( 'returns undefined if the resolution has succeeded', async () => {
		expect(
			registry.select( 'store' ).getResolutionFailure( 'getItems' )
		).toBeFalsy();

		registry.select( 'store' ).getItems();
		jest.advanceTimersByTime( 1 );

		expect(
			registry.select( 'store' ).getResolutionFailure( 'getItems' )
		).toBeFalsy();
	} );

	it( 'returns error if the resolution has failed', async () => {
		shouldFail = true;

		expect(
			registry.select( 'store' ).getResolutionFailure( 'getItems' )
		).toBeFalsy();

		await resolve( registry, 'getItems' );

		expect(
			registry
				.select( 'store' )
				.getResolutionFailure( 'getItems' )
				.toString()
		).toBe( 'Error: cannot fetch items' );
	} );

	it( 'returns undefined if the failed resolution succeeded after retry', async () => {
		shouldFail = true;
		expect(
			registry.select( 'store' ).getResolutionFailure( 'getItems' )
		).toBeFalsy();

		await resolve( registry, 'getItems' );

		expect(
			registry.select( 'store' ).getResolutionFailure( 'getItems' )
		).toBeTruthy();

		registry.dispatch( 'store' ).invalidateResolution( 'getItems', [] );
		jest.advanceTimersByTime( 1 );

		expect(
			registry.select( 'store' ).getResolutionFailure( 'getItems' )
		).toBeFalsy();

		shouldFail = false;
		registry.select( 'store' ).getItems();
		jest.advanceTimersByTime( 1 );

		expect(
			registry.select( 'store' ).getResolutionFailure( 'getItems' )
		).toBeFalsy();
	} );
} );
