/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { parse, serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	editMediaEntity,
	persistEntityBlockAttributes,
	persistEntityCRDTDoc,
	setCollaborationSupported,
} from '../private-actions';
import { getSyncManager, hasSyncManager } from '../sync';
import { saveCRDTDoc } from '../utils';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '@wordpress/blocks', () => ( {
	...jest.requireActual( '@wordpress/blocks' ),
	parse: jest.fn(),
	serialize: jest.fn(),
} ) );
jest.mock( '../sync', () => ( {
	...jest.requireActual( '../sync' ),
	getSyncManager: jest.fn(),
	hasSyncManager: jest.fn(),
} ) );
jest.mock( '../utils', () => ( {
	...jest.requireActual( '../utils' ),
	saveCRDTDoc: jest.fn(),
} ) );

describe( 'editMediaEntity', () => {
	let dispatch;
	let resolveSelect;

	beforeEach( () => {
		apiFetch.mockReset();
		dispatch = Object.assign( jest.fn(), {
			receiveEntityRecords: jest.fn(),
			__unstableAcquireStoreLock: jest.fn( () => 'test-lock' ),
			__unstableReleaseStoreLock: jest.fn(),
		} );
		resolveSelect = {
			getEntitiesConfig: jest.fn( () => [
				{
					kind: 'postType',
					name: 'attachment',
					baseURL: '/wp/v2/media',
				},
			] ),
		};
	} );

	it( 'should return early when recordId is not provided', async () => {
		const result = await editMediaEntity( null )( {
			dispatch,
			resolveSelect,
		} );

		expect( result ).toBeUndefined();
		expect( dispatch.__unstableAcquireStoreLock ).not.toHaveBeenCalled();
		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it( 'should return early when entity config is not found', async () => {
		resolveSelect.getEntitiesConfig.mockReturnValue( [] );

		const result = await editMediaEntity( 123 )( {
			dispatch,
			resolveSelect,
		} );

		expect( result ).toBeUndefined();
		expect( dispatch.__unstableAcquireStoreLock ).not.toHaveBeenCalled();
		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it( 'should successfully edit a media entity', async () => {
		const recordId = 123;
		const edits = {
			src: 'https://example.com/image.jpg',
			modifiers: [
				{ type: 'resize', args: { width: 300, height: 200 } },
			],
		};
		const updatedRecord = {
			id: recordId,
			src: 'https://example.com/image.jpg',
			modified: true,
		};

		apiFetch.mockResolvedValue( updatedRecord );

		const result = await editMediaEntity(
			recordId,
			edits
		)( {
			dispatch,
			resolveSelect,
		} );

		expect( dispatch.__unstableAcquireStoreLock ).toHaveBeenCalledWith(
			'core',
			[ 'entities', 'records', 'postType', 'attachment', recordId ],
			{ exclusive: true }
		);

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SAVE_ENTITY_RECORD_START',
			kind: 'postType',
			name: 'attachment',
			recordId,
		} );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/media/123/edit',
			method: 'POST',
			data: edits,
		} );

		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			updatedRecord,
			undefined,
			true,
			undefined,
			undefined
		);

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SAVE_ENTITY_RECORD_FINISH',
			kind: 'postType',
			name: 'attachment',
			recordId,
			error: undefined,
		} );

		expect( dispatch.__unstableReleaseStoreLock ).toHaveBeenCalledWith(
			'test-lock'
		);

		expect( result ).toBe( updatedRecord );
	} );

	it( 'should handle API errors when throwOnError is false', async () => {
		const recordId = 123;
		const edits = { src: 'https://example.com/image.jpg' };
		const apiError = new Error( 'API error' );

		apiFetch.mockRejectedValue( apiError );

		const result = await editMediaEntity( recordId, edits, {
			throwOnError: false,
		} )( { dispatch, resolveSelect } );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SAVE_ENTITY_RECORD_START',
			kind: 'postType',
			name: 'attachment',
			recordId,
		} );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SAVE_ENTITY_RECORD_FINISH',
			kind: 'postType',
			name: 'attachment',
			recordId,
			error: apiError,
		} );

		expect( dispatch.__unstableReleaseStoreLock ).toHaveBeenCalledWith(
			'test-lock'
		);

		expect( result ).toBeUndefined();
	} );

	it( 'should throw errors when throwOnError is true', async () => {
		const recordId = 123;
		const edits = { src: 'https://example.com/image.jpg' };
		const apiError = new Error( 'API error' );

		apiFetch.mockRejectedValue( apiError );

		await expect(
			editMediaEntity( recordId, edits, { throwOnError: true } )( {
				dispatch,
				resolveSelect,
			} )
		).rejects.toEqual( apiError );

		expect( dispatch.__unstableReleaseStoreLock ).toHaveBeenCalledWith(
			'test-lock'
		);
	} );

	it( 'should use custom fetch function when provided', async () => {
		const recordId = 123;
		const edits = { src: 'https://example.com/image.jpg' };
		const customFetch = jest.fn().mockResolvedValue( { id: recordId } );

		await editMediaEntity( recordId, edits, {
			__unstableFetch: customFetch,
		} )( { dispatch, resolveSelect } );

		expect( customFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/media/123/edit',
			method: 'POST',
			data: edits,
		} );
		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it( 'should handle null response from API', async () => {
		const recordId = 123;
		const edits = { src: 'https://example.com/image.jpg' };

		apiFetch.mockResolvedValue( null );

		const result = await editMediaEntity(
			recordId,
			edits
		)( {
			dispatch,
			resolveSelect,
		} );

		expect( dispatch.receiveEntityRecords ).not.toHaveBeenCalled();
		expect( result ).toBeUndefined();
	} );
} );

describe( 'persistEntityCRDTDoc', () => {
	let entityConfig;
	let select;

	beforeEach( () => {
		apiFetch.mockReset();
		saveCRDTDoc.mockReset();
		saveCRDTDoc.mockResolvedValue( true );
		entityConfig = {
			baseURL: '/wp/v2/posts',
			syncConfig: {
				applyChangesToCRDTDoc: jest.fn(),
				supportsPersistence: true,
			},
		};
		select = {
			getEntityConfig: jest.fn( () => entityConfig ),
		};
	} );

	it( 'persists CRDT docs for sync-enabled entities with persistence support', async () => {
		const didPersist = await persistEntityCRDTDoc(
			'postType',
			'post',
			123
		)( { select } );

		expect( select.getEntityConfig ).toHaveBeenCalledWith(
			'postType',
			'post'
		);
		expect( saveCRDTDoc ).toHaveBeenCalledWith( 'postType/post', 123 );
		expect( didPersist ).toBe( true );
	} );

	it( 'does not persist entities without CRDT persistence support', async () => {
		select.getEntityConfig.mockReturnValue( { syncConfig: {} } );

		const didPersist = await persistEntityCRDTDoc(
			'taxonomy',
			'category',
			123
		)( { select } );

		expect( saveCRDTDoc ).not.toHaveBeenCalled();
		expect( didPersist ).toBe( false );
	} );
} );

describe( 'persistEntityBlockAttributes', () => {
	let dispatch;
	let entityConfig;
	let select;
	let syncManager;

	beforeEach( () => {
		apiFetch.mockReset();
		parse.mockReset();
		serialize.mockReset();
		dispatch = Object.assign( jest.fn(), {
			receiveEntityRecords: jest.fn(),
		} );
		syncManager = {
			createPersistedCRDTDoc: jest
				.fn()
				.mockResolvedValue( 'serialized CRDT document' ),
		};
		getSyncManager.mockReturnValue( syncManager );
		entityConfig = {
			baseURL: '/wp/v2/posts',
			syncConfig: {
				supportsPersistence: true,
			},
		};
		select = {
			getEntityConfig: jest.fn( () => entityConfig ),
			getRawEntityRecord: jest.fn(),
		};
		apiFetch.mockResolvedValue( {
			id: 123,
			content: { raw: 'serialized repaired content' },
			meta: { _crdt_document: 'serialized CRDT document' },
		} );
	} );

	it( 'persists targeted block attributes with repaired content and CRDT metadata', async () => {
		parse.mockReturnValue( [
			{
				name: 'core/paragraph',
				attributes: {},
				innerBlocks: [],
			},
		] );
		serialize.mockReturnValue(
			'<!-- wp:paragraph {"metadata":{"noteId":[456]}} -->\n<p>Updated</p>\n<!-- /wp:paragraph -->'
		);
		const record = {
			id: 123,
			content:
				'<!-- wp:paragraph --><p>Updated</p><!-- /wp:paragraph -->',
			title: 'Snapshot title',
		};

		const didPersist = await persistEntityBlockAttributes(
			'postType',
			'post',
			123,
			{
				record,
				blockPath: [ 0 ],
				attributes: ( attributes ) => ( {
					metadata: {
						...attributes.metadata,
						noteId: [ 456 ],
					},
				} ),
			}
		)( { dispatch, select } );

		expect( syncManager.createPersistedCRDTDoc ).toHaveBeenCalledWith(
			'postType/post',
			123
		);
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/posts/123',
			method: 'POST',
			data: {
				content:
					'<!-- wp:paragraph {"metadata":{"noteId":[456]}} -->\n<p>Updated</p>\n<!-- /wp:paragraph -->',
				meta: {
					_crdt_document: 'serialized CRDT document',
				},
			},
		} );
		expect( dispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			expect.objectContaining( { id: 123 } ),
			undefined,
			true
		);
		expect( didPersist ).toBe( true );
	} );

	it( 'does not persist when the block path cannot be found', async () => {
		parse.mockReturnValue( [
			{
				name: 'core/paragraph',
				attributes: {},
				innerBlocks: [],
			},
		] );

		const didPersist = await persistEntityBlockAttributes(
			'postType',
			'post',
			123,
			{
				record: {
					content:
						'<!-- wp:paragraph --><p>Updated</p><!-- /wp:paragraph -->',
				},
				blockPath: [ 1 ],
				attributes: { metadata: { noteId: [ 456 ] } },
			}
		)( { dispatch, select } );

		expect( apiFetch ).not.toHaveBeenCalled();
		expect( didPersist ).toBe( false );
	} );

	it( 'falls back to a matched saved block when the live block path diverged', async () => {
		parse.mockReturnValue( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Target paragraph' },
				innerBlocks: [],
			},
			{
				name: 'core/paragraph',
				attributes: { content: 'Sibling paragraph' },
				innerBlocks: [],
			},
		] );
		serialize.mockReturnValue( 'serialized repaired content' );

		const didPersist = await persistEntityBlockAttributes(
			'postType',
			'post',
			123,
			{
				record: { content: 'saved content' },
				blockPath: [ 1 ],
				isMatch: ( block ) =>
					block?.attributes?.content === 'Target paragraph',
				matchIndex: 0,
				matchCount: 1,
				blockCount: 2,
				blockName: 'core/paragraph',
				attributes: { metadata: { noteId: [ 456 ] } },
			}
		)( { dispatch, select } );

		expect( serialize ).toHaveBeenCalledWith( [
			expect.objectContaining( {
				attributes: {
					content: 'Target paragraph',
					metadata: { noteId: [ 456 ] },
				},
			} ),
			expect.objectContaining( {
				attributes: { content: 'Sibling paragraph' },
			} ),
		] );
		expect( apiFetch ).toHaveBeenCalled();
		expect( didPersist ).toBe( true );
	} );

	it( 'persists a dirty block at a stable path when no saved content matches', async () => {
		parse.mockReturnValue( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Saved paragraph' },
				innerBlocks: [],
			},
		] );
		serialize.mockReturnValue( 'serialized repaired content' );

		const didPersist = await persistEntityBlockAttributes(
			'postType',
			'post',
			123,
			{
				record: { content: 'saved content' },
				blockPath: [ 0 ],
				isMatch: ( block ) =>
					block?.attributes?.content === 'Dirty paragraph',
				matchIndex: 0,
				matchCount: 1,
				blockCount: 1,
				blockName: 'core/paragraph',
				attributes: { metadata: { noteId: [ 456 ] } },
			}
		)( { dispatch, select } );

		expect( apiFetch ).toHaveBeenCalled();
		expect( didPersist ).toBe( true );
	} );

	it( 'refuses a dirty path after the live block structure changed', async () => {
		parse.mockReturnValue( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Saved target' },
				innerBlocks: [],
			},
			{
				name: 'core/paragraph',
				attributes: { content: 'Saved sibling' },
				innerBlocks: [],
			},
		] );

		const didPersist = await persistEntityBlockAttributes(
			'postType',
			'post',
			123,
			{
				record: { content: 'saved content' },
				blockPath: [ 1 ],
				isMatch: ( block ) =>
					block?.attributes?.content === 'Live-only target',
				matchIndex: 0,
				matchCount: 1,
				blockCount: 3,
				blockName: 'core/paragraph',
				attributes: { metadata: { noteId: [ 456 ] } },
			}
		)( { dispatch, select } );

		expect( apiFetch ).not.toHaveBeenCalled();
		expect( didPersist ).toBe( false );
	} );

	it( 'persists the selected occurrence among identical saved blocks', async () => {
		parse.mockReturnValue( [
			{
				name: 'core/separator',
				attributes: {},
				innerBlocks: [],
			},
			{
				name: 'core/separator',
				attributes: {},
				innerBlocks: [],
			},
		] );
		serialize.mockReturnValue( 'serialized repaired content' );

		const didPersist = await persistEntityBlockAttributes(
			'postType',
			'post',
			123,
			{
				record: { content: 'saved content' },
				blockPath: [ 2 ],
				isMatch: ( block ) => block?.name === 'core/separator',
				matchIndex: 1,
				matchCount: 2,
				blockCount: 3,
				blockName: 'core/separator',
				attributes: { metadata: { noteId: [ 456 ] } },
			}
		)( { dispatch, select } );

		expect( serialize ).toHaveBeenCalledWith( [
			expect.objectContaining( { attributes: {} } ),
			expect.objectContaining( {
				attributes: { metadata: { noteId: [ 456 ] } },
			} ),
		] );
		expect( didPersist ).toBe( true );
	} );

	it( 'does not parse an empty raw-content object', async () => {
		const didPersist = await persistEntityBlockAttributes(
			'postType',
			'post',
			123,
			{
				record: { content: { raw: '', rendered: '<p>Rendered</p>' } },
				blockPath: [ 0 ],
				attributes: { metadata: { noteId: [ 456 ] } },
			}
		)( { dispatch, select } );

		expect( parse ).not.toHaveBeenCalled();
		expect( apiFetch ).not.toHaveBeenCalled();
		expect( didPersist ).toBe( false );
	} );

	it( 're-reads the persisted record after earlier queued repairs', async () => {
		const firstFetch = {};
		firstFetch.promise = new Promise( ( resolve ) => {
			firstFetch.resolve = resolve;
		} );
		const firstRecord = { content: 'first saved content' };
		const secondRecord = { content: 'second saved content' };
		select.getRawEntityRecord
			.mockReturnValueOnce( firstRecord )
			.mockReturnValueOnce( secondRecord );
		parse.mockReturnValue( [
			{
				name: 'core/paragraph',
				attributes: {},
				innerBlocks: [],
			},
		] );
		serialize.mockReturnValue( 'repaired content' );
		apiFetch
			.mockImplementationOnce( () => firstFetch.promise )
			.mockResolvedValueOnce( { id: 123 } );

		const options = {
			record: { content: 'stale content' },
			blockPath: [ 0 ],
			attributes: { metadata: { noteId: [ 456 ] } },
		};
		const firstRepair = persistEntityBlockAttributes(
			'postType',
			'post',
			123,
			options
		)( { dispatch, select } );
		const secondRepair = persistEntityBlockAttributes(
			'postType',
			'post',
			123,
			options
		)( { dispatch, select } );

		await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
		expect( select.getRawEntityRecord ).toHaveBeenCalledTimes( 1 );
		firstFetch.resolve( { id: 123 } );
		await firstRepair;
		await secondRepair;

		expect( parse ).toHaveBeenNthCalledWith( 1, 'first saved content' );
		expect( parse ).toHaveBeenNthCalledWith( 2, 'second saved content' );
	} );
} );

describe( 'setCollaborationSupported', () => {
	afterEach( () => {
		getSyncManager.mockReset();
		hasSyncManager.mockReset();
	} );

	it( 'unloads sync and resets sync undo state when disabling collaboration', () => {
		const syncManager = {
			unloadAll: jest.fn(),
		};
		const dispatch = Object.assign( jest.fn(), {
			__unstableNotifySyncUndoManagerChange: jest.fn(),
		} );
		hasSyncManager.mockReturnValue( true );
		getSyncManager.mockReturnValue( syncManager );

		setCollaborationSupported( false )( { dispatch } );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SET_COLLABORATION_SUPPORTED',
			supported: false,
		} );
		expect( syncManager.unloadAll ).toHaveBeenCalledTimes( 1 );
		expect(
			dispatch.__unstableNotifySyncUndoManagerChange
		).toHaveBeenCalledWith( {
			hasUndo: false,
			hasRedo: false,
		} );
	} );
} );
