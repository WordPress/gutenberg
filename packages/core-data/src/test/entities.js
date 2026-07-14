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

function parsedBlockContents( content ) {
	return parse( content ).map( ( block ) => block.attributes.content );
}

function setSyncManagerMock( syncManager ) {
	if (
		! syncManager.createPersistedCRDTSnapshot &&
		syncManager.createPersistedCRDTDoc
	) {
		syncManager.createPersistedCRDTSnapshot = jest.fn(
			async ( ...args ) => {
				const serializedDoc = await syncManager.createPersistedCRDTDoc(
					...args
				);
				return serializedDoc
					? { serializedDoc, isCurrent: () => true }
					: null;
			}
		);
	}

	if (
		! syncManager.createRebasedPersistedCRDTDoc &&
		syncManager.applyPersistedCRDTDoc
	) {
		syncManager.commitRebasedCRDTDoc = jest.fn().mockResolvedValue( true );
		syncManager.createRebasedPersistedCRDTDoc = jest.fn(
			async (
				objectType,
				objectId,
				record,
				_localSnapshot,
				...options
			) => {
				const didApply = await syncManager.applyPersistedCRDTDoc(
					objectType,
					objectId,
					record,
					...options.slice( 0, 3 )
				);
				if ( ! didApply ) {
					return null;
				}

				return {
					record:
						syncManager.getCRDTRecordData?.(
							objectType,
							objectId
						) ?? {},
					serializedDoc:
						( await syncManager.createPersistedCRDTDoc?.(
							objectType,
							objectId
						) ) ?? '',
					commit: syncManager.commitRebasedCRDTDoc,
				};
			}
		);
	}

	getSyncManager.mockReturnValue( syncManager );
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
	let originalCollaborationDisabledPostTypes;

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
		originalCollaborationDisabledPostTypes =
			window._wpCollaborationDisabledPostTypes;
	} );

	afterEach( () => {
		window._wpCollaborationEnabled = originalCollaborationEnabled;
		window._wpCollaborationDisabledPostTypes =
			originalCollaborationDisabledPostTypes;
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
				.mockResolvedValue( mockSerializedDoc ),
		} );

		const record = { id: 123, status: 'publish' };
		const edits = {};
		const result = await prePersistPostType( record, edits, 'post', false );

		expect( result.meta ).toEqual( {
			[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: mockSerializedDoc,
		} );

		expect( getSyncManager ).toHaveBeenCalled();
		expect( getSyncManager().createPersistedCRDTDoc ).toHaveBeenCalledWith(
			'postType/post',
			123
		);

		getSyncManager.mockReset();
	} );

	it( 'preserves latest saved content when a full-record save only changes other fields', async () => {
		const baseContent = pageContent( [ 'Alpha', 'Beta' ] );
		const latestContent = pageContent( [ 'Alpha', 'current content' ] );
		const latestRecord = {
			id: 123,
			content: { raw: latestContent },
			meta: {
				foo: 'base',
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( true ),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'local-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				content: latestContent,
				meta: { foo: 'changed' },
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		setSyncManagerMock( syncManager );
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
			latestRecord,
			[ 'content' ],
			true,
			[ 'content', 'meta' ]
		);
		expect( syncManager.getCRDTRecordData ).toHaveBeenCalledWith(
			'postType/page',
			123
		);
		expect( result ).toEqual( {
			content: latestContent,
			meta: {
				foo: 'changed',
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'local-doc',
			},
		} );
	} );

	it( 'refreshes the persisted CRDT document for a status-only save', async () => {
		const latestRecord = {
			id: 123,
			status: 'publish',
			content: { raw: pageContent( [ 'current content' ] ) },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( true ),
			createPersistedCRDTDoc: jest
				.fn()
				.mockResolvedValueOnce( 'stale-local-doc' )
				.mockResolvedValueOnce( 'rebased-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				content: latestRecord.content.raw,
				status: 'publish',
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		setSyncManagerMock( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'draft',
				content: { raw: latestRecord.content.raw },
			},
			{ status: 'publish' },
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
			latestRecord,
			[ 'content', 'status' ],
			true,
			[ 'content' ]
		);
		expect( result ).toEqual( {
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'rebased-doc',
			},
		} );
	} );

	it( 'merges disjoint post meta edits into the REST payload and CRDT snapshot', async () => {
		const latestRecord = {
			id: 123,
			status: 'draft',
			meta: {
				foo: 1,
				bar: 0,
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( true ),
			createPersistedCRDTDoc: jest
				.fn()
				.mockResolvedValue( 'rebased-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				meta: { foo: 1, bar: 1, orphaned: 'stale' },
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		setSyncManagerMock( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'draft',
				meta: { foo: 0, bar: 0 },
			},
			{ meta: { foo: 0, bar: 1 } },
			'page',
			false,
			'/wp/v2/pages'
		);

		expect( result.meta ).toEqual( {
			foo: 1,
			bar: 1,
			[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'rebased-doc',
		} );
	} );

	it( 'rejects concurrent edits to the same post meta key', async () => {
		const latestRecord = {
			id: 123,
			status: 'draft',
			meta: {
				foo: 1,
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn(),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'local-doc' ),
			getCRDTRecordData: jest.fn(),
		};
		apiFetch.mockResolvedValue( latestRecord );
		setSyncManagerMock( syncManager );
		window._wpCollaborationEnabled = true;

		await expect(
			prePersistPostType(
				{
					id: 123,
					status: 'draft',
					meta: { foo: 0 },
				},
				{ meta: { foo: 2 } },
				'page',
				false,
				'/wp/v2/pages'
			)
		).rejects.toMatchObject( {
			code: 'core_data_stale_save_conflict',
			data: { conflictingFields: [ 'meta.foo' ] },
		} );
		expect( syncManager.applyPersistedCRDTDoc ).not.toHaveBeenCalled();
	} );

	it( 'does not attach a CRDT document created after an unchecked null result', async () => {
		const syncManager = {
			createPersistedCRDTDoc: jest
				.fn()
				.mockResolvedValueOnce( null )
				.mockResolvedValueOnce( 'late-doc' ),
		};
		apiFetch.mockResolvedValue( {
			id: 123,
			status: 'draft',
			meta: {},
		} );
		setSyncManagerMock( syncManager );
		window._wpCollaborationEnabled = true;

		await expect(
			prePersistPostType(
				{ id: 123, status: 'draft', meta: {} },
				{ status: 'publish' },
				'page',
				false,
				'/wp/v2/pages'
			)
		).resolves.toEqual( {} );
		expect( syncManager.createPersistedCRDTDoc ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'checks stale auto-draft defaults even when no local CRDT document exists', async () => {
		const syncManager = {
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( null ),
		};
		apiFetch.mockResolvedValue( {
			id: 123,
			status: 'publish',
			title: { raw: 'Published title' },
			meta: { foo: 0 },
		} );
		setSyncManagerMock( syncManager );
		window._wpCollaborationEnabled = true;

		await expect(
			prePersistPostType(
				{
					id: 123,
					status: 'auto-draft',
					title: 'Auto Draft',
					meta: { foo: 0 },
				},
				{ meta: { foo: 1 } },
				'page',
				false,
				'/wp/v2/pages'
			)
		).resolves.toEqual( { meta: { foo: 1 } } );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/pages/123?context=edit',
		} );
	} );

	it( 'does not apply stale auto-draft defaults after another window publishes', async () => {
		const latestRecord = {
			id: 123,
			status: 'publish',
			title: { raw: 'Published title' },
			content: { raw: 'current content' },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( true ),
			createPersistedCRDTDoc: jest
				.fn()
				.mockResolvedValue( 'rebased-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				content: 'merged content',
				status: 'publish',
				title: 'Published title',
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		setSyncManagerMock( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'auto-draft',
				title: 'Auto Draft',
				content: { raw: 'base content' },
			},
			{ content: 'local content' },
			'page',
			false,
			'/wp/v2/pages'
		);

		expect( result ).toEqual( {
			content: 'merged content',
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'rebased-doc',
			},
		} );
	} );

	it( 'treats the auto-draft title placeholder as unchanged on the first collaborative save', async () => {
		const snapshot = {
			serializedDoc: 'local-doc',
			isCurrent: jest.fn( () => true ),
		};
		const syncManager = {
			createPersistedCRDTSnapshot: jest
				.fn()
				.mockResolvedValue( snapshot ),
		};
		apiFetch.mockResolvedValue( {
			id: 123,
			status: 'auto-draft',
			title: { raw: 'Auto Draft' },
			content: { raw: '' },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: '',
			},
		} );
		setSyncManagerMock( syncManager );
		window._wpCollaborationEnabled = true;

		await expect(
			prePersistPostType(
				{
					id: 123,
					status: 'auto-draft',
					title: '',
					content: { raw: '' },
					meta: {
						[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: '',
					},
				},
				{ content: 'local content' },
				'page',
				false,
				'/wp/v2/pages'
			)
		).resolves.toEqual( {
			status: 'draft',
			title: '',
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'local-doc',
			},
		} );
		expect( snapshot.isCurrent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'still rejects a meaningful title added to an auto-draft by another window', async () => {
		const syncManager = {
			createPersistedCRDTSnapshot: jest.fn().mockResolvedValue( {
				serializedDoc: 'local-doc',
				isCurrent: () => true,
			} ),
		};
		apiFetch.mockResolvedValue( {
			id: 123,
			status: 'auto-draft',
			title: { raw: 'Meaningful title' },
			content: { raw: '' },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: '',
			},
		} );
		setSyncManagerMock( syncManager );
		window._wpCollaborationEnabled = true;

		await expect(
			prePersistPostType(
				{
					id: 123,
					status: 'auto-draft',
					title: '',
					content: { raw: '' },
					meta: {
						[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: '',
					},
				},
				{ content: 'local content' },
				'page',
				false,
				'/wp/v2/pages'
			)
		).rejects.toMatchObject( {
			code: 'core_data_stale_save_conflict',
			data: { conflictingFields: [ 'title' ] },
		} );
	} );

	it( 'stores auto-draft defaults in the validated CRDT candidate before committing it', async () => {
		const content = pageContent( [ 'Initial content' ] );
		const snapshot = {
			serializedDoc: 'local-doc',
			isCurrent: jest.fn( () => true ),
		};
		const commit = jest.fn().mockResolvedValue( true );
		const syncManager = {
			createPersistedCRDTSnapshot: jest
				.fn()
				.mockResolvedValue( snapshot ),
			createRebasedPersistedCRDTDoc: jest.fn().mockResolvedValue( {
				record: {
					content,
					status: 'draft',
					title: '',
				},
				serializedDoc: 'rebased-doc',
				commit,
			} ),
		};
		const latestRecord = {
			id: 123,
			status: 'auto-draft',
			title: { raw: 'Auto Draft' },
			content: { raw: content },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		apiFetch.mockResolvedValue( latestRecord );
		setSyncManagerMock( syncManager );
		window._wpCollaborationEnabled = true;

		await expect(
			prePersistPostType(
				{
					id: 123,
					status: 'auto-draft',
					title: 'Auto Draft',
					content: { raw: content },
				},
				{},
				'page',
				false,
				'/wp/v2/pages'
			)
		).resolves.toEqual( {
			status: 'draft',
			title: '',
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'rebased-doc',
			},
		} );
		expect(
			syncManager.createRebasedPersistedCRDTDoc
		).toHaveBeenCalledWith(
			'postType/page',
			123,
			latestRecord,
			snapshot,
			[ 'content' ],
			true,
			[ 'content' ],
			{ status: 'draft', title: '' }
		);
		expect( commit ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'fails the save when the validated candidate can no longer be committed', async () => {
		const content = pageContent( [ 'Initial content' ] );
		const snapshot = {
			serializedDoc: 'local-doc',
			isCurrent: jest.fn( () => true ),
		};
		const commit = jest.fn().mockResolvedValue( false );
		const latestRecord = {
			id: 123,
			status: 'publish',
			content: { raw: content },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			createPersistedCRDTSnapshot: jest
				.fn()
				.mockResolvedValue( snapshot ),
			createRebasedPersistedCRDTDoc: jest.fn().mockResolvedValue( {
				record: { content, status: 'draft' },
				serializedDoc: 'rebased-doc',
				commit,
			} ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		setSyncManagerMock( syncManager );
		window._wpCollaborationEnabled = true;

		await expect(
			prePersistPostType(
				{
					id: 123,
					status: 'publish',
					content: { raw: content },
				},
				{ status: 'draft' },
				'page',
				false,
				'/wp/v2/pages'
			)
		).rejects.toMatchObject( {
			code: 'core_data_stale_save_check_failed',
		} );
		expect( commit ).toHaveBeenCalledTimes( 1 );
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
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( true ),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'merged-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				content: 'merged content',
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		setSyncManagerMock( syncManager );
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
			latestRecord,
			[ 'content' ],
			true,
			[ 'content' ]
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
		setSyncManagerMock( syncManager );
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

		expect( syncManager.applyPersistedCRDTDoc ).toHaveBeenCalledWith(
			'postType/page',
			123,
			latestRecord,
			[ 'content' ],
			true,
			[ 'content' ]
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
		setSyncManagerMock( syncManager );
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

	it( 'rejects stale content when the CRDT does not contain a reliable merge', async () => {
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
				content: latestRecord.content.raw,
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		setSyncManagerMock( syncManager );
		window._wpCollaborationEnabled = true;

		await expect(
			prePersistPostType(
				{
					id: 123,
					status: 'publish',
					content: { raw: pageContent( [ 'Alpha', 'Beta' ] ) },
				},
				{
					content: pageContent( [ 'stale local content', 'Beta' ] ),
				},
				'page',
				false,
				'/wp/v2/pages'
			)
		).rejects.toMatchObject( {
			code: 'core_data_stale_save_conflict',
			data: { conflictingFields: [ 'content' ] },
		} );
	} );

	it( 'does not restore an intentionally deleted trailing block when the server content has not changed', async () => {
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
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( true ),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'merged-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				content: pageContent( [ 'stale local content', 'Beta' ] ),
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		setSyncManagerMock( syncManager );
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

		expect( syncManager.applyPersistedCRDTDoc ).toHaveBeenCalledWith(
			'postType/page',
			123,
			latestRecord,
			[ 'content' ],
			true,
			[ 'content' ]
		);
		expect( result ).toEqual( {
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'merged-doc',
			},
		} );
	} );

	it( 'merges sibling serialized blocks for an RTC-enabled custom post type', async () => {
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
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		setSyncManagerMock( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'publish',
				content: { raw: pageContent( [ 'Alpha' ] ) },
			},
			{ content: pageContent( [ 'Alpha', 'stale local content' ] ) },
			'book',
			false,
			'/wp/v2/books'
		);

		expect( parsedBlockContents( result.content ) ).toEqual( [
			'Alpha',
			'stale local content',
			'current content',
		] );
		expect( result.meta ).toEqual( {
			[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'merged-doc',
		} );
	} );

	it( 'rejects concurrent changes to an atomic synced field before rebasing', async () => {
		const latestRecord = {
			id: 123,
			status: 'draft',
			categories: [ 1, 2 ],
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn(),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'local-doc' ),
			getCRDTRecordData: jest.fn(),
		};
		apiFetch.mockResolvedValue( latestRecord );
		setSyncManagerMock( syncManager );
		window._wpCollaborationEnabled = true;

		await expect(
			prePersistPostType(
				{
					id: 123,
					status: 'draft',
					categories: [ 1 ],
				},
				{ categories: [ 1, 3 ] },
				'page',
				false,
				'/wp/v2/pages',
				new Set( [ 'categories' ] )
			)
		).rejects.toMatchObject( {
			code: 'core_data_stale_save_conflict',
			data: { conflictingFields: [ 'categories' ] },
		} );
		expect( syncManager.applyPersistedCRDTDoc ).not.toHaveBeenCalled();
	} );

	it( 'refreshes an unchanged atomic field from the latest record', async () => {
		const latestRecord = {
			id: 123,
			status: 'draft',
			categories: [ 1, 2 ],
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( true ),
			createPersistedCRDTDoc: jest
				.fn()
				.mockResolvedValue( 'rebased-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				categories: [ 1, 2 ],
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		setSyncManagerMock( syncManager );
		window._wpCollaborationEnabled = true;

		const result = await prePersistPostType(
			{
				id: 123,
				status: 'draft',
				categories: [ 1 ],
			},
			{ categories: [ 1 ] },
			'page',
			false,
			'/wp/v2/pages',
			new Set( [ 'categories' ] )
		);

		expect( result ).toEqual( {
			categories: [ 1, 2 ],
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'rebased-doc',
			},
		} );
	} );

	it( 'rejects ambiguous overlapping appends without a CRDT merge', async () => {
		const latestRecord = {
			id: 123,
			content: { raw: pageContent( [ 'Alpha', 'remote append' ] ) },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( true ),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'merged-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				content: latestRecord.content.raw,
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		setSyncManagerMock( syncManager );
		window._wpCollaborationEnabled = true;

		await expect(
			prePersistPostType(
				{
					id: 123,
					status: 'publish',
					content: { raw: pageContent( [ 'Alpha' ] ) },
				},
				{
					content: pageContent( [
						'Alpha',
						'remote append',
						'local append',
					] ),
				},
				'page',
				false,
				'/wp/v2/pages'
			)
		).rejects.toMatchObject( {
			code: 'core_data_stale_save_conflict',
			data: { conflictingFields: [ 'content' ] },
		} );
	} );

	it( 'rejects stale serialized content when the same block changed locally and remotely', async () => {
		const latestRecord = {
			id: 123,
			content: { raw: pageContent( [ 'current content', 'Beta' ] ) },
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
			},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn().mockResolvedValue( true ),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'merged-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				content: latestRecord.content.raw,
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		setSyncManagerMock( syncManager );
		window._wpCollaborationEnabled = true;

		await expect(
			prePersistPostType(
				{
					id: 123,
					status: 'publish',
					content: { raw: pageContent( [ 'Alpha', 'Beta' ] ) },
				},
				{
					content: pageContent( [ 'stale local content', 'Beta' ] ),
				},
				'page',
				false,
				'/wp/v2/pages'
			)
		).rejects.toMatchObject( {
			code: 'core_data_stale_save_conflict',
			data: { conflictingFields: [ 'content' ] },
		} );
	} );

	it.each( [ 'title', 'excerpt' ] )(
		'merges stale %s through the latest persisted CRDT document',
		async ( field ) => {
			const latestRecord = {
				id: 123,
				[ field ]: { raw: 'remote value' },
				meta: {
					[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'latest-doc',
				},
			};
			const syncManager = {
				applyPersistedCRDTDoc: jest.fn().mockResolvedValue( true ),
				createPersistedCRDTDoc: jest
					.fn()
					.mockResolvedValue( 'merged-doc' ),
				getCRDTRecordData: jest.fn( () => ( {
					[ field ]: 'merged value',
				} ) ),
			};
			apiFetch.mockResolvedValue( latestRecord );
			setSyncManagerMock( syncManager );
			window._wpCollaborationEnabled = true;

			const result = await prePersistPostType(
				{
					id: 123,
					status: 'publish',
					[ field ]: { raw: 'base value' },
				},
				{ [ field ]: 'local value' },
				'page',
				false,
				'/wp/v2/pages'
			);

			expect( result[ field ] ).toBe( 'merged value' );
		}
	);

	it( 'fails closed when the latest server record cannot be fetched', async () => {
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn(),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'local-doc' ),
			getCRDTRecordData: jest.fn(),
		};
		apiFetch.mockRejectedValue( new Error( 'network unavailable' ) );
		setSyncManagerMock( syncManager );
		window._wpCollaborationEnabled = true;

		await expect(
			prePersistPostType(
				{
					id: 123,
					status: 'publish',
					content: { raw: pageContent( [ 'Alpha' ] ) },
				},
				{ content: pageContent( [ 'local edit' ] ) },
				'page',
				false,
				'/wp/v2/pages'
			)
		).rejects.toMatchObject( {
			code: 'core_data_stale_save_check_failed',
		} );
		expect( syncManager.applyPersistedCRDTDoc ).not.toHaveBeenCalled();
	} );

	it.each( [ 'offline_error', 'fetch_error' ] )(
		'preserves the %s from a failed freshness request',
		async ( code ) => {
			const networkError = {
				code,
				message: 'network unavailable',
			};
			const syncManager = {
				createPersistedCRDTDoc: jest
					.fn()
					.mockResolvedValue( 'local-doc' ),
			};
			apiFetch.mockRejectedValue( networkError );
			setSyncManagerMock( syncManager );
			window._wpCollaborationEnabled = true;

			await expect(
				prePersistPostType(
					{
						id: 123,
						status: 'publish',
						content: { raw: pageContent( [ 'Alpha' ] ) },
					},
					{ content: pageContent( [ 'local edit' ] ) },
					'page',
					false,
					'/wp/v2/pages'
				)
			).rejects.toBe( networkError );
		}
	);

	it( 'does not run stale-save protection for a collaboration-disabled post type', async () => {
		const syncManager = {
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( null ),
		};
		setSyncManagerMock( syncManager );
		window._wpCollaborationEnabled = true;
		window._wpCollaborationDisabledPostTypes = [ 'page' ];

		await expect(
			prePersistPostType(
				{
					id: 123,
					status: 'publish',
					content: { raw: pageContent( [ 'Alpha' ] ) },
				},
				{ content: pageContent( [ 'local edit' ] ) },
				'page',
				false,
				'/wp/v2/pages'
			)
		).resolves.toEqual( {} );
		expect( apiFetch ).not.toHaveBeenCalled();
		expect( syncManager.createPersistedCRDTDoc ).toHaveBeenCalledTimes( 1 );
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
				.mockResolvedValueOnce( 'after-apply-doc' ),
			getCRDTRecordData: jest.fn( () => ( {
				content: 'partially flushed local crdt content',
			} ) ),
		};
		apiFetch.mockResolvedValue( latestRecord );
		setSyncManagerMock( syncManager );
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

		expect( syncManager.applyPersistedCRDTDoc ).not.toHaveBeenCalled();
		expect( syncManager.getCRDTRecordData ).not.toHaveBeenCalled();
		expect( result ).toEqual( {
			meta: {
				[ POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]: 'before-apply-doc',
			},
		} );
	} );

	it( 'rejects a changed server record when no persisted CRDT document can prove a merge', async () => {
		const latestRecord = {
			id: 123,
			content: { raw: 'current content' },
			meta: {},
		};
		const syncManager = {
			applyPersistedCRDTDoc: jest.fn(),
			createPersistedCRDTDoc: jest.fn().mockResolvedValue( 'local-doc' ),
			getCRDTRecordData: jest.fn(),
		};
		apiFetch.mockResolvedValue( latestRecord );
		setSyncManagerMock( syncManager );
		window._wpCollaborationEnabled = true;

		await expect(
			prePersistPostType(
				{
					id: 123,
					status: 'publish',
					content: { raw: 'base content' },
				},
				{ content: 'local content' },
				'page',
				false,
				'/wp/v2/pages'
			)
		).rejects.toMatchObject( {
			code: 'core_data_stale_save_conflict',
			data: { conflictingFields: [ 'content' ] },
		} );
		expect( syncManager.applyPersistedCRDTDoc ).not.toHaveBeenCalled();
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
		setSyncManagerMock( syncManager );
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

		expect( syncManager.applyPersistedCRDTDoc ).not.toHaveBeenCalled();
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
