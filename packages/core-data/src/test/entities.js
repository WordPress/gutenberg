/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import {
	parse,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '../sync', () => ( {
	...jest.requireActual( '../sync' ),
	getSyncManager: jest.fn(),
} ) );
jest.mock( '../utils/crdt', () => ( {
	...jest.requireActual( '../utils/crdt' ),
	applyPostChangesToCRDTDoc: jest.fn(),
} ) );

/**
 * Internal dependencies
 */
import {
	getMethodName,
	rootEntitiesConfig,
	prePersistPostType,
	additionalEntityConfigLoaders,
} from '../entities';
import { getSyncManager } from '../sync';
import {
	applyPostChangesToCRDTDoc,
	POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE,
} from '../utils/crdt';

const TEST_BLOCK_NAME = 'test/stale-content-block';

function paragraphMarkup( content ) {
	return `<!-- wp:${ TEST_BLOCK_NAME } ${ JSON.stringify( {
		content,
	} ) } /-->`;
}

function pageContent( contents ) {
	return contents.map( paragraphMarkup ).join( '\n\n' );
}

describe( 'getMethodName', () => {
	it( 'should return the right method name for an entity with the root kind', () => {
		const methodName = getMethodName( 'root', 'postType' );

		expect( methodName ).toEqual( 'getPostType' );
	} );

	it( 'should use a different suffix', () => {
		const methodName = getMethodName( 'root', 'postType', 'set' );

		expect( methodName ).toEqual( 'setPostType' );
	} );

	it( 'should use the given plural form', () => {
		const methodName = getMethodName( 'root', 'taxonomies', 'get' );

		expect( methodName ).toEqual( 'getTaxonomies' );
	} );

	it( 'should include the kind in the method name', () => {
		const id = rootEntitiesConfig.length;
		rootEntitiesConfig[ id ] = { name: 'book', kind: 'postType' };
		const methodName = getMethodName( 'postType', 'book' );
		delete rootEntitiesConfig[ id ];

		expect( methodName ).toEqual( 'getPostTypeBook' );
	} );
} );

describe( 'prePersistPostType', () => {
	let originalCollaborationEnabled;

	beforeAll( () => {
		registerBlockType( TEST_BLOCK_NAME, {
			apiVersion: 3,
			title: 'Stale content test block',
			category: 'text',
			attributes: {
				content: {
					type: 'string',
				},
			},
			save: () => null,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( TEST_BLOCK_NAME );
	} );

	beforeEach( () => {
		apiFetch.mockReset();
		getSyncManager.mockReset();
		originalCollaborationEnabled = window._wpCollaborationEnabled;
	} );

	afterEach( () => {
		window._wpCollaborationEnabled = originalCollaborationEnabled;
	} );

	it( 'set the status to draft and empty the title when saving auto-draft posts', async () => {
		let record = {
			status: 'auto-draft',
		};
		const edits = {};
		expect(
			await prePersistPostType( record, edits, 'post', false )
		).toEqual( {
			status: 'draft',
			title: '',
		} );

		record = {
			status: 'publish',
		};
		expect(
			await prePersistPostType( record, edits, 'post', false )
		).toEqual( {} );

		record = {
			status: 'auto-draft',
			title: 'Auto Draft',
		};
		expect(
			await prePersistPostType( record, edits, 'post', false )
		).toEqual( {
			status: 'draft',
			title: '',
		} );

		record = {
			status: 'publish',
			title: 'My Title',
		};
		expect(
			await prePersistPostType( record, edits, 'post', false )
		).toEqual( {} );
	} );

	it( 'does not set the status to draft and empty the title when saving templates', async () => {
		const record = {
			status: 'auto-draft',
			title: 'Auto Draft',
		};
		const edits = {};
		expect(
			await prePersistPostType( record, edits, 'post', true )
		).toEqual( {} );
	} );

	it( 'adds meta with serialized CRDT doc when createPersistedCRDTDoc returns a value', async () => {
		const mockSerializedDoc = 'serialized-crdt-doc-data';
		getSyncManager.mockReturnValue( {
			createPersistedCRDTDoc: jest
				.fn()
				.mockReturnValue( mockSerializedDoc ),
		} );

		const basePersistedCRDTDoc = 'base-crdt-doc-data';
		const record = {
			id: 123,
			status: 'publish',
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]:
					basePersistedCRDTDoc,
			},
		};
		const edits = {};
		const result = await prePersistPostType( record, edits, 'post', false );

		expect( result.meta ).toEqual( {
			[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: mockSerializedDoc,
		} );

		expect( getSyncManager ).toHaveBeenCalled();
		expect( getSyncManager().createPersistedCRDTDoc ).toHaveBeenCalledWith(
			'postType/post',
			123,
			{ basePersistedCRDTDoc }
		);

		getSyncManager.mockReset();
	} );

	it( 'snapshots saved content into the CRDT before serializing from the latest persisted document', async () => {
		const baseContent = pageContent( [ 'Alpha' ] );
		const savedContent = pageContent( [ 'Alpha', 'checkpoint paragraph' ] );
		const latestRecord = {
			id: 123,
			content: { raw: baseContent },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( false ),
			createPersistedCRDTDoc: jest
				.fn()
				.mockResolvedValueOnce( 'stale-before-snapshot-doc' )
				.mockResolvedValueOnce( 'snapshot-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				content: baseContent,
			} ) ),
			update: jest.fn(),
		};
		apiFetch.mockResolvedValue( latestRecord );
		getSyncManager.mockReturnValue( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				content: { raw: baseContent },
				meta: {
					[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'base-doc',
				},
			},
			{ content: savedContent },
			'page',
			false,
			'/wp/v2/pages'
		);

		expect( syncManager.update ).toHaveBeenNthCalledWith(
			1,
			'postType/page',
			123,
			expect.objectContaining( {
				content: savedContent,
				blocks: expect.any( Array ),
			} ),
			'gutenberg-undo-ignored',
			{
				baseRecord: expect.objectContaining( {
					...latestRecord,
					blocks: expect.any( Array ),
				} ),
			}
		);
		expect( syncManager.update ).toHaveBeenNthCalledWith(
			2,
			'postType/page',
			123,
			{},
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
		expect(
			syncManager.update.mock.calls[ 0 ][ 2 ].blocks.map(
				( block ) => block.attributes.content
			)
		).toEqual( [ 'Alpha', 'checkpoint paragraph' ] );
		expect(
			syncManager.update.mock.calls[ 0 ][ 4 ].baseRecord.blocks.map(
				( block ) => block.attributes.content
			)
		).toEqual( [ 'Alpha' ] );
		expect( syncManager.createPersistedCRDTDoc ).toHaveBeenLastCalledWith(
			'postType/page',
			123,
			{
				basePersistedCRDTDoc: 'latest-doc',
				baseRecordSnapshot: { content: baseContent },
				recordSnapshot: { content: savedContent },
			}
		);
		expect( result ).toEqual( {
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'snapshot-doc',
			},
		} );
	} );

	it( 'reuses current CRDT block client IDs when snapshotting saved content', async () => {
		const baseContent = pageContent( [ 'Alpha' ] );
		const savedContent = pageContent( [ 'Alpha', 'checkpoint paragraph' ] );
		const currentBlocks = parse( savedContent );
		const latestRecord = {
			id: 123,
			content: { raw: baseContent },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( false ),
			createPersistedCRDTDoc: jest
				.fn()
				.mockResolvedValueOnce( 'stale-before-snapshot-doc' )
				.mockResolvedValueOnce( 'snapshot-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				blocks: currentBlocks,
				content: savedContent,
			} ) ),
			update: jest.fn(),
		};
		apiFetch.mockResolvedValue( latestRecord );
		getSyncManager.mockReturnValue( syncManager );
		window._wpCollaborationEnabled = true;

		await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				content: { raw: baseContent },
				meta: {
					[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'base-doc',
				},
			},
			{ content: savedContent },
			'page',
			false,
			'/wp/v2/pages'
		);

		expect(
			syncManager.update.mock.calls[ 0 ][ 2 ].blocks.map(
				( block ) => block.clientId
			)
		).toEqual( currentBlocks.map( ( block ) => block.clientId ) );
		expect( syncManager.update.mock.calls[ 0 ][ 4 ].baseRecord ).toEqual(
			expect.objectContaining( {
				blocks: currentBlocks,
			} )
		);
		expect( syncManager.update ).toHaveBeenNthCalledWith(
			2,
			'postType/page',
			123,
			{},
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
	} );

	it( 'snapshots recordSnapshot content into the CRDT even when content is not part of the save edits', async () => {
		const baseContent = pageContent( [ 'Base content' ] );
		const staleContent = pageContent( [
			'Live content',
			'Duplicate stale content',
		] );
		const savedContent = pageContent( [ 'Live content' ] );
		const staleBlocks = parse( staleContent );
		const syncManager = {
			createPersistedCRDTDoc: jest
				.fn()
				.mockResolvedValue( 'snapshot-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				blocks: staleBlocks,
				content: staleContent,
			} ) ),
			update: jest.fn(),
		};
		getSyncManager.mockReturnValue( syncManager );

		await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				content: { raw: baseContent },
				meta: {
					[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'base-doc',
				},
			},
			{
				meta: {
					[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'base-doc',
				},
			},
			'page',
			false,
			'/wp/v2/pages',
			{
				recordSnapshot: { content: savedContent },
			}
		);

		expect( syncManager.update ).toHaveBeenNthCalledWith(
			1,
			'postType/page',
			123,
			expect.objectContaining( {
				content: savedContent,
				blocks: expect.any( Array ),
			} ),
			'gutenberg-undo-ignored',
			{ baseRecord: expect.objectContaining( { blocks: staleBlocks } ) }
		);
		expect(
			syncManager.update.mock.calls[ 0 ][ 2 ].blocks.map(
				( block ) => block.attributes.content
			)
		).toEqual( [ 'Live content' ] );
		expect( syncManager.update ).toHaveBeenNthCalledWith(
			2,
			'postType/page',
			123,
			{},
			'gutenberg-undo-ignored',
			{ isSave: true }
		);
	} );

	it( 'passes title, excerpt, and content snapshots when serializing a persisted CRDT document', async () => {
		const syncManager = {
			createPersistedCRDTDoc: jest
				.fn()
				.mockResolvedValue( 'snapshot-doc' ),
		};
		getSyncManager.mockReturnValue( syncManager );

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				title: { raw: 'Base title' },
				excerpt: { raw: 'Base excerpt' },
				content: { raw: pageContent( [ 'Base content' ] ) },
				meta: {
					[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'base-doc',
				},
			},
			{
				meta: {
					[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'base-doc',
				},
			},
			'post',
			false,
			'/wp/v2/posts',
			{
				recordSnapshot: {
					title: 'Live title',
					excerpt: { raw: 'Live excerpt' },
					content: pageContent( [ 'Live content' ] ),
				},
			}
		);

		expect( syncManager.createPersistedCRDTDoc ).toHaveBeenCalledWith(
			'postType/post',
			123,
			{
				basePersistedCRDTDoc: 'base-doc',
				baseRecordSnapshot: {
					content: pageContent( [ 'Base content' ] ),
					excerpt: 'Base excerpt',
					title: 'Base title',
				},
				recordSnapshot: {
					content: pageContent( [ 'Live content' ] ),
					excerpt: 'Live excerpt',
					title: 'Live title',
				},
			}
		);
		expect( result ).toEqual( {
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'snapshot-doc',
			},
		} );
	} );

	it( 'merges save edits into persisted CRDT document metadata when recordSnapshot is partial', async () => {
		const syncManager = {
			createPersistedCRDTDoc: jest
				.fn()
				.mockResolvedValue( 'snapshot-doc' ),
		};
		getSyncManager.mockReturnValue( syncManager );

		const savedContent = pageContent( [ 'Live content' ] );

		await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				title: { raw: 'Base title' },
				content: { raw: pageContent( [ 'Base content' ] ) },
				meta: {
					[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'base-doc',
				},
			},
			{
				title: 'Saved title',
				meta: {
					[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'base-doc',
				},
			},
			'post',
			false,
			'/wp/v2/posts',
			{
				recordSnapshot: { content: savedContent },
			}
		);

		expect( syncManager.createPersistedCRDTDoc ).toHaveBeenCalledWith(
			'postType/post',
			123,
			expect.objectContaining( {
				recordSnapshot: {
					content: savedContent,
					title: 'Saved title',
				},
			} )
		);
	} );

	it( 'preserves base record metadata in persisted CRDT document metadata when recordSnapshot is partial', async () => {
		const syncManager = {
			createPersistedCRDTDoc: jest
				.fn()
				.mockResolvedValue( 'snapshot-doc' ),
		};
		getSyncManager.mockReturnValue( syncManager );

		const savedContent = pageContent( [ 'Live content' ] );

		await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				title: { raw: 'Base title' },
				excerpt: { raw: 'Base excerpt' },
				content: { raw: pageContent( [ 'Base content' ] ) },
				meta: {
					[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'base-doc',
				},
			},
			{
				meta: {
					[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'base-doc',
				},
			},
			'post',
			false,
			'/wp/v2/posts',
			{
				recordSnapshot: { content: savedContent },
			}
		);

		expect( syncManager.createPersistedCRDTDoc ).toHaveBeenCalledWith(
			'postType/post',
			123,
			expect.objectContaining( {
				recordSnapshot: {
					content: savedContent,
					excerpt: 'Base excerpt',
					title: 'Base title',
				},
			} )
		);
	} );

	it( 'preserves an explicit local title save when the latest persisted CRDT has an older title', async () => {
		const latestRecord = {
			id: 123,
			title: { raw: 'older CRDT title' },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( true ),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'title-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				title: 'older CRDT title',
			} ) ),
			update: jest.fn(),
		};
		apiFetch.mockResolvedValue( latestRecord );
		getSyncManager.mockReturnValue( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				title: { raw: 'older CRDT title' },
				meta: {
					[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'base-doc',
				},
			},
			{ title: 'local checkpoint title' },
			'page',
			false,
			'/wp/v2/pages'
		);

		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/page',
			123,
			{ title: 'local checkpoint title' },
			'gutenberg-undo-ignored',
			expect.objectContaining( { isSave: true } )
		);
		expect( result ).toEqual( {
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'title-doc',
			},
		} );
	} );

	it( 'snapshots only saved raw fields before serializing the persisted document', async () => {
		const baseContent = pageContent( [ 'Alpha' ] );
		const latestRecord = {
			id: 123,
			title: { raw: 'Base title' },
			content: { raw: baseContent },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( false ),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'title-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				title: 'Base title',
				content: baseContent,
			} ) ),
			update: jest.fn(),
		};
		apiFetch.mockResolvedValue( latestRecord );
		getSyncManager.mockReturnValue( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				title: { raw: 'Base title' },
				content: { raw: baseContent },
				meta: {
					[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'base-doc',
				},
			},
			{ title: 'Checkpoint title' },
			'page',
			false,
			'/wp/v2/pages'
		);

		expect( syncManager.update ).toHaveBeenCalledWith(
			'postType/page',
			123,
			{ title: 'Checkpoint title' },
			'gutenberg-undo-ignored',
			expect.objectContaining( { isSave: true } )
		);
		expect( result ).toEqual( {
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'title-doc',
			},
		} );
	} );

	it( 'preserves latest saved content when a full-record save only changes other fields', async () => {
		const baseContent = pageContent( [ 'Alpha', 'Beta' ] );
		const latestContent = pageContent( [ 'Alpha', 'current content' ] );
		const latestRecord = {
			id: 123,
			content: { raw: latestContent },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( false ),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'local-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				content: 'older local crdt content',
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		getSyncManager.mockReturnValue( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				content: { raw: baseContent },
				meta: {
					foo: 'base',
				},
			},
			{
				content: baseContent,
				meta: {
					foo: 'changed',
				},
			},
			'page',
			false,
			'/wp/v2/pages'
		);

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/pages/123?context=edit',
		} );
		expect( syncManager.applyPersistedCRDTDoc ).toHaveBeenCalledWith(
			'postType/page',
			123,
			latestRecord
		);
		expect( syncManager.getCRDTRecordData ).not.toHaveBeenCalled();
		expect( result ).toEqual( {
			content: latestContent,
			meta: {
				foo: 'changed',
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'local-doc',
			},
		} );
	} );

	it( 'merges the latest persisted CRDT record before saving stale post content', async () => {
		const latestRecord = {
			id: 123,
			content: { raw: 'current content' },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn(),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'merged-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				content: 'merged content',
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		getSyncManager.mockReturnValue( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				content: { raw: 'base content' },
			},
			{ content: 'stale local content' },
			'page',
			false,
			'/wp/v2/pages'
		);

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/pages/123?context=edit',
		} );
		expect( syncManager.applyPersistedCRDTDoc ).toHaveBeenCalledWith(
			'postType/page',
			123,
			latestRecord
		);
		expect( syncManager.getCRDTRecordData ).toHaveBeenCalledWith(
			'postType/page',
			123
		);
		expect( result ).toEqual( {
			content: 'merged content',
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'merged-doc',
			},
		} );
	} );

	it( 'uses the CRDT record when applying the latest persisted document changes local state', async () => {
		const latestRecord = {
			id: 123,
			content: { raw: 'current content' },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( true ),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'merged-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				content: 'merged content',
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		getSyncManager.mockReturnValue( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				content: { raw: 'current content' },
			},
			{ content: 'stale local content' },
			'page',
			false,
			'/wp/v2/pages'
		);

		expect( syncManager.applyPersistedCRDTDoc ).toHaveBeenCalledWith(
			'postType/page',
			123,
			latestRecord
		);
		expect( syncManager.getCRDTRecordData ).toHaveBeenCalledWith(
			'postType/page',
			123
		);
		expect( result ).toEqual( {
			content: 'merged content',
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'merged-doc',
			},
		} );
	} );

	it( 'derives stale saved content from CRDT blocks instead of serialized CRDT content', async () => {
		const mergedContent = pageContent( [
			'Alpha',
			'stale local content',
			'current content',
		] );
		const latestRecord = {
			id: 123,
			content: { raw: pageContent( [ 'Alpha', 'current content' ] ) },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( true ),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'merged-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				blocks: parse( mergedContent ),
				content: 'mangled serialized CRDT content',
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		getSyncManager.mockReturnValue( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				content: { raw: pageContent( [ 'Alpha' ] ) },
			},
			{ content: pageContent( [ 'Alpha', 'stale local content' ] ) },
			'page',
			false,
			'/wp/v2/pages'
		);

		expect( result.content ).toBe( mergedContent );
		expect( result.content ).not.toContain( 'mangled' );
		expect( result.meta ).toEqual( {
			[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'merged-doc',
		} );
	} );

	it( 'does not persist empty content while the local CRDT blocks are non-empty', async () => {
		const crdtContent = pageContent( [ 'Alpha', 'current content' ] );
		const latestRecord = {
			id: 123,
			content: { raw: crdtContent },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( false ),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'local-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				blocks: parse( crdtContent ),
				content: '',
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		getSyncManager.mockReturnValue( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				title: { raw: 'Base title' },
				content: { raw: crdtContent },
				meta: {
					[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'base-doc',
				},
			},
			{
				title: 'Updated title',
				content: { raw: '' },
			},
			'page',
			false,
			'/wp/v2/pages'
		);

		expect( syncManager.getCRDTRecordData ).toHaveBeenCalledWith(
			'postType/page',
			123
		);
		expect( result ).toEqual( {
			content: crdtContent,
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'local-doc',
			},
		} );
	} );

	it( 'allows empty content when the local CRDT blocks are empty', async () => {
		const latestRecord = {
			id: 123,
			content: { raw: pageContent( [ 'Alpha' ] ) },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( false ),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'local-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				blocks: [],
				content: '',
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		getSyncManager.mockReturnValue( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				content: { raw: latestRecord.content.raw },
				meta: {
					[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'base-doc',
				},
			},
			{ content: '' },
			'page',
			false,
			'/wp/v2/pages'
		);

		expect( syncManager.getCRDTRecordData ).toHaveBeenCalledWith(
			'postType/page',
			123
		);
		expect( result ).toEqual( {
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'local-doc',
			},
		} );
	} );

	it( 'merges non-conflicting stale serialized content edits with the latest saved content', async () => {
		const latestRecord = {
			id: 123,
			content: { raw: pageContent( [ 'Alpha', 'current content' ] ) },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( false ),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'merged-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				content: latestRecord.content.raw,
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		getSyncManager.mockReturnValue( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				content: { raw: pageContent( [ 'Alpha', 'Beta' ] ) },
			},
			{ content: pageContent( [ 'stale local content', 'Beta' ] ) },
			'page',
			false,
			'/wp/v2/pages'
		);

		expect( result.content ).toContain( 'stale local content' );
		expect( result.content ).toContain( 'current content' );
		expect( result.meta ).toEqual( {
			[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'merged-doc',
		} );
	} );

	it( 'preserves latest trailing serialized blocks when a stale content edit submits an older shorter body', async () => {
		const latestContent = pageContent( [
			'Alpha',
			'Beta',
			'current content',
		] );
		const latestRecord = {
			id: 123,
			content: { raw: latestContent },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( false ),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'merged-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				content: latestContent,
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		getSyncManager.mockReturnValue( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				content: { raw: latestContent },
			},
			{ content: pageContent( [ 'stale local content', 'Beta' ] ) },
			'page',
			false,
			'/wp/v2/pages'
		);

		expect( result.content ).toContain( 'stale local content' );
		expect( result.content ).toContain( 'current content' );
		expect( result.meta ).toEqual( {
			[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'merged-doc',
		} );
	} );

	it( 'preserves revision restore fields without merging latest saved blocks back in', async () => {
		const restoredContent = pageContent( [ 'Alpha', 'older revision' ] );
		const latestContent = pageContent( [
			'Alpha',
			'older revision',
			'newer checkpoint',
		] );
		const restoredTitle = 'Older revision title';
		const latestTitle = 'Newer checkpoint title';
		const latestRecord = {
			id: 123,
			content: { raw: latestContent },
			title: { raw: latestTitle },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( false ),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'local-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				blocks: parse( restoredContent ),
				content: restoredContent,
				title: latestTitle,
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		getSyncManager.mockReturnValue( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				content: { raw: latestContent },
				title: { raw: latestTitle },
				meta: {
					[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'base-doc',
				},
			},
			{ content: restoredContent, title: restoredTitle },
			'page',
			false,
			'/wp/v2/pages',
			{ __unstableIsRevisionRestore: true }
		);

		expect( result ).toEqual( {
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'local-doc',
			},
		} );
	} );

	it( 'merges sibling serialized blocks appended from a shared stale base', async () => {
		const latestRecord = {
			id: 123,
			content: { raw: pageContent( [ 'Alpha', 'current content' ] ) },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( false ),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'merged-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				content: latestRecord.content.raw,
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		getSyncManager.mockReturnValue( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				content: { raw: pageContent( [ 'Alpha' ] ) },
			},
			{ content: pageContent( [ 'Alpha', 'stale local content' ] ) },
			'page',
			false,
			'/wp/v2/pages'
		);

		expect( result.content ).toContain( 'stale local content' );
		expect( result.content ).toContain( 'current content' );
		expect( result.meta ).toEqual( {
			[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'merged-doc',
		} );
	} );

	it( 'does not merge stale serialized content edits when the same block changed locally and remotely', async () => {
		const latestRecord = {
			id: 123,
			content: { raw: pageContent( [ 'current content', 'Beta' ] ) },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( false ),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'merged-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				content: latestRecord.content.raw,
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		getSyncManager.mockReturnValue( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				content: { raw: pageContent( [ 'Alpha', 'Beta' ] ) },
			},
			{ content: pageContent( [ 'stale local content', 'Beta' ] ) },
			'page',
			false,
			'/wp/v2/pages'
		);

		expect( result ).toEqual( {
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'merged-doc',
			},
		} );
	} );

	it( 'does not replace edited content from CRDT when the latest record has no persisted CRDT document', async () => {
		const latestRecord = {
			id: 123,
			content: { raw: 'base content' },
			meta: {},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( true ),
			createPersistedCRDTDoc: jest
				.fn()
				.mockResolvedValueOnce( 'before-apply-doc' )
				.mockResolvedValueOnce( 'after-apply-doc' )
				.mockResolvedValueOnce( 'after-snapshot-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				content: 'partially flushed local crdt content',
			} ) ),
			update: jest.fn(),
		};
		apiFetch.mockResolvedValue( latestRecord );
		getSyncManager.mockReturnValue( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				content: { raw: 'base content' },
			},
			{ content: 'new local content' },
			'page',
			false,
			'/wp/v2/pages'
		);

		expect( syncManager.applyPersistedCRDTDoc ).toHaveBeenCalledWith(
			'postType/page',
			123,
			latestRecord
		);
		expect( syncManager.getCRDTRecordData ).not.toHaveBeenCalled();
		expect( result ).toEqual( {
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]:
					'after-snapshot-doc',
			},
		} );
	} );

	it( 'does not replace edited content when the latest saved post has not changed', async () => {
		const latestRecord = {
			id: 123,
			content: { raw: 'base content' },
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( false ),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'local-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				content: 'older local crdt content',
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		getSyncManager.mockReturnValue( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				content: { raw: 'base content' },
			},
			{ content: 'new local content' },
			'page',
			false,
			'/wp/v2/pages'
		);

		expect( syncManager.applyPersistedCRDTDoc ).toHaveBeenCalledWith(
			'postType/page',
			123,
			latestRecord
		);
		expect( syncManager.getCRDTRecordData ).not.toHaveBeenCalled();
		expect( result ).toEqual( {
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'local-doc',
			},
		} );
	} );
} );

describe( 'loadPostTypeEntities', () => {
	let originalCollaborationEnabled;
	let originalCollaborationDisabledPostTypes;

	beforeEach( () => {
		apiFetch.mockReset();
		applyPostChangesToCRDTDoc.mockReset();
		originalCollaborationEnabled = window._wpCollaborationEnabled;
		originalCollaborationDisabledPostTypes =
			window._wpCollaborationDisabledPostTypes;
	} );

	afterEach( () => {
		window._wpCollaborationEnabled = originalCollaborationEnabled;
		window._wpCollaborationDisabledPostTypes =
			originalCollaborationDisabledPostTypes;
	} );

	it( 'should include custom taxonomy rest_bases in synced properties when collaboration is enabled', async () => {
		window._wpCollaborationEnabled = true;

		const mockPostTypes = {
			book: {
				name: 'Books',
				rest_base: 'books',
				rest_namespace: 'wp/v2',
				taxonomies: [ 'genre', 'audience' ],
			},
		};
		const mockTaxonomies = {
			genre: {
				name: 'Genres',
				rest_base: 'genres',
				rest_namespace: 'wp/v2',
			},
			audience: {
				name: 'Audiences',
				rest_base: 'audiences',
				rest_namespace: 'wp/v2',
			},
		};

		apiFetch
			.mockResolvedValueOnce( mockPostTypes )
			.mockResolvedValueOnce( mockTaxonomies );

		const postTypeLoader = additionalEntityConfigLoaders.find(
			( loader ) => loader.kind === 'postType'
		);
		const entities = await postTypeLoader.loadEntities();
		const bookEntity = entities.find( ( e ) => e.name === 'book' );

		bookEntity.syncConfig.applyChangesToCRDTDoc( {}, {} );

		expect( applyPostChangesToCRDTDoc ).toHaveBeenCalledWith(
			{},
			{},
			expect.any( Set )
		);

		const syncedProperties = applyPostChangesToCRDTDoc.mock.calls[ 0 ][ 2 ];
		expect( syncedProperties ).toContain( 'genres' );
		expect( syncedProperties ).toContain( 'audiences' );
	} );

	it( 'should not fetch taxonomies when collaboration is disabled', async () => {
		window._wpCollaborationEnabled = false;

		const mockPostTypes = {
			post: {
				name: 'Posts',
				rest_base: 'posts',
				rest_namespace: 'wp/v2',
				taxonomies: [ 'category', 'post_tag' ],
			},
		};

		apiFetch.mockResolvedValueOnce( mockPostTypes );

		const postTypeLoader = additionalEntityConfigLoaders.find(
			( loader ) => loader.kind === 'postType'
		);
		const entities = await postTypeLoader.loadEntities();
		const postEntity = entities.find( ( e ) => e.name === 'post' );

		postEntity.syncConfig.applyChangesToCRDTDoc( {}, {} );

		// Only one apiFetch call (post types), no taxonomy fetch.
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );

		const syncedProperties = applyPostChangesToCRDTDoc.mock.calls[ 0 ][ 2 ];
		expect( syncedProperties ).not.toContain( 'categories' );
		expect( syncedProperties ).not.toContain( 'tags' );
	} );

	it( 'should sync post type entities by default', async () => {
		window._wpCollaborationEnabled = false;
		window._wpCollaborationDisabledPostTypes = undefined;

		const mockPostTypes = {
			post: {
				name: 'Posts',
				rest_base: 'posts',
				rest_namespace: 'wp/v2',
			},
		};

		apiFetch.mockResolvedValueOnce( mockPostTypes );

		const postTypeLoader = additionalEntityConfigLoaders.find(
			( loader ) => loader.kind === 'postType'
		);
		const entities = await postTypeLoader.loadEntities();
		const postEntity = entities.find( ( e ) => e.name === 'post' );

		expect( postEntity.syncConfig.shouldSync() ).toBe( true );
	} );

	it( 'should not sync post type entities disabled for collaboration', async () => {
		window._wpCollaborationEnabled = false;
		window._wpCollaborationDisabledPostTypes = [ 'book' ];

		const mockPostTypes = {
			book: {
				name: 'Books',
				rest_base: 'books',
				rest_namespace: 'wp/v2',
			},
		};

		apiFetch.mockResolvedValueOnce( mockPostTypes );

		const postTypeLoader = additionalEntityConfigLoaders.find(
			( loader ) => loader.kind === 'postType'
		);
		const entities = await postTypeLoader.loadEntities();
		const bookEntity = entities.find( ( e ) => e.name === 'book' );

		expect( bookEntity.syncConfig.shouldSync() ).toBe( false );
	} );

	it( 'should skip taxonomy rest_base when taxonomy is not found in fetched taxonomies', async () => {
		window._wpCollaborationEnabled = true;

		const mockPostTypes = {
			book: {
				name: 'Books',
				rest_base: 'books',
				rest_namespace: 'wp/v2',
				taxonomies: [ 'genre', 'missing_taxonomy' ],
			},
		};
		const mockTaxonomies = {
			genre: {
				name: 'Genres',
				rest_base: 'genres',
				rest_namespace: 'wp/v2',
			},
			// 'missing_taxonomy' is intentionally absent.
		};

		apiFetch
			.mockResolvedValueOnce( mockPostTypes )
			.mockResolvedValueOnce( mockTaxonomies );

		const postTypeLoader = additionalEntityConfigLoaders.find(
			( loader ) => loader.kind === 'postType'
		);
		const entities = await postTypeLoader.loadEntities();
		const bookEntity = entities.find( ( e ) => e.name === 'book' );

		bookEntity.syncConfig.applyChangesToCRDTDoc( {}, {} );

		const syncedProperties = applyPostChangesToCRDTDoc.mock.calls[ 0 ][ 2 ];
		expect( syncedProperties ).toContain( 'genres' );
		// missing_taxonomy has no rest_base entry, so nothing should be added for it.
		expect( syncedProperties.size ).toBe( 16 ); // 15 base + 1 taxonomy (genres)
	} );

	it( 'should include base synced properties regardless of taxonomies', async () => {
		window._wpCollaborationEnabled = true;

		const mockPostTypes = {
			page: {
				name: 'Pages',
				rest_base: 'pages',
				rest_namespace: 'wp/v2',
				taxonomies: [],
			},
		};

		apiFetch
			.mockResolvedValueOnce( mockPostTypes )
			.mockResolvedValueOnce( {} );

		const postTypeLoader = additionalEntityConfigLoaders.find(
			( loader ) => loader.kind === 'postType'
		);
		const entities = await postTypeLoader.loadEntities();
		const pageEntity = entities.find( ( e ) => e.name === 'page' );

		pageEntity.syncConfig.applyChangesToCRDTDoc( {}, {} );

		const syncedProperties = applyPostChangesToCRDTDoc.mock.calls[ 0 ][ 2 ];
		const expectedBase = [
			'author',
			'blocks',
			'content',
			'comment_status',
			'date',
			'excerpt',
			'featured_media',
			'format',
			'meta',
			'ping_status',
			'slug',
			'status',
			'sticky',
			'template',
			'title',
		];
		for ( const prop of expectedBase ) {
			expect( syncedProperties ).toContain( prop );
		}
		expect( syncedProperties.size ).toBe( 15 );
	} );
} );

describe( 'loadTaxonomyEntities', () => {
	beforeEach( () => {
		apiFetch.mockReset();
	} );

	it( 'should add supportsPagination: true to taxonomy entities', async () => {
		const mockTaxonomies = {
			category: {
				name: 'Categories',
				rest_base: 'categories',
			},
		};

		apiFetch.mockResolvedValueOnce( mockTaxonomies );

		const taxonomyLoader = additionalEntityConfigLoaders.find(
			( loader ) => loader.kind === 'taxonomy'
		);
		const entities = await taxonomyLoader.loadEntities();

		expect( entities[ 0 ].supportsPagination ).toBe( true );
	} );
} );
