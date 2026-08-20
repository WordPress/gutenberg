import { renderHook } from '@testing-library/react';
import useMarkMediaForAttachment from '../use-mark-media-for-attachment';

const mockRegistry = {
	resolveSelect: jest.fn(),
	dispatch: jest.fn(),
};

// Both mocked down to what the hook uses. Spreading the real modules pulls the
// whole data layer in, which the store registration then trips over.
jest.mock( '@wordpress/data', () => ( {
	useRegistry: () => mockRegistry,
} ) );

jest.mock( '@wordpress/core-data', () => ( { store: 'core' } ) );

/**
 * Wires the registry stubs and returns the spies worth asserting on.
 *
 * @param {Object}  options
 * @param {Object}  [options.postTypeObject] What `getPostType` resolves to.
 * @param {Object}  [options.record]         What `getEntityRecord` resolves to.
 * @param {string}  [options.postStatus]     Saved status of the post being edited.
 * @param {boolean} [options.canUpdate]      What `canUser` resolves to.
 */
function setupRegistry( {
	postTypeObject = { viewable: true },
	record = { id: 12, post: null },
	postStatus = 'publish',
	canUpdate = true,
} = {} ) {
	const getPostType = jest.fn().mockResolvedValue( postTypeObject );
	// The hook resolves the parent post first, to check it is already live, then
	// the attachment.
	const getEntityRecord = jest
		.fn()
		.mockImplementation( ( kind, name ) =>
			Promise.resolve(
				name === 'attachment' ? record : { status: postStatus }
			)
		);
	const canUser = jest.fn().mockResolvedValue( canUpdate );
	const editEntityRecord = jest.fn();

	mockRegistry.resolveSelect.mockReturnValue( {
		getPostType,
		getEntityRecord,
		canUser,
	} );
	mockRegistry.dispatch.mockReturnValue( { editEntityRecord } );

	return { getPostType, getEntityRecord, canUser, editEntityRecord };
}

const POST_CONTEXT = { postId: 7, postType: 'post' };

describe( 'useMarkMediaForAttachment', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'records a pending attach for unattached media', async () => {
		const { editEntityRecord } = setupRegistry();
		const { result } = renderHook( () =>
			useMarkMediaForAttachment( POST_CONTEXT )
		);

		await result.current( { id: 12, post: null } );

		expect( editEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			12,
			{ post: 7 },
			{ undoIgnore: true }
		);
	} );

	it( 'skips media the payload reports as attached elsewhere, without a request', async () => {
		const { getEntityRecord, editEntityRecord } = setupRegistry();
		const { result } = renderHook( () =>
			useMarkMediaForAttachment( POST_CONTEXT )
		);

		await result.current( [
			{ id: 12, post: 99 },
			{ id: 13, uploadedTo: 99 },
		] );

		expect( getEntityRecord ).not.toHaveBeenCalled();
		expect( editEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'resolves the record when the payload omits the parent, and never steals', async () => {
		const { getEntityRecord, editEntityRecord } = setupRegistry( {
			record: { id: 12, post: 99 },
		} );
		const { result } = renderHook( () =>
			useMarkMediaForAttachment( POST_CONTEXT )
		);

		// `slimImageObject` strips `uploadedTo` on the classic modal's gallery
		// path, so the parent has to come from the resolved record.
		await result.current( { id: 12, url: 'https://e.g/a.jpg' } );

		expect( getEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			12
		);
		expect( editEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'does nothing inside a Query Loop, where postId is a looped post', async () => {
		const { getPostType, editEntityRecord } = setupRegistry();
		const { result } = renderHook( () =>
			useMarkMediaForAttachment( { ...POST_CONTEXT, queryId: 3 } )
		);

		await result.current( { id: 12, post: null } );

		expect( getPostType ).not.toHaveBeenCalled();
		expect( editEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'does nothing without a post ID, which is how templates present', async () => {
		const { getPostType, editEntityRecord } = setupRegistry();
		const { result } = renderHook( () =>
			useMarkMediaForAttachment( { postType: 'wp_template' } )
		);

		await result.current( { id: 12, post: null } );

		expect( getPostType ).not.toHaveBeenCalled();
		expect( editEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'does nothing for a post type with no front end', async () => {
		const { editEntityRecord } = setupRegistry( {
			postTypeObject: { viewable: false },
		} );
		const { result } = renderHook( () =>
			useMarkMediaForAttachment( POST_CONTEXT )
		);

		await result.current( { id: 12, post: null } );

		expect( editEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'does nothing when the user cannot edit the attachment', async () => {
		const { editEntityRecord } = setupRegistry( { canUpdate: false } );
		const { result } = renderHook( () =>
			useMarkMediaForAttachment( POST_CONTEXT )
		);

		await result.current( { id: 12, post: null } );

		expect( editEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'deduplicates a multi-item selection', async () => {
		const { editEntityRecord } = setupRegistry();
		const { result } = renderHook( () =>
			useMarkMediaForAttachment( POST_CONTEXT )
		);

		await result.current( [
			{ id: 12, post: null },
			{ id: 12, post: null },
		] );

		expect( editEntityRecord ).toHaveBeenCalledTimes( 1 );
	} );
	it( 'does nothing while the post is still a draft, where the pre-publish review derives its own list', async () => {
		const { editEntityRecord } = setupRegistry( { postStatus: 'draft' } );
		const { result } = renderHook( () =>
			useMarkMediaForAttachment( POST_CONTEXT )
		);

		await result.current( { id: 12, post: null } );

		expect( editEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'records a pending attach on a private post, which is also live', async () => {
		const { editEntityRecord } = setupRegistry( { postStatus: 'private' } );
		const { result } = renderHook( () =>
			useMarkMediaForAttachment( POST_CONTEXT )
		);

		await result.current( { id: 12, post: null } );

		expect( editEntityRecord ).toHaveBeenCalled();
	} );
} );
