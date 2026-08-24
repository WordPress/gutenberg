import attachMediaInPost from '../attach-media-in-post';

const mockInvalidate = jest.fn();

jest.mock( '@wordpress/media-utils', () => ( { privateApis: {} } ) );
jest.mock( '../../lock-unlock', () => ( {
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
 * @param {Object[]} [options.blocks] Blocks the post contains.
 * @param {Object[]} [options.media]  Records `getEntityRecords` resolves to.
 */
function createRegistry( { blocks = [], media = [] } = {} ) {
	const getEntityRecords = jest.fn().mockResolvedValue( media );
	const saveEntityRecord = jest.fn().mockResolvedValue( {} );

	const registry = {
		select: () => ( { getBlocks: () => blocks } ),
		resolveSelect: () => ( { getEntityRecords } ),
		dispatch: () => ( { saveEntityRecord } ),
	};

	return { registry, getEntityRecords, saveEntityRecord };
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

		await attachMediaInPost( registry, 7 );

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

		await attachMediaInPost( registry, 7 );

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

		await attachMediaInPost( registry, 7 );

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

		await attachMediaInPost( registry, 7 );

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

		await attachMediaInPost( registry, 7 );

		expect( saveEntityRecord ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'does not invalidate caches when every write fails', async () => {
		const { registry, saveEntityRecord } = createRegistry( {
			blocks: [ imageBlock( 12 ) ],
			media: [ { id: 12, post: null } ],
		} );
		saveEntityRecord.mockRejectedValue( new Error( 'Forbidden' ) );

		await attachMediaInPost( registry, 7 );

		expect( mockInvalidate ).not.toHaveBeenCalled();
	} );
} );
