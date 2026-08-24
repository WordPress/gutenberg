import attachMediaInPost from '../attach-media';

const mockInvalidate = jest.fn();

jest.mock( '@wordpress/media-utils', () => ( { privateApis: {} } ) );
jest.mock( '../../../lock-unlock', () => ( {
	unlock: () => ( {
		invalidateAttachmentResolutions: ( ...args ) =>
			mockInvalidate( ...args ),
	} ),
} ) );

const imageBlock = ( id ) => ( {
	name: 'core/image',
	attributes: { id },
	innerBlocks: [],
} );

/**
 * Builds a registry stub over a set of blocks and the records they resolve to.
 *
 * @param {Object}   options
 * @param {Object[]} [options.blocks]   Blocks the post contains.
 * @param {Object[]} [options.media]    Records `getEntityRecords` resolves to.
 * @param {Object}   [options.postType] What `getPostType` resolves to.
 */
function createRegistry( {
	blocks = [],
	media = [],
	postType = { viewable: true },
} = {} ) {
	const getEntityRecords = jest.fn().mockResolvedValue( media );
	const getPostType = jest.fn().mockResolvedValue( postType );
	const saveEntityRecord = jest.fn().mockResolvedValue( {} );

	const registry = {
		select: () => ( { getBlocks: () => blocks } ),
		resolveSelect: () => ( { getEntityRecords, getPostType } ),
		dispatch: () => ( { saveEntityRecord } ),
	};

	return { registry, getEntityRecords, getPostType, saveEntityRecord };
}

describe( 'attachMediaInPost', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'attaches media that belongs to no post', async () => {
		const { registry, saveEntityRecord } = createRegistry( {
			blocks: [ imageBlock( 12 ) ],
			media: [ { id: 12, post: null } ],
		} );

		await attachMediaInPost( registry, 7, 'post' );

		expect( saveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{ id: 12, post: 7 }
		);
		expect( mockInvalidate ).toHaveBeenCalledWith( registry );
	} );

	it( 'never takes media that already belongs to another post', async () => {
		const { registry, saveEntityRecord } = createRegistry( {
			blocks: [ imageBlock( 12 ) ],
			media: [ { id: 12, post: 99 } ],
		} );

		await attachMediaInPost( registry, 7, 'post' );

		expect( saveEntityRecord ).not.toHaveBeenCalled();
		expect( mockInvalidate ).not.toHaveBeenCalled();
	} );

	it( 'makes no request when the post displays no media', async () => {
		const { registry, getEntityRecords } = createRegistry( {
			blocks: [
				{
					name: 'core/paragraph',
					attributes: {},
					innerBlocks: [],
				},
			],
		} );

		await attachMediaInPost( registry, 7, 'post' );

		expect( getEntityRecords ).not.toHaveBeenCalled();
	} );

	it( 'ignores numeric attributes on blocks that are not media', async () => {
		const { registry, getEntityRecords } = createRegistry( {
			// `ref` is a synced pattern, not an attachment.
			blocks: [
				{
					name: 'core/block',
					attributes: { ref: 12 },
					innerBlocks: [],
				},
			],
		} );

		await attachMediaInPost( registry, 7, 'post' );

		expect( getEntityRecords ).not.toHaveBeenCalled();
	} );

	it( 'finds images nested inside a gallery', async () => {
		const { registry, saveEntityRecord } = createRegistry( {
			blocks: [
				{
					name: 'core/gallery',
					attributes: {},
					innerBlocks: [ imageBlock( 12 ), imageBlock( 13 ) ],
				},
			],
			media: [
				{ id: 12, post: null },
				{ id: 13, post: null },
			],
		} );

		await attachMediaInPost( registry, 7, 'post' );

		expect( saveEntityRecord ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'does not invalidate caches when every write fails', async () => {
		const { registry, saveEntityRecord } = createRegistry( {
			blocks: [ imageBlock( 12 ) ],
			media: [ { id: 12, post: null } ],
		} );
		saveEntityRecord.mockRejectedValue( new Error( 'Forbidden' ) );

		await attachMediaInPost( registry, 7, 'post' );

		expect( mockInvalidate ).not.toHaveBeenCalled();
	} );
	/**
	 * `savePost` handles templates as well as posts. A template has no front end
	 * of its own and backs many posts, so "uploaded to" pointing at one says
	 * nothing useful.
	 */
	it( 'attaches nothing for a post type with no front end', async () => {
		const { registry, getEntityRecords, saveEntityRecord } = createRegistry(
			{
				blocks: [ imageBlock( 12 ) ],
				media: [ { id: 12, post: null } ],
				postType: { viewable: false },
			}
		);

		await attachMediaInPost( registry, 7, 'wp_template' );

		expect( getEntityRecords ).not.toHaveBeenCalled();
		expect( saveEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'does not look up the post type when the post has no media', async () => {
		const { registry, getPostType } = createRegistry( {
			blocks: [
				{ name: 'core/paragraph', attributes: {}, innerBlocks: [] },
			],
		} );

		await attachMediaInPost( registry, 7, 'post' );

		expect( getPostType ).not.toHaveBeenCalled();
	} );
	/**
	 * A synced pattern's blocks are controlled inner blocks, so they sit in this
	 * post's tree without being this post's content. The pattern may be used on
	 * many posts, and whichever saved first would claim the file permanently.
	 */
	it( 'does not claim media inside a synced pattern', async () => {
		const { registry, getEntityRecords } = createRegistry( {
			blocks: [
				{
					name: 'core/block',
					attributes: { ref: 5 },
					innerBlocks: [ imageBlock( 12 ) ],
				},
			],
		} );

		await attachMediaInPost( registry, 7, 'post' );

		expect( getEntityRecords ).not.toHaveBeenCalled();
	} );

	it( 'does not claim media inside a template part', async () => {
		const { registry, getEntityRecords } = createRegistry( {
			blocks: [
				{
					name: 'core/template-part',
					attributes: { slug: 'header' },
					innerBlocks: [ imageBlock( 12 ) ],
				},
			],
		} );

		await attachMediaInPost( registry, 7, 'post' );

		expect( getEntityRecords ).not.toHaveBeenCalled();
	} );

	it( 'still walks into ordinary container blocks', async () => {
		const { registry, saveEntityRecord } = createRegistry( {
			blocks: [
				{
					name: 'core/group',
					attributes: {},
					innerBlocks: [ imageBlock( 12 ) ],
				},
			],
			media: [ { id: 12, post: null } ],
		} );

		await attachMediaInPost( registry, 7, 'post' );

		expect( saveEntityRecord ).toHaveBeenCalledTimes( 1 );
	} );
} );
