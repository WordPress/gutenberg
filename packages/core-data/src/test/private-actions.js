import apiFetch from '@wordpress/api-fetch';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { parse, serialize } from '@wordpress/blocks';
import { createRegistry } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '..';
import {
	editMediaEntity,
	persistEntityBlockAttributes,
	persistEntityCRDTDoc,
	setCollaborationSupported,
} from '../private-actions';
import { getSyncManager, hasSyncManager } from '../sync';
import { saveCRDTDoc } from '../utils';
import { unlock } from '../lock-unlock';

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
		saveCRDTDoc.mockReset();
		saveCRDTDoc.mockResolvedValue( true );
		entityConfig = {
			syncConfig: {
				supportsPersistence: true,
			},
		};
		select = {
			getEntityConfig: jest.fn( () => entityConfig ),
			getRawEntityRecord: jest.fn( () => ( {
				meta: { _crdt_document: 'persisted-doc' },
			} ) ),
		};
	} );

	it( 'persists CRDT docs for sync-enabled entities', async () => {
		const didPersist = await persistEntityCRDTDoc(
			'postType',
			'post',
			123
		)( { select } );

		expect( saveCRDTDoc ).toHaveBeenCalledWith(
			'postType/post',
			123,
			'persisted-doc'
		);
		expect( didPersist ).toBe( true );
	} );

	it( 'does not persist entities without persistence support', async () => {
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
	let entityConfig;
	let select;
	let syncManager;

	beforeEach( () => {
		apiFetch.mockReset();
		parse.mockReset();
		serialize.mockReset();
		syncManager = {
			createPersistedCRDTDoc: jest
				.fn()
				.mockResolvedValue( 'serialized CRDT document' ),
		};
		getSyncManager.mockReturnValue( syncManager );
		entityConfig = {
			baseURL: '/wp/v2/posts',
			syncConfig: { supportsPersistence: true },
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

	it( 'persists targeted block attributes with matching content and CRDT metadata', async () => {
		parse.mockReturnValue( [
			{
				name: 'core/paragraph',
				attributes: {},
				innerBlocks: [],
			},
		] );
		serialize.mockReturnValue( 'serialized repaired block content' );

		const didPersist = await persistEntityBlockAttributes(
			'postType',
			'post',
			123,
			{
				record: { content: 'saved content' },
				blockPath: [ 0 ],
				attributes: { metadata: { noteId: [ 456 ] } },
			}
		)( { select } );

		expect( syncManager.createPersistedCRDTDoc ).toHaveBeenCalledWith(
			'postType/post',
			123,
			{
				blocks: [
					expect.objectContaining( {
						attributes: { metadata: { noteId: [ 456 ] } },
					} ),
				],
			}
		);
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp-sync/v1/save-entity',
			method: 'POST',
			data: {
				room: 'postType/post:123',
				expected_content: 'serialized repaired content',
				expected_doc: 'serialized CRDT document',
				content: 'serialized repaired block content',
				doc: 'serialized CRDT document',
			},
		} );
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
				record: { content: 'saved content' },
				blockPath: [ 1 ],
				attributes: { metadata: { noteId: [ 456 ] } },
			}
		)( { select } );

		expect( apiFetch ).not.toHaveBeenCalledWith(
			expect.objectContaining( { method: 'POST' } )
		);
		expect( didPersist ).toBe( false );
	} );

	it( 'resolves a moved block by its matching occurrence', async () => {
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
		)( { select } );

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
		expect( didPersist ).toBe( true );
	} );

	it( 'allows a validated dirty block at a stable path', async () => {
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
				isDirtyPathValid: () => true,
				blockCount: 1,
				blockName: 'core/paragraph',
				attributes: { metadata: { noteId: [ 456 ] } },
			}
		)( { select } );

		expect( didPersist ).toBe( true );
	} );

	it.each( [
		[ 'the matching blocks were reordered', 2, () => false ],
		[ 'the block count changed', 3, undefined ],
	] )(
		'refuses a dirty path when %s',
		async ( _label, blockCount, validator ) => {
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
						block?.attributes?.content === 'Dirty target',
					matchIndex: 0,
					matchCount: 1,
					isDirtyPathValid: validator,
					blockCount,
					blockName: 'core/paragraph',
					attributes: { metadata: { noteId: [ 456 ] } },
				}
			)( { select } );

			expect( apiFetch ).not.toHaveBeenCalledWith(
				expect.objectContaining( { method: 'POST' } )
			);
			expect( didPersist ).toBe( false );
		}
	);

	it( 'persists the selected occurrence among identical saved blocks', async () => {
		parse.mockReturnValue( [
			{ name: 'core/separator', attributes: {}, innerBlocks: [] },
			{ name: 'core/separator', attributes: {}, innerBlocks: [] },
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
		)( { select } );

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
		)( { select } );

		expect( parse ).not.toHaveBeenCalled();
		expect( apiFetch ).not.toHaveBeenCalled();
		expect( didPersist ).toBe( false );
	} );

	it( 'retries against fresh content after a cross-session conflict', async () => {
		const firstRecord = { content: 'first saved content' };
		const secondRecord = { content: 'second saved content' };
		select.getRawEntityRecord.mockReturnValue( firstRecord );
		parse.mockReturnValue( [
			{
				name: 'core/paragraph',
				attributes: {},
				innerBlocks: [],
			},
		] );
		serialize.mockReturnValue( 'repaired content' );
		const conflict = Object.assign( new Error( 'Conflict' ), {
			code: 'rest_sync_content_conflict',
		} );
		apiFetch
			.mockResolvedValueOnce( firstRecord )
			.mockRejectedValueOnce( conflict )
			.mockResolvedValueOnce( secondRecord )
			.mockResolvedValueOnce( {} );

		const didPersist = await persistEntityBlockAttributes(
			'postType',
			'post',
			123,
			{
				record: { content: 'stale content' },
				blockPath: [ 0 ],
				attributes: { metadata: { noteId: [ 456 ] } },
			}
		)( { select } );

		expect( parse ).toHaveBeenNthCalledWith( 1, 'first saved content' );
		expect( parse ).toHaveBeenNthCalledWith( 2, 'second saved content' );
		expect( didPersist ).toBe( true );
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

describe( 'saveDirtyEntities', () => {
	beforeEach( () => {
		apiFetch.mockReset();
	} );

	const postTypeConfig = {
		kind: 'postType',
		name: 'post',
		baseURL: '/wp/v2/posts',
		transientEdits: { blocks: true, selection: true },
		mergedEdits: { meta: true },
	};

	const postId = 44;

	const post = {
		id: postId,
		type: 'post',
		title: 'bar',
		content: 'bar',
		excerpt: 'crackers',
		status: 'draft',
	};

	const postEntityRecord = {
		key: postId,
		kind: 'postType',
		name: 'post',
		title: 'bar',
	};

	function createRegistryWithStoresAndEditedPost() {
		const registry = createRegistry();

		registry.register( blockEditorStore );
		registry.register( coreStore );
		registry.register( noticesStore );

		registry.dispatch( coreStore ).addEntities( [ postTypeConfig ] );

		registry
			.dispatch( coreStore )
			.receiveEntityRecords( 'postType', 'post', post );

		registry
			.dispatch( coreStore )
			.editEntityRecord( 'postType', 'post', postId, {
				content: 'new bar',
			} );

		return registry;
	}

	const hasEdits = ( registry ) =>
		registry
			.select( coreStore )
			.hasEditsForEntityRecord( 'postType', 'post', postId );

	const getContent = ( registry ) =>
		registry
			.select( coreStore )
			.getEditedEntityRecord( 'postType', 'post', postId ).content;

	const getMethod = ( options ) =>
		options.headers?.[ 'X-HTTP-Method-Override' ] ||
		options.method ||
		'GET';

	it( 'saves modified entities', async () => {
		apiFetch.mockImplementation( async ( options ) => {
			const method = getMethod( options );
			const { path, data } = options;

			if (
				method === 'PUT' &&
				path.startsWith( `/wp/v2/posts/${ postId }` )
			) {
				return { ...post, ...data };
			}

			throw {
				code: 'unknown_path',
				message: `Unknown path: ${ method } ${ path }`,
			};
		} );

		const registry = createRegistryWithStoresAndEditedPost();

		expect( hasEdits( registry ) ).toBe( true );

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
		} );

		expect( getContent( registry ) ).toBe( 'new bar' );
		expect( hasEdits( registry ) ).toBe( false );

		const notices = registry.select( noticesStore ).getNotices();
		expect( notices ).toMatchObject( [
			{
				status: 'success',
				content: 'Site updated.',
			},
		] );
	} );

	it( 'shows a notice to convey errors', async () => {
		apiFetch.mockImplementation( async ( options ) => {
			const method = getMethod( options );
			const { path } = options;

			throw {
				code: 'unknown_path',
				message: `Unknown path: ${ method } ${ path }`,
			};
		} );

		const registry = createRegistryWithStoresAndEditedPost();

		expect( hasEdits( registry ) ).toBe( true );

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
		} );

		expect( getContent( registry ) ).toBe( 'new bar' );
		expect( hasEdits( registry ) ).toBe( true );

		const notices = registry.select( noticesStore ).getNotices();
		expect( notices[ 0 ].status ).toBe( 'error' );
		expect( notices[ 0 ].content ).toMatch( /^Unknown path/ );
	} );

	it( 'derives error messages depending on failure scenario', async () => {
		const registry = createRegistryWithStoresAndEditedPost();

		// Throw an object with a `message` property
		apiFetch.mockImplementation( async () => {
			throw {
				message: 'Lorem ipsum',
			};
		} );

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
		} );

		expect(
			registry.select( noticesStore ).getNotices().at( -1 )
		).toMatchObject( {
			status: 'error',
			content: 'Lorem ipsum',
		} );

		// Throw an object with an empty `message` property
		apiFetch.mockImplementation( async () => {
			throw {
				message: '',
			};
		} );

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
		} );

		expect(
			registry.select( noticesStore ).getNotices().at( -1 )
		).toMatchObject( {
			status: 'error',
			content: 'Saving failed.',
		} );

		// Throw an actual error
		apiFetch.mockImplementation( async () => {
			throw new Error( 'Dolor sit amet' );
		} );

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
		} );

		expect(
			registry.select( noticesStore ).getNotices().at( -1 )
		).toMatchObject( {
			status: 'error',
			content: 'Dolor sit amet',
		} );

		// Throw a string
		apiFetch.mockImplementation( async () => {
			throw 'Consectetur adipiscing elit';
		} );

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
		} );

		expect(
			registry.select( noticesStore ).getNotices().at( -1 )
		).toMatchObject( {
			status: 'error',
			content: 'Consectetur adipiscing elit',
		} );

		// Throw an object implementing `toString`
		apiFetch.mockImplementation( async () => {
			throw {
				toString() {
					return 'Sed do eiusmod tempor incididunt';
				},
			};
		} );

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
		} );

		expect(
			registry.select( noticesStore ).getNotices().at( -1 )
		).toMatchObject( {
			status: 'error',
			content: 'Sed do eiusmod tempor incididunt',
		} );

		// Throw something with no clear message
		apiFetch.mockImplementation( async () => {
			throw {};
		} );

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
		} );

		expect(
			registry.select( noticesStore ).getNotices().at( -1 )
		).toMatchObject( {
			status: 'error',
			content: 'Saving failed.',
		} );
	} );

	it( 'aborts if `onSave` fails', async () => {
		apiFetch.mockImplementation( async () => {
			throw {
				code: 'unknown_path',
				message: 'Unknown path',
			};
		} );

		const registry = createRegistryWithStoresAndEditedPost();

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
			async onSave() {
				throw new Error( 'oh no' );
			},
		} );

		expect( hasEdits( registry ) ).toBe( true );

		const notices = registry.select( noticesStore ).getNotices();
		expect( notices ).toMatchObject( [
			{
				status: 'error',
				content: 'oh no',
			},
		] );
	} );

	it( 'honors the `successNoticeContent` prop', async () => {
		apiFetch.mockImplementation( async ( options ) => {
			const { data } = options;
			return { ...post, ...data };
		} );

		const registry = createRegistryWithStoresAndEditedPost();

		await unlock( registry.dispatch( coreStore ) ).saveDirtyEntities( {
			dirtyEntityRecords: [ postEntityRecord ],
			successNoticeContent: 'eureka',
		} );

		const notices = registry.select( noticesStore ).getNotices();
		expect( notices ).toMatchObject( [
			{
				status: 'success',
				content: 'eureka',
			},
		] );
	} );
} );
