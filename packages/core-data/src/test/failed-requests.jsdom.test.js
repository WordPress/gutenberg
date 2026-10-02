import { beforeEach, describe, expect, it, vi } from 'vitest';
import triggerFetch from '@wordpress/api-fetch';
import { createRegistry } from '@wordpress/data';
import { store as coreDataStore } from '../index';

vi.mock( import( '@wordpress/api-fetch' ) );

const TOO_MANY_REQUESTS = {
	code: 'rest_too_many_requests',
	message: 'Too many requests.',
	data: { status: 429 },
};

const TAXONOMIES_PATH = '/wp/v2/taxonomies?context=view';
const TAXONOMIES = {
	category: { slug: 'category', name: 'Categories', rest_base: 'categories' },
};
const CATEGORIES = [ { id: 1, name: 'News' } ];

/**
 * Mocks REST responses by path, rejecting with `TOO_MANY_REQUESTS` for paths
 * listed in `failing`.
 *
 * @param {Object}      responses Responses keyed by request path.
 * @param {Set<string>} failing   Paths whose requests fail.
 */
function mockResponses( responses, failing = new Set() ) {
	triggerFetch.mockImplementation( ( { path, method = 'GET' } ) => {
		const key = method === 'GET' ? path : `${ method } ${ path }`;
		if ( failing.has( key ) ) {
			return Promise.reject( TOO_MANY_REQUESTS );
		}
		return Promise.resolve( responses[ key ] );
	} );
}

function getRequestCount( path, method = 'GET' ) {
	return triggerFetch.mock.calls.filter(
		( [ options ] ) =>
			options.path === path && ( options.method ?? 'GET' ) === method
	).length;
}

describe( 'failed requests', () => {
	let registry;

	beforeEach( () => {
		registry = createRegistry();
		registry.register( coreDataStore );
		triggerFetch.mockReset();
	} );

	describe( 'getEntityRecords', () => {
		it( 'fails the resolution when the request fails', async () => {
			mockResponses(
				{ 'OPTIONS /wp/v2/settings': {} },
				new Set( [ '/wp/v2/taxonomies?context=edit' ] )
			);

			await expect(
				registry
					.resolveSelect( coreDataStore )
					.getEntityRecords( 'root', 'taxonomy' )
			).rejects.toBe( TOO_MANY_REQUESTS );

			const select = registry.select( coreDataStore );
			expect(
				select.hasResolutionFailed( 'getEntityRecords', [
					'root',
					'taxonomy',
				] )
			).toBe( true );
			expect( select.getEntityRecords( 'root', 'taxonomy' ) ).toBeNull();
		} );
	} );

	describe( 'loading entity configs', () => {
		it( 'fails the resolution of records whose configs fail to load', async () => {
			mockResponses( {}, new Set( [ TAXONOMIES_PATH ] ) );

			await expect(
				registry
					.resolveSelect( coreDataStore )
					.getEntityRecords( 'taxonomy', 'category', {
						per_page: -1,
					} )
			).rejects.toBe( TOO_MANY_REQUESTS );
		} );

		it( 'retries a failed load for a later request', async () => {
			mockResponses( {}, new Set( [ TAXONOMIES_PATH ] ) );
			await registry
				.resolveSelect( coreDataStore )
				.getEntityRecords( 'taxonomy', 'category', { per_page: -1 } )
				.catch( () => {} );

			mockResponses( {
				[ TAXONOMIES_PATH ]: TAXONOMIES,
				'/wp/v2/categories?context=edit&per_page=-1&hide_empty=true':
					CATEGORIES,
			} );

			await expect(
				registry
					.resolveSelect( coreDataStore )
					.getEntityRecords( 'taxonomy', 'category', {
						per_page: -1,
						hide_empty: true,
					} )
			).resolves.toEqual( CATEGORIES );
			expect( getRequestCount( TAXONOMIES_PATH ) ).toBe( 2 );
		} );

		it( 'keeps static entities usable when loading the rest of their kind fails', async () => {
			mockResponses(
				{ '/wp/v2/taxonomies?context=edit': TAXONOMIES },
				new Set( [ 'OPTIONS /wp/v2/settings' ] )
			);

			await expect(
				registry
					.resolveSelect( coreDataStore )
					.getEntityRecords( 'root', 'taxonomy' )
			).resolves.toEqual( Object.values( TAXONOMIES ) );
		} );

		it( 'does not retry a failed load for entities that are already known', async () => {
			mockResponses(
				{
					'/wp/v2/taxonomies?context=edit': TAXONOMIES,
					'/wp/v2/taxonomies?context=view': TAXONOMIES,
				},
				new Set( [ 'OPTIONS /wp/v2/settings' ] )
			);

			const resolveSelect = registry.resolveSelect( coreDataStore );
			await resolveSelect.getEntityRecords( 'root', 'taxonomy' );
			await resolveSelect.getEntityRecords( 'root', 'taxonomy', {
				context: 'view',
			} );

			expect( getRequestCount( '/wp/v2/settings', 'OPTIONS' ) ).toBe( 1 );
		} );

		it( 'rejects a save with the load error when throwOnError is set', async () => {
			mockResponses( {}, new Set( [ TAXONOMIES_PATH ] ) );

			await expect(
				registry
					.dispatch( coreDataStore )
					.saveEntityRecord(
						'taxonomy',
						'category',
						{ name: 'News' },
						{ throwOnError: true }
					)
			).rejects.toBe( TOO_MANY_REQUESTS );
		} );

		it( 'resolves a save without throwOnError when the configs fail to load', async () => {
			mockResponses( {}, new Set( [ TAXONOMIES_PATH ] ) );

			await expect(
				registry
					.dispatch( coreDataStore )
					.saveEntityRecord( 'taxonomy', 'category', {
						name: 'News',
					} )
			).resolves.toBeUndefined();
		} );
	} );
} );
