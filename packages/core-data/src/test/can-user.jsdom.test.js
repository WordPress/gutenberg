import { beforeEach, describe, expect, it, vi } from 'vitest';
import triggerFetch from '@wordpress/api-fetch';
import { createRegistry } from '@wordpress/data';
import { store as coreDataStore } from '../index';

vi.mock( '@wordpress/api-fetch' );

const ALLOW_ALL = {
	headers: new Map( [ [ 'allow', 'POST, GET, PUT, DELETE' ] ] ),
};

describe( 'canUser', () => {
	let registry;

	beforeEach( () => {
		registry = createRegistry();
		registry.register( coreDataStore );
		triggerFetch.mockReset();
		triggerFetch.mockImplementation( () => ALLOW_ALL );
	} );

	it( 'makes a single OPTIONS request for all four actions on a resource', async () => {
		await Promise.all(
			[ 'create', 'read', 'update', 'delete' ].map( ( action ) =>
				registry
					.resolveSelect( coreDataStore )
					.canUser( action, 'blocks', 123 )
			)
		);

		expect( triggerFetch ).toHaveBeenCalledTimes( 1 );
		expect( triggerFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/blocks/123',
			method: 'OPTIONS',
			parse: false,
		} );
	} );

	it( 'resolves each action with its own permission', async () => {
		triggerFetch.mockImplementation( () => ( {
			headers: new Map( [ [ 'allow', 'GET' ] ] ),
		} ) );

		const resolve = registry.resolveSelect( coreDataStore );
		const [ create, read ] = await Promise.all( [
			resolve.canUser( 'create', 'blocks' ),
			resolve.canUser( 'read', 'blocks' ),
		] );

		expect( create ).toBe( false );
		expect( read ).toBe( true );
	} );

	it( 'waits for a resolution that is already in flight', async () => {
		// Hold the response open so both calls are resolving at the same time.
		let respond;
		triggerFetch.mockImplementation(
			() =>
				new Promise( ( resolve ) => {
					respond = () => resolve( ALLOW_ALL );
				} )
		);

		const resolve = registry.resolveSelect( coreDataStore );
		// `read` starts the request; `create` then finds it already in flight.
		// Previously `create` reported itself resolved and returned `undefined`
		// without waiting for the response.
		const read = resolve.canUser( 'read', 'blocks' );
		const create = resolve.canUser( 'create', 'blocks' );

		// Let both resolvers run before releasing the response.
		await new Promise( ( done ) => setTimeout( done, 0 ) );
		respond();

		await expect( read ).resolves.toBe( true );
		await expect( create ).resolves.toBe( true );
	} );

	it( 'shares resolution state across the four actions', async () => {
		await registry
			.resolveSelect( coreDataStore )
			.canUser( 'create', 'blocks' );

		const { hasFinishedResolution } = registry.select( coreDataStore );
		for ( const action of [ 'create', 'read', 'update', 'delete' ] ) {
			expect(
				hasFinishedResolution( 'canUser', [ action, 'blocks' ] )
			).toBe( true );
		}
	} );

	it( 'resolves separately per resource', async () => {
		const resolve = registry.resolveSelect( coreDataStore );
		await Promise.all( [
			resolve.canUser( 'create', 'blocks', 1 ),
			resolve.canUser( 'read', 'blocks', 2 ),
		] );

		expect( triggerFetch ).toHaveBeenCalledTimes( 2 );
	} );
} );
