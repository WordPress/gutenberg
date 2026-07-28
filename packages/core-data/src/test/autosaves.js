/**
 * WordPress dependencies
 */
import triggerFetch from '@wordpress/api-fetch';
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as coreDataStore } from '../index';

jest.mock( '@wordpress/api-fetch' );

describe( 'autosaves', () => {
	const AUTHOR_ID = 7;
	const POST_ID = 1;
	const AUTOSAVE = { id: 99, author: AUTHOR_ID, parent: POST_ID };

	/**
	 * `getAutosave` resolves the post type first, which routes through
	 * `getEntityRecord` and expects an unparsed response. Everything else is the
	 * autosaves collection.
	 *
	 * @param {Array} autosaves The autosaves collection to serve.
	 */
	const mockFetch = ( autosaves ) => {
		triggerFetch.mockImplementation( ( { path, parse } ) => {
			if ( path.startsWith( '/wp/v2/types' ) ) {
				const postType = {
					slug: 'post',
					rest_base: 'posts',
					rest_namespace: 'wp/v2',
					supports: { autosave: true },
				};

				if ( parse === false ) {
					return {
						json: async () => postType,
						headers: { get: () => '' },
					};
				}

				return postType;
			}

			return autosaves;
		} );
	};

	const createTestRegistry = () => {
		const registry = createRegistry();
		registry.register( coreDataStore );
		return registry;
	};

	beforeEach( () => {
		triggerFetch.mockReset();
	} );

	/**
	 * `hasFetchedAutosaves` reads the resolution state of `getAutosaves`, while
	 * the editor resolves `getAutosave`. If those two ever come apart,
	 * `isEditedPostAutosaveable` never sees a completed fetch and autosaving
	 * silently stops working. This exercises the real resolution machinery
	 * rather than asserting on a mocked dispatch.
	 */
	it( 'reports hasFetchedAutosaves once getAutosave has resolved', async () => {
		const registry = createTestRegistry();
		mockFetch( [ AUTOSAVE ] );

		expect(
			registry
				.select( coreDataStore )
				.hasFetchedAutosaves( 'post', POST_ID )
		).toBe( false );

		await registry
			.resolveSelect( coreDataStore )
			.getAutosave( 'post', POST_ID, AUTHOR_ID );

		expect(
			registry
				.select( coreDataStore )
				.hasFetchedAutosaves( 'post', POST_ID )
		).toBe( true );

		expect(
			registry
				.select( coreDataStore )
				.getAutosave( 'post', POST_ID, AUTHOR_ID )
		).toEqual( AUTOSAVE );
	} );

	it( 'reports hasFetchedAutosaves even when the author has no autosave', async () => {
		const registry = createTestRegistry();
		mockFetch( [] );

		await registry
			.resolveSelect( coreDataStore )
			.getAutosave( 'post', POST_ID, AUTHOR_ID );

		expect(
			registry
				.select( coreDataStore )
				.hasFetchedAutosaves( 'post', POST_ID )
		).toBe( true );
		expect(
			registry
				.select( coreDataStore )
				.getAutosave( 'post', POST_ID, AUTHOR_ID )
		).toBeUndefined();
	} );

	it( 'requests only the given author’s autosave', async () => {
		const registry = createTestRegistry();
		mockFetch( [ AUTOSAVE ] );

		await registry
			.resolveSelect( coreDataStore )
			.getAutosave( 'post', POST_ID, AUTHOR_ID );

		expect( triggerFetch ).toHaveBeenCalledWith( {
			path: `/wp/v2/posts/${ POST_ID }/autosaves?context=edit&per_page=1&author=${ AUTHOR_ID }`,
		} );
	} );

	it( 'does not return another author’s autosave', async () => {
		const registry = createTestRegistry();
		mockFetch( [ { id: 100, author: 999, parent: POST_ID } ] );

		await registry
			.resolveSelect( coreDataStore )
			.getAutosave( 'post', POST_ID, AUTHOR_ID );

		expect(
			registry
				.select( coreDataStore )
				.getAutosave( 'post', POST_ID, AUTHOR_ID )
		).toBeUndefined();
	} );
} );
