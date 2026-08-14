import triggerFetch from '@wordpress/api-fetch';
import { createRegistry } from '@wordpress/data';
import { store as coreDataStore } from '../index';

jest.mock( '@wordpress/api-fetch' );

describe( 'autosaves', () => {
	const AUTHOR_ID = 7;
	const OTHER_AUTHOR_ID = 999;
	const POST_ID = 1;
	const AUTOSAVE = { id: 99, author: AUTHOR_ID, parent: POST_ID };
	const OTHER_AUTOSAVE = {
		id: 100,
		author: OTHER_AUTHOR_ID,
		parent: POST_ID,
	};

	const POST_TYPE = {
		slug: 'post',
		rest_base: 'posts',
		rest_namespace: 'wp/v2',
		supports: { autosave: true },
	};

	/**
	 * `getAutosave` resolves the post type first, which routes through
	 * `getEntityRecord` and expects an unparsed response. Everything else is
	 * served by `getAutosaves`.
	 *
	 * @param {Function} getAutosaves Called with the requested path, returns the
	 *                                autosaves collection to serve.
	 */
	const mockFetch = ( getAutosaves ) => {
		triggerFetch.mockImplementation( ( { path, parse } ) => {
			if ( path.startsWith( '/wp/v2/types' ) ) {
				if ( parse === false ) {
					return {
						json: async () => POST_TYPE,
						headers: { get: () => '' },
					};
				}

				return POST_TYPE;
			}

			return getAutosaves( path );
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
	 * `isEditedPostAutosaveable` in `@wordpress/editor` treats an unfinished
	 * resolution as "not yet known" and refuses to autosave until it completes,
	 * so the selector it reads has to track the request the editor actually
	 * makes. These drive a real registry rather than asserting on a mocked
	 * dispatch, so they cover resolution end to end.
	 */
	it( 'reports hasFetchedAutosave once getAutosave has resolved', async () => {
		const registry = createTestRegistry();
		mockFetch( () => [ AUTOSAVE ] );

		expect(
			registry
				.select( coreDataStore )
				.hasFetchedAutosave( 'post', POST_ID, AUTHOR_ID )
		).toBe( false );

		await registry
			.resolveSelect( coreDataStore )
			.getAutosave( 'post', POST_ID, AUTHOR_ID );

		expect(
			registry
				.select( coreDataStore )
				.hasFetchedAutosave( 'post', POST_ID, AUTHOR_ID )
		).toBe( true );

		expect(
			registry
				.select( coreDataStore )
				.getAutosave( 'post', POST_ID, AUTHOR_ID )
		).toEqual( AUTOSAVE );
	} );

	it( 'reports hasFetchedAutosave even when the author has no autosave', async () => {
		const registry = createTestRegistry();
		mockFetch( () => [] );

		await registry
			.resolveSelect( coreDataStore )
			.getAutosave( 'post', POST_ID, AUTHOR_ID );

		expect(
			registry
				.select( coreDataStore )
				.hasFetchedAutosave( 'post', POST_ID, AUTHOR_ID )
		).toBe( true );
		expect(
			registry
				.select( coreDataStore )
				.getAutosave( 'post', POST_ID, AUTHOR_ID )
		).toBeUndefined();
	} );

	it( 'requests only the given author’s autosave', async () => {
		const registry = createTestRegistry();
		mockFetch( () => [ AUTOSAVE ] );

		await registry
			.resolveSelect( coreDataStore )
			.getAutosave( 'post', POST_ID, AUTHOR_ID );

		expect( triggerFetch ).toHaveBeenCalledWith( {
			path: `/wp/v2/posts/${ POST_ID }/autosaves?context=edit&author=${ AUTHOR_ID }`,
		} );
	} );

	// A single network failure must not disable autosaving for the rest of the
	// session. `hasFinishedResolution` counts an errored resolution as finished,
	// so this holds without the resolver reporting completion itself.
	it( 'reports hasFetchedAutosave after a failed request', async () => {
		const registry = createTestRegistry();
		mockFetch( () => {
			throw new Error( 'Network error' );
		} );

		await registry
			.resolveSelect( coreDataStore )
			.getAutosave( 'post', POST_ID, AUTHOR_ID )
			.catch( () => {} );

		expect(
			registry
				.select( coreDataStore )
				.hasFetchedAutosave( 'post', POST_ID, AUTHOR_ID )
		).toBe( true );
	} );

	// Nothing was requested, so nothing is known yet. Reporting this as fetched
	// would let `isEditedPostAutosaveable` conclude there is no existing
	// autosave before the current user has loaded.
	it( 'does not report hasFetchedAutosave when the author is not yet known', async () => {
		const registry = createTestRegistry();
		mockFetch( () => [ AUTOSAVE ] );

		await registry
			.resolveSelect( coreDataStore )
			.getAutosave( 'post', POST_ID, undefined );

		expect( triggerFetch ).not.toHaveBeenCalled();
		expect(
			registry
				.select( coreDataStore )
				.hasFetchedAutosave( 'post', POST_ID, undefined )
		).toBe( false );
	} );

	it( 'does not return another author’s autosave', async () => {
		const registry = createTestRegistry();
		mockFetch( () => [ OTHER_AUTOSAVE ] );

		await registry
			.resolveSelect( coreDataStore )
			.getAutosave( 'post', POST_ID, AUTHOR_ID );

		expect(
			registry
				.select( coreDataStore )
				.getAutosave( 'post', POST_ID, AUTHOR_ID )
		).toBeUndefined();
	} );

	// `getAutosave` fetches one author's record, which is not the collection.
	// Marking the collection resolved off the back of it would hand
	// `getAutosaves` callers a single row and never refetch.
	it( 'leaves the getAutosaves collection unresolved', async () => {
		const registry = createTestRegistry();
		mockFetch( ( path ) =>
			path.includes( 'author=' )
				? [ AUTOSAVE ]
				: [ AUTOSAVE, OTHER_AUTOSAVE ]
		);

		await registry
			.resolveSelect( coreDataStore )
			.getAutosave( 'post', POST_ID, AUTHOR_ID );

		expect(
			registry
				.select( coreDataStore )
				.hasFetchedAutosaves( 'post', POST_ID )
		).toBe( false );

		await registry
			.resolveSelect( coreDataStore )
			.getAutosaves( 'post', POST_ID );

		expect(
			registry.select( coreDataStore ).getAutosaves( 'post', POST_ID )
		).toEqual( [ AUTOSAVE, OTHER_AUTOSAVE ] );
	} );

	// The two resolvers write to the same state, with different scopes. A
	// single-author response arriving second must not truncate the collection.
	it( 'does not truncate a fetched collection when one author resolves', async () => {
		const registry = createTestRegistry();
		const UPDATED = { ...AUTOSAVE, title: { raw: 'Updated' } };
		mockFetch( ( path ) =>
			path.includes( 'author=' )
				? [ UPDATED ]
				: [ AUTOSAVE, OTHER_AUTOSAVE ]
		);

		await registry
			.resolveSelect( coreDataStore )
			.getAutosaves( 'post', POST_ID );
		await registry
			.resolveSelect( coreDataStore )
			.getAutosave( 'post', POST_ID, AUTHOR_ID );

		expect(
			registry
				.select( coreDataStore )
				.getAutosave( 'post', POST_ID, OTHER_AUTHOR_ID )
		).toEqual( OTHER_AUTOSAVE );
		expect(
			registry
				.select( coreDataStore )
				.getAutosave( 'post', POST_ID, AUTHOR_ID )
		).toEqual( UPDATED );
	} );
} );
