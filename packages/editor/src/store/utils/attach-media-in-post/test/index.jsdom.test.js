import attachMediaInPost from '..';

const mockInvalidate = jest.fn();

jest.mock( '../invalidate-attachment-resolutions', () => ( {
	__esModule: true,
	default: ( ...args ) => mockInvalidate( ...args ),
} ) );

const imageBlock = ( id ) => ( {
	name: 'core/image',
	attributes: { id },
	innerBlocks: [],
} );

/**
 * Builds a registry stub over the records the post's media resolves to.
 *
 * Blocks are not in here: they are passed to `attachMediaInPost` as part of the
 * post, precisely so this cannot read the canvas by accident.
 *
 * @param {Object}   options
 * @param {Object[]} [options.media]    Records `getEntityRecords` resolves to.
 * @param {Object}   [options.postType] What `getPostType` resolves to.
 */
function createRegistry( { media = [], postType = { viewable: true } } = {} ) {
	const getEntityRecords = jest.fn().mockResolvedValue( media );
	const getPostType = jest.fn().mockResolvedValue( postType );
	const saveEntityRecord = jest.fn().mockResolvedValue( {} );

	const registry = {
		select: () => ( {} ),
		resolveSelect: () => ( { getEntityRecords, getPostType } ),
		dispatch: () => ( { saveEntityRecord } ),
	};

	return { registry, getEntityRecords, getPostType, saveEntityRecord };
}

/**
 * The post being saved, with whatever blocks the case needs.
 *
 * @param {Object[]} blocks The post's own blocks.
 */
const post = ( blocks ) => ( { id: 7, type: 'post', blocks } );

describe( 'attachMediaInPost', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'attaches media that belongs to no post', async () => {
		const { registry, saveEntityRecord } = createRegistry( {
			media: [ { id: 12, post: null } ],
		} );

		await attachMediaInPost( registry, post( [ imageBlock( 12 ) ] ) );

		expect( saveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			{ id: 12, post: 7 }
		);
		expect( mockInvalidate ).toHaveBeenCalledWith( registry );
	} );

	it( 'never takes media that already belongs to another post', async () => {
		const { registry, saveEntityRecord } = createRegistry( {
			media: [ { id: 12, post: 99 } ],
		} );

		await attachMediaInPost( registry, post( [ imageBlock( 12 ) ] ) );

		expect( saveEntityRecord ).not.toHaveBeenCalled();
		expect( mockInvalidate ).not.toHaveBeenCalled();
	} );

	it( 'makes no request when the post displays no media', async () => {
		const { registry, getEntityRecords } = createRegistry();

		await attachMediaInPost(
			registry,
			post( [
				{ name: 'core/paragraph', attributes: {}, innerBlocks: [] },
			] )
		);

		expect( getEntityRecords ).not.toHaveBeenCalled();
	} );

	it( 'ignores numeric attributes on blocks that are not media', async () => {
		const { registry, getEntityRecords } = createRegistry();

		// `ref` is a synced pattern, not an attachment.
		await attachMediaInPost(
			registry,
			post( [
				{
					name: 'core/block',
					attributes: { ref: 12 },
					innerBlocks: [],
				},
			] )
		);

		expect( getEntityRecords ).not.toHaveBeenCalled();
	} );

	/**
	 * The query cache keys on `include` as given, so a stable order means
	 * reordering blocks doesn't refetch a set already in the cache.
	 */
	it( 'asks for the media in a stable order regardless of block order', async () => {
		const { registry, getEntityRecords } = createRegistry();

		await attachMediaInPost(
			registry,
			post( [ imageBlock( 13 ), imageBlock( 12 ) ] )
		);

		expect( getEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			expect.objectContaining( { include: [ 12, 13 ] } )
		);
	} );

	it( 'finds images nested inside a gallery', async () => {
		const { registry, saveEntityRecord } = createRegistry( {
			media: [
				{ id: 12, post: null },
				{ id: 13, post: null },
			],
		} );

		await attachMediaInPost(
			registry,
			post( [
				{
					name: 'core/gallery',
					attributes: {},
					innerBlocks: [ imageBlock( 12 ), imageBlock( 13 ) ],
				},
			] )
		);

		expect( saveEntityRecord ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'does not invalidate caches when every write fails', async () => {
		const { registry, saveEntityRecord } = createRegistry( {
			media: [ { id: 12, post: null } ],
		} );
		saveEntityRecord.mockRejectedValue( new Error( 'Forbidden' ) );

		await attachMediaInPost( registry, post( [ imageBlock( 12 ) ] ) );

		expect( mockInvalidate ).not.toHaveBeenCalled();
		expect( console ).toHaveWarned();
	} );

	/**
	 * A lookup rejects whenever its request fails, and nothing awaits this
	 * function, so anything escaping it becomes an unhandled rejection.
	 */
	it( 'never rejects when a lookup fails', async () => {
		const { registry, getEntityRecords } = createRegistry();
		getEntityRecords.mockRejectedValue( { code: 'rest_forbidden' } );

		await expect(
			attachMediaInPost( registry, post( [ imageBlock( 12 ) ] ) )
		).resolves.toBeUndefined();
		expect( console ).toHaveWarned();
	} );

	/**
	 * Silent to the user is the design; silent to whoever is debugging it is
	 * not. Writing to media somebody else uploaded needs `edit_others_posts`,
	 * which authors and contributors don't have, so a 403 here is expected.
	 */
	it( 'logs a failed write without interpolating the reason', async () => {
		const { registry, saveEntityRecord } = createRegistry( {
			media: [ { id: 12, post: null } ],
		} );
		// A rejected `apiFetch` is often a plain object, not an `Error`.
		const reason = { code: 'rest_forbidden', message: 'Sorry.' };
		saveEntityRecord.mockRejectedValue( reason );

		await attachMediaInPost( registry, post( [ imageBlock( 12 ) ] ) );

		expect( console ).toHaveWarnedWith(
			'Could not attach media to the post.',
			reason
		);
	} );

	/**
	 * `savePost` handles templates as well as posts. A template has no front end
	 * of its own and backs many posts, so "uploaded to" pointing at one says
	 * nothing useful.
	 */
	it( 'attaches nothing for a post type with no front end', async () => {
		const { registry, getEntityRecords, saveEntityRecord } = createRegistry(
			{
				media: [ { id: 12, post: null } ],
				postType: { viewable: false },
			}
		);

		await attachMediaInPost( registry, {
			id: 7,
			type: 'wp_template',
			blocks: [ imageBlock( 12 ) ],
		} );

		expect( getEntityRecords ).not.toHaveBeenCalled();
		expect( saveEntityRecord ).not.toHaveBeenCalled();
	} );

	/**
	 * Somebody will put a thousand images in a post one day. Attaching them
	 * would mean a thousand requests at once, for a background convenience.
	 */
	it( 'attaches nothing when the post has too many images', async () => {
		const { registry, getEntityRecords } = createRegistry();
		const tooMany = Array.from( { length: 101 }, ( _, index ) =>
			imageBlock( index + 1 )
		);

		await attachMediaInPost( registry, post( tooMany ) );

		expect( getEntityRecords ).not.toHaveBeenCalled();
		expect( console ).toHaveWarned();
	} );

	it( 'still attaches right up to the limit', async () => {
		const atLimit = Array.from( { length: 100 }, ( _, index ) =>
			imageBlock( index + 1 )
		);
		const { registry, getEntityRecords } = createRegistry( {
			media: [ { id: 1, post: null } ],
		} );

		await attachMediaInPost( registry, post( atLimit ) );

		expect( getEntityRecords ).toHaveBeenCalled();
	} );

	it( 'does not look up the post type when the post has no media', async () => {
		const { registry, getPostType } = createRegistry();

		await attachMediaInPost( registry, post( [] ) );

		expect( getPostType ).not.toHaveBeenCalled();
	} );

	/**
	 * A synced pattern's blocks are controlled inner blocks, so they sit in this
	 * post's tree without being this post's content. The pattern may be used on
	 * many posts, and whichever saved first would claim the file permanently.
	 */
	it( 'does not claim media inside a synced pattern', async () => {
		const { registry, getEntityRecords } = createRegistry();

		await attachMediaInPost(
			registry,
			post( [
				{
					name: 'core/block',
					attributes: { ref: 5 },
					innerBlocks: [ imageBlock( 12 ) ],
				},
			] )
		);

		expect( getEntityRecords ).not.toHaveBeenCalled();
	} );

	it( 'does not claim media inside a template part', async () => {
		const { registry, getEntityRecords } = createRegistry();

		await attachMediaInPost(
			registry,
			post( [
				{
					name: 'core/template-part',
					attributes: { slug: 'header' },
					innerBlocks: [ imageBlock( 12 ) ],
				},
			] )
		);

		expect( getEntityRecords ).not.toHaveBeenCalled();
	} );

	it( 'still walks into ordinary container blocks', async () => {
		const { registry, saveEntityRecord } = createRegistry( {
			media: [ { id: 12, post: null } ],
		} );

		await attachMediaInPost(
			registry,
			post( [
				{
					name: 'core/group',
					attributes: {},
					innerBlocks: [ imageBlock( 12 ) ],
				},
			] )
		);

		expect( saveEntityRecord ).toHaveBeenCalledTimes( 1 );
	} );
} );
