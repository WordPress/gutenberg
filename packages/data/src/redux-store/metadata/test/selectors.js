/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

jest.useRealTimers();
const testStore = {
	reducer: ( state = null, action ) => {
		if ( action.type === 'RECEIVE' ) {
			return action.items;
		}

		return state;
	},
	selectors: {
		getFoo: ( state ) => state,
	},
};

async function resolve( registry, selector ) {
	try {
		await registry.resolveSelect( 'store' )[ selector ]();
	} catch ( e ) {}
}

describe( 'getIsResolving', () => {
	let registry;
	beforeEach( () => {
		registry = createRegistry();
		registry.registerStore( 'testStore', testStore );
	} );

	it( 'should return undefined if no state by reducerKey, selectorName', () => {
		const result = registry
			.select( 'testStore' )
			.getIsResolving( 'getFoo', [] );

		expect( result ).toBe( undefined );
	} );

	it( 'should return undefined if state by reducerKey, selectorName, but not args', () => {
		registry.dispatch( 'testStore' ).startResolution( 'getFoo', [] );
		const result = registry
			.select( 'testStore' )
			.getIsResolving( 'getFoo', [ 'bar' ] );

		expect( result ).toBe( undefined );
	} );

	it( 'should return value by reducerKey, selectorName', () => {
		registry.dispatch( 'testStore' ).startResolution( 'getFoo', [] );
		const result = registry
			.select( 'testStore' )
			.getIsResolving( 'getFoo', [] );

		expect( result ).toBe( true );
	} );

	it( 'should normalize args ard return the right value', () => {
		registry.dispatch( 'testStore' ).startResolution( 'getFoo', [] );
		const { getIsResolving } = registry.select( 'testStore' );

		expect( getIsResolving( 'getFoo' ) ).toBe( true );
		expect( getIsResolving( 'getFoo', [ undefined ] ) ).toBe( true );
		expect( getIsResolving( 'getFoo', [ undefined, undefined ] ) ).toBe(
			true
		);
	} );
} );

describe( 'hasStartedResolution', () => {
	let registry;
	beforeEach( () => {
		registry = createRegistry();
		registry.registerStore( 'testStore', testStore );
	} );

	it( 'returns false if not has started', () => {
		const result = registry
			.select( 'testStore' )
			.hasStartedResolution( 'getFoo', [] );

		expect( result ).toBe( false );
	} );

	it( 'returns true if has started', () => {
		registry.dispatch( 'testStore' ).startResolution( 'getFoo', [] );
		const { hasStartedResolution } = registry.select( 'testStore' );
		const result = hasStartedResolution( 'getFoo', [] );

		expect( result ).toBe( true );
	} );
} );

describe( 'hasFinishedResolution', () => {
	let registry;
	beforeEach( () => {
		registry = createRegistry();
		registry.registerStore( 'testStore', testStore );
	} );

	it( 'returns false if not has finished', () => {
		registry.dispatch( 'testStore' ).startResolution( 'getFoo', [] );
		const { hasFinishedResolution } = registry.select( 'testStore' );
		const result = hasFinishedResolution( 'getFoo', [] );

		expect( result ).toBe( false );
	} );

	it( 'returns true if has finished', () => {
		registry.dispatch( 'testStore' ).finishResolution( 'getFoo', [] );
		const { hasFinishedResolution } = registry.select( 'testStore' );
		const result = hasFinishedResolution( 'getFoo', [] );

		expect( result ).toBe( true );
	} );
} );

describe( 'isResolving', () => {
	let registry;
	beforeEach( () => {
		registry = createRegistry();
		registry.registerStore( 'testStore', testStore );
	} );

	it( 'returns false if not has started', () => {
		const { isResolving } = registry.select( 'testStore' );
		const result = isResolving( 'getFoo', [] );

		expect( result ).toBe( false );
	} );

	it( 'returns false if has finished', () => {
		registry.dispatch( 'testStore' ).startResolution( 'getFoo', [] );
		registry.dispatch( 'testStore' ).finishResolution( 'getFoo', [] );
		const { isResolving } = registry.select( 'testStore' );
		const result = isResolving( 'getFoo', [] );

		expect( result ).toBe( false );
	} );

	it( 'returns true if has started but not finished', () => {
		registry.dispatch( 'testStore' ).startResolution( 'getFoo', [] );
		const { isResolving } = registry.select( 'testStore' );
		const result = isResolving( 'getFoo', [] );

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
				getFoo: ( state ) => state,
			},
			resolvers: {
				getFoo: () => {},
			},
		} );

		expect(
			registry.select( 'store' ).hasResolutionFailed( 'getFoo' )
		).toBeFalsy();

		registry.select( 'store' ).getFoo();

		expect(
			registry.select( 'store' ).hasResolutionFailed( 'getFoo' )
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
				getFoo: ( state ) => state,
			},
			resolvers: {
				getFoo: () => {
					throw new Error( 'cannot fetch items' );
				},
			},
		} );

		expect(
			registry.select( 'store' ).hasResolutionFailed( 'getFoo' )
		).toBeFalsy();

		await resolve( registry, 'getFoo' );

		expect(
			registry.select( 'store' ).hasResolutionFailed( 'getFoo' )
		).toBeTruthy();
	} );

	it( 'returns true if the resolution has failed even if the error is falsy', async () => {
		registry.registerStore( 'store', {
			reducer: ( state = null, action ) => {
				if ( action.type === 'RECEIVE' ) {
					return action.items;
				}

				return state;
			},
			selectors: {
				getFoo: ( state ) => state,
			},
			resolvers: {
				getFoo: () => {
					throw null;
				},
			},
		} );

		expect(
			registry.select( 'store' ).hasResolutionFailed( 'getFoo' )
		).toBeFalsy();

		await resolve( registry, 'getFoo' );

		expect(
			registry.select( 'store' ).hasResolutionFailed( 'getFoo' )
		).toBeTruthy();
	} );
} );

describe( 'getResolutionError', () => {
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
				getFoo: ( state ) => state,
			},
			resolvers: {
				getFoo: () => {
					if ( shouldFail ) {
						throw new Error( 'cannot fetch items' );
					}
				},
			},
		} );
	} );

	it( 'returns undefined if the resolution has succeeded', async () => {
		expect(
			registry.select( 'store' ).getResolutionError( 'getFoo' )
		).toBeFalsy();

		registry.select( 'store' ).getFoo();

		expect(
			registry.select( 'store' ).getResolutionError( 'getFoo' )
		).toBeFalsy();
	} );

	it( 'returns error if the resolution has failed', async () => {
		shouldFail = true;

		expect(
			registry.select( 'store' ).getResolutionError( 'getFoo' )
		).toBeFalsy();

		await resolve( registry, 'getFoo' );

		expect(
			registry.select( 'store' ).getResolutionError( 'getFoo' ).toString()
		).toBe( 'Error: cannot fetch items' );
	} );

	it( 'returns undefined if the failed resolution succeeded after retry', async () => {
		shouldFail = true;
		expect(
			registry.select( 'store' ).getResolutionError( 'getFoo' )
		).toBeFalsy();

		await resolve( registry, 'getFoo' );

		expect(
			registry.select( 'store' ).getResolutionError( 'getFoo' )
		).toBeTruthy();

		registry.dispatch( 'store' ).invalidateResolution( 'getFoo', [] );

		expect(
			registry.select( 'store' ).getResolutionError( 'getFoo' )
		).toBeFalsy();

		shouldFail = false;
		registry.select( 'store' ).getFoo();

		expect(
			registry.select( 'store' ).getResolutionError( 'getFoo' )
		).toBeFalsy();
	} );
} );
