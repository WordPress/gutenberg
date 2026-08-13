import { attachMediaToCurrentPost } from '../attach-media-to-current-post';

type Registry = Parameters< typeof attachMediaToCurrentPost >[ 1 ];

/**
 * Builds a minimal registry stub capturing the writes the util makes.
 */
function createRegistryStub() {
	const saveEntityRecord = jest.fn().mockResolvedValue( {} );
	const batch = jest.fn().mockResolvedValue( [] );
	const invalidateResolution = jest.fn();

	const registry = {
		select: () => ( {
			getCachedResolvers: () => ( {} ),
		} ),
		dispatch: () => ( {
			saveEntityRecord,
			__experimentalBatch: batch,
			invalidateResolution,
		} ),
	} as unknown as Registry;

	return { registry, saveEntityRecord, batch };
}

/**
 * Sets (or clears) the post ID that `wp_enqueue_media()` exposes.
 *
 * @param postId Post ID, or `undefined` to remove the global entirely.
 */
function setCurrentPostId( postId: number | undefined ) {
	if ( postId === undefined ) {
		delete ( window as unknown as Record< string, unknown > ).wp;
		return;
	}

	( window as unknown as Record< string, unknown > ).wp = {
		media: { view: { settings: { post: { id: postId } } } },
	};
}

describe( 'attachMediaToCurrentPost', () => {
	afterEach( () => {
		setCurrentPostId( undefined );
	} );

	it( 'attaches an unattached REST item to the current post', () => {
		setCurrentPostId( 7 );
		const { registry, saveEntityRecord } = createRegistryStub();

		attachMediaToCurrentPost( { id: 12, post: null }, registry );

		expect( saveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{ id: 12, post: 7 },
			{ throwOnError: true }
		);
	} );

	it( 'attaches an unattached classic-modal item, which reports uploadedTo: 0', () => {
		setCurrentPostId( 7 );
		const { registry, saveEntityRecord } = createRegistryStub();

		attachMediaToCurrentPost( { id: 12, uploadedTo: 0 }, registry );

		expect( saveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{ id: 12, post: 7 },
			{ throwOnError: true }
		);
	} );

	it( 'never steals media already attached to another post', () => {
		setCurrentPostId( 7 );
		const { registry, saveEntityRecord, batch } = createRegistryStub();

		attachMediaToCurrentPost(
			[
				{ id: 12, post: 99 },
				{ id: 13, uploadedTo: 99 },
			],
			registry
		);

		expect( saveEntityRecord ).not.toHaveBeenCalled();
		expect( batch ).not.toHaveBeenCalled();
	} );

	it( 'never guesses when the payload does not report a parent', () => {
		setCurrentPostId( 7 );
		const { registry, saveEntityRecord } = createRegistryStub();

		attachMediaToCurrentPost(
			{ id: 12, url: 'https://e.g/a.jpg' },
			registry
		);

		expect( saveEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'batches a multi-item selection, deduplicated', () => {
		setCurrentPostId( 7 );
		const { registry, saveEntityRecord, batch } = createRegistryStub();

		attachMediaToCurrentPost(
			[
				{ id: 12, post: null },
				{ id: 13, post: null },
				{ id: 13, post: null },
				{ id: 14, post: 99 },
			],
			registry
		);

		expect( saveEntityRecord ).not.toHaveBeenCalled();
		expect( batch ).toHaveBeenCalledTimes( 1 );

		// The batch is described as a list of thunks; run them against a stub to
		// assert on what would be written.
		const save = jest.fn();
		batch.mock.calls[ 0 ][ 0 ].forEach(
			( thunk: ( arg: unknown ) => void ) =>
				thunk( { saveEntityRecord: save } )
		);

		expect( save ).toHaveBeenCalledTimes( 2 );
		expect( save ).toHaveBeenCalledWith( 'postType', 'attachment', {
			id: 12,
			post: 7,
		} );
		expect( save ).toHaveBeenCalledWith( 'postType', 'attachment', {
			id: 13,
			post: 7,
		} );
	} );

	it( 'does nothing outside a post editing screen, where the post ID is 0', () => {
		setCurrentPostId( 0 );
		const { registry, saveEntityRecord } = createRegistryStub();

		attachMediaToCurrentPost( { id: 12, post: null }, registry );

		expect( saveEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'does nothing when wp_enqueue_media() has not run at all', () => {
		const { registry, saveEntityRecord } = createRegistryStub();

		attachMediaToCurrentPost( { id: 12, post: null }, registry );

		expect( saveEntityRecord ).not.toHaveBeenCalled();
	} );
} );
