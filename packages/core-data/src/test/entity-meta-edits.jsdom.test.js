import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import { createRegistry } from '@wordpress/data';
import { store as coreDataStore } from '../index';
import { registerEntitySyncManager } from '../entity-sync';

vi.mock( import( '@wordpress/api-fetch' ) );

describe( 'saving edited post metadata', () => {
	let registry;
	let actions;
	let selectors;
	let post;
	let unregisterManager;

	beforeEach( async () => {
		apiFetch.mockReset();
		registry = createRegistry();
		registry.register( coreDataStore );
		actions = registry.dispatch( coreDataStore );
		selectors = registry.select( coreDataStore );
		apiFetch.mockResolvedValueOnce( {
			post: { name: 'Posts', rest_base: 'posts', taxonomies: [] },
		} );
		await registry
			.resolveSelect( coreDataStore )
			.getEntitiesConfig( 'postType' );
		apiFetch.mockReset();
		post = {
			id: 1,
			status: 'publish',
			title: 'A post',
			content: 'Post content',
			excerpt: 'Post excerpt',
			meta: { first: 'saved first', second: 'saved second' },
		};
		receive( post );
		apiFetch.mockResolvedValue( post );
	} );

	afterEach( () => {
		unregisterManager?.();
		unregisterManager = undefined;
	} );

	function receive( record ) {
		actions.receiveEntityRecords( 'postType', 'post', record );
		actions.finishResolution( 'getEntityRecord', [
			'postType',
			'post',
			record.id,
		] );
	}

	function editMeta( meta, options ) {
		actions.editEntityRecord(
			'postType',
			'post',
			post.id,
			{ meta },
			options
		);
	}

	function registerDocumentSyncManager() {
		const manager = {
			update: vi.fn(),
			beforeSave: vi.fn( ( _kind, _name, _id, edits ) => ( {
				meta: { ...edits.meta, _crdt_document: 'new document' },
			} ) ),
			afterSave: vi.fn(),
		};
		unregisterManager = registerEntitySyncManager( manager );
		return manager;
	}

	function getMeta() {
		return selectors.getEditedEntityRecord( 'postType', 'post', post.id )
			.meta;
	}

	function save( options ) {
		return actions.saveEditedEntityRecord(
			'postType',
			'post',
			post.id,
			options
		);
	}

	function expectSavedMeta( meta ) {
		expect( apiFetch ).toHaveBeenLastCalledWith( {
			path: '/wp/v2/posts/1',
			method: 'PUT',
			data: { id: 1, meta },
		} );
	}

	it( 'sends only the edited key and keeps untouched default and invalid values out of the request', async () => {
		post.meta = {
			first: '',
			empty: '',
			boolean: false,
			invalid: null,
		};
		receive( post );
		editMeta( { first: 'changed' } );

		expect( getMeta() ).toEqual( { ...post.meta, first: 'changed' } );

		await save();

		expectSavedMeta( { first: 'changed' } );
	} );

	it( 'does not overwrite a server change to an untouched key when saving another key', async () => {
		editMeta( { second: 'edited second' } );
		// The server changes first after this client has loaded the post.
		apiFetch.mockResolvedValue( {
			...post,
			meta: { first: 'server first', second: 'edited second' },
		} );

		await save();

		expectSavedMeta( { second: 'edited second' } );
		expect( getMeta() ).toEqual( {
			first: 'server first',
			second: 'edited second',
		} );
	} );

	it( 'uses refreshed values for untouched keys while retaining a local key edit', async () => {
		editMeta( { second: 'edited second' } );
		receive( { ...post, meta: { ...post.meta, first: 'server first' } } );

		expect( getMeta() ).toEqual( {
			first: 'server first',
			second: 'edited second',
		} );

		await save();

		expectSavedMeta( { second: 'edited second' } );
	} );

	it( 'retains an intentional null reset and clears it after the server returns the default', async () => {
		editMeta( { first: null } );
		apiFetch.mockResolvedValue( {
			...post,
			meta: { ...post.meta, first: '' },
		} );

		await save();

		expectSavedMeta( { first: null } );
		expect( getMeta().first ).toBe( '' );
		expect(
			selectors.hasEditsForEntityRecord( 'postType', 'post', post.id )
		).toBe( false );
	} );

	it( 'replaces an edited object value without merging its nested properties', async () => {
		post.meta = {
			first: { keep: 'old', remove: 'old' },
			second: 'saved second',
		};
		receive( post );
		editMeta( { first: { keep: 'new' } } );

		expect( getMeta() ).toEqual( {
			first: { keep: 'new' },
			second: 'saved second',
		} );

		await save();

		expectSavedMeta( { first: { keep: 'new' } } );
	} );

	it.each( [
		{ name: 'empty string', value: '' },
		{ name: 'false', value: false },
		{ name: 'zero', value: 0 },
		{ name: 'empty array', value: [] },
	] )( 'preserves an intentional $name', async ( { value } ) => {
		editMeta( { first: value } );
		expect( getMeta().first ).toEqual( value );

		await save();

		expectSavedMeta( { first: value } );
	} );

	it( 'keeps edits to several keys without sending an untouched key', async () => {
		post.meta.third = 'saved third';
		receive( post );
		editMeta( { first: 'edited first' } );
		editMeta( { second: 'edited second' } );

		expect( getMeta() ).toEqual( {
			first: 'edited first',
			second: 'edited second',
			third: 'saved third',
		} );

		await save();

		expectSavedMeta( {
			first: 'edited first',
			second: 'edited second',
		} );
	} );

	it( 'drops a reverted key without dropping another pending key', async () => {
		editMeta( { first: 'edited first' } );
		editMeta( { second: 'edited second' } );
		editMeta( { first: post.meta.first } );
		expect( getMeta() ).toEqual( {
			...post.meta,
			second: 'edited second',
		} );

		await save();

		expectSavedMeta( { second: 'edited second' } );
	} );

	it( 'undoes and redoes key edits without marking an untouched key for saving', async () => {
		post.meta.third = 'saved third';
		receive( post );
		editMeta( { first: 'edited first' } );
		editMeta( { second: 'edited second' } );

		actions.undo();
		expect( getMeta() ).toEqual( {
			first: 'edited first',
			second: 'saved second',
			third: 'saved third',
		} );
		actions.redo();
		expect( getMeta() ).toEqual( {
			first: 'edited first',
			second: 'edited second',
			third: 'saved third',
		} );

		await save();

		expectSavedMeta( {
			first: 'edited first',
			second: 'edited second',
		} );
	} );

	it( 'undoes and redoes cached changes to different keys as one complete edit', async () => {
		editMeta( { first: 'edited first' }, { isCached: true } );
		editMeta( { second: 'edited second' }, { isCached: true } );
		actions.__unstableCreateUndoLevel();

		actions.undo();
		expect( getMeta() ).toEqual( post.meta );
		expect(
			selectors.hasEditsForEntityRecord( 'postType', 'post', post.id )
		).toBe( false );
		actions.redo();
		expect( getMeta() ).toEqual( {
			first: 'edited first',
			second: 'edited second',
		} );

		await save();

		expectSavedMeta( {
			first: 'edited first',
			second: 'edited second',
		} );
	} );

	it( 'retains every key when cached changes join a preceding undo level', () => {
		editMeta( { first: 'edited first' } );
		editMeta( { second: 'edited second' }, { isCached: true } );
		editMeta( { first: 'edited first again' }, { isCached: true } );

		actions.undo();
		expect( getMeta() ).toEqual( post.meta );
		actions.redo();
		expect( getMeta() ).toEqual( {
			first: 'edited first again',
			second: 'edited second',
		} );
	} );

	it( 'restores a saved key on undo and clears the edit when redo matches the saved value', async () => {
		editMeta( { first: 'edited first' } );
		apiFetch.mockResolvedValue( {
			...post,
			meta: { ...post.meta, first: 'edited first' },
		} );
		await save();

		actions.undo();
		expect( getMeta() ).toEqual( post.meta );
		expect(
			selectors.hasEditsForEntityRecord( 'postType', 'post', post.id )
		).toBe( true );
		actions.redo();
		expect( getMeta() ).toEqual( {
			...post.meta,
			first: 'edited first',
		} );
		expect(
			selectors.hasEditsForEntityRecord( 'postType', 'post', post.id )
		).toBe( false );
		actions.undo();
		apiFetch.mockResolvedValue( post );

		await save();

		expectSavedMeta( { first: 'saved first' } );
	} );

	it( 'restores both cached keys after a save without changing an untouched sibling', async () => {
		post.meta.third = 'saved third';
		receive( post );
		editMeta( { first: 'edited first' }, { isCached: true } );
		editMeta( { second: 'edited second' }, { isCached: true } );
		apiFetch.mockResolvedValue( {
			...post,
			meta: {
				...post.meta,
				first: 'edited first',
				second: 'edited second',
			},
		} );
		await save();

		actions.undo();
		expect( getMeta() ).toEqual( post.meta );
		actions.redo();
		expect( getMeta() ).toEqual( {
			first: 'edited first',
			second: 'edited second',
			third: 'saved third',
		} );
		expect(
			selectors.hasEditsForEntityRecord( 'postType', 'post', post.id )
		).toBe( false );
		actions.undo();
		apiFetch.mockResolvedValue( post );

		await save();

		expectSavedMeta( {
			first: 'saved first',
			second: 'saved second',
		} );
	} );

	it( 'preserves a refreshed untouched key when undoing and redoing a local key edit', async () => {
		editMeta( { first: 'edited first' } );
		receive( {
			...post,
			meta: { ...post.meta, second: 'server second' },
		} );

		actions.undo();
		expect( getMeta() ).toEqual( {
			first: 'saved first',
			second: 'server second',
		} );
		actions.redo();
		expect( getMeta() ).toEqual( {
			first: 'edited first',
			second: 'server second',
		} );

		await save();

		expectSavedMeta( { first: 'edited first' } );
	} );

	it( 'keeps a key edited during a save without resending the key that was saved', async () => {
		let resolveSave;
		apiFetch.mockImplementationOnce(
			() =>
				new Promise( ( resolve ) => {
					resolveSave = resolve;
				} )
		);
		editMeta( { first: 'edited first' } );
		const saving = save();
		await vi.waitFor( () => expect( apiFetch ).toHaveBeenCalledOnce() );

		editMeta( { second: 'edited second' } );
		resolveSave( {
			...post,
			meta: { ...post.meta, first: 'edited first' },
		} );
		await saving;
		apiFetch.mockResolvedValue( {
			...post,
			meta: { first: 'edited first', second: 'edited second' },
		} );

		await save();

		expectSavedMeta( { second: 'edited second' } );
		expect(
			selectors.hasEditsForEntityRecord( 'postType', 'post', post.id )
		).toBe( false );
	} );

	it( 'retains a newer edit to the same key when an older save finishes', async () => {
		let resolveSave;
		apiFetch.mockImplementationOnce(
			() =>
				new Promise( ( resolve ) => {
					resolveSave = resolve;
				} )
		);
		editMeta( { first: 'submitted first' } );
		const saving = save();
		await vi.waitFor( () => expect( apiFetch ).toHaveBeenCalledOnce() );

		editMeta( { first: 'newer first' } );
		resolveSave( {
			...post,
			meta: { ...post.meta, first: 'submitted first' },
		} );
		await saving;

		expect( getMeta() ).toEqual( {
			...post.meta,
			first: 'newer first',
		} );
		expect(
			selectors.hasEditsForEntityRecord( 'postType', 'post', post.id )
		).toBe( true );
		apiFetch.mockResolvedValue( {
			...post,
			meta: { ...post.meta, first: 'newer first' },
		} );

		await save();

		expectSavedMeta( { first: 'newer first' } );
		expect(
			selectors.hasEditsForEntityRecord( 'postType', 'post', post.id )
		).toBe( false );
	} );

	it( 'preserves a key reverted to its pre-save value while its earlier value is being saved', async () => {
		let resolveSave;
		apiFetch.mockImplementationOnce(
			() =>
				new Promise( ( resolve ) => {
					resolveSave = resolve;
				} )
		);
		editMeta( { first: 'submitted first' } );
		const saving = save();
		await vi.waitFor( () => expect( apiFetch ).toHaveBeenCalledOnce() );

		editMeta( { second: 'edited second' } );
		editMeta( { first: post.meta.first } );
		resolveSave( {
			...post,
			meta: { ...post.meta, first: 'submitted first' },
		} );
		await saving;

		expect( getMeta() ).toEqual( {
			first: 'saved first',
			second: 'edited second',
		} );
		apiFetch.mockResolvedValue( {
			...post,
			meta: { ...post.meta, second: 'edited second' },
		} );

		await save();

		expectSavedMeta( {
			first: 'saved first',
			second: 'edited second',
		} );
	} );

	it( 'protects only owned keys when a complete metadata object is edited during a save', async () => {
		post.meta.empty = '';
		post.meta.boolean = false;
		post.meta.invalid = null;
		receive( post );
		let resolveSave;
		apiFetch.mockImplementationOnce(
			() =>
				new Promise( ( resolve ) => {
					resolveSave = resolve;
				} )
		);
		editMeta( { first: 'submitted first' } );
		const saving = save();
		await vi.waitFor( () => expect( apiFetch ).toHaveBeenCalledOnce() );

		editMeta( {
			...getMeta(),
			first: post.meta.first,
			second: 'edited second',
		} );
		resolveSave( {
			...post,
			meta: { ...post.meta, first: 'submitted first' },
		} );
		await saving;

		expect( getMeta() ).toEqual( {
			...post.meta,
			second: 'edited second',
		} );
		apiFetch.mockResolvedValue( {
			...post,
			meta: { ...post.meta, second: 'edited second' },
		} );

		await save();

		expectSavedMeta( {
			first: 'saved first',
			second: 'edited second',
		} );
	} );

	it( 'preserves an undo performed while the undone value is being saved', async () => {
		let resolveSave;
		apiFetch.mockImplementationOnce(
			() =>
				new Promise( ( resolve ) => {
					resolveSave = resolve;
				} )
		);
		editMeta( { first: 'submitted first' } );
		const saving = save();
		await vi.waitFor( () => expect( apiFetch ).toHaveBeenCalledOnce() );

		actions.undo();
		resolveSave( {
			...post,
			meta: { ...post.meta, first: 'submitted first' },
		} );
		await saving;

		expect( getMeta() ).toEqual( post.meta );
		expect(
			selectors.hasEditsForEntityRecord( 'postType', 'post', post.id )
		).toBe( true );
		apiFetch.mockResolvedValue( post );

		await save();

		expectSavedMeta( { first: 'saved first' } );
	} );

	it( 'accepts a server-normalized key while preserving a different edit made during the save', async () => {
		let resolveSave;
		apiFetch.mockImplementationOnce(
			() =>
				new Promise( ( resolve ) => {
					resolveSave = resolve;
				} )
		);
		editMeta( { first: ' raw value ' } );
		const saving = save();
		await vi.waitFor( () => expect( apiFetch ).toHaveBeenCalledOnce() );

		editMeta( { second: 'edited second' } );
		resolveSave( {
			...post,
			meta: { ...post.meta, first: 'raw value' },
		} );
		await saving;

		expect( getMeta() ).toEqual( {
			first: 'raw value',
			second: 'edited second',
		} );
		await save();
		expectSavedMeta( { second: 'edited second' } );
	} );

	it( 'retains a pending key after a failed save and retries only that key', async () => {
		const error = { code: 'rest_error', message: 'The save failed.' };
		apiFetch.mockRejectedValueOnce( error );
		editMeta( { first: 'edited first' } );

		await save();

		expect(
			selectors.getLastEntitySaveError( 'postType', 'post', post.id )
		).toEqual( error );
		expect( getMeta().first ).toBe( 'edited first' );

		await save();

		expectSavedMeta( { first: 'edited first' } );
	} );

	it.each( [ 'publish', 'draft', 'auto-draft' ] )(
		'preserves the complete metadata snapshot when autosaving a %s',
		async ( status ) => {
			post.status = status;
			receive( post );
			editMeta( { first: 'edited first' } );
			apiFetch.mockResolvedValue( {
				...post,
				id: status === 'publish' ? 2 : post.id,
				status: status === 'auto-draft' ? 'draft' : status,
				meta: { ...post.meta, first: 'edited first' },
			} );

			await save( { isAutosave: true } );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/posts/1/autosaves',
				method: 'POST',
				data: {
					status: status === 'auto-draft' ? 'draft' : undefined,
					title: status === 'auto-draft' ? '' : post.title,
					content: post.content,
					excerpt: post.excerpt,
					meta: { ...post.meta, first: 'edited first' },
				},
			} );
		}
	);

	it( 'uses the persisted value of a reverted key instead of its previous autosave value', async () => {
		editMeta( { first: 'previous autosave first' } );
		apiFetch.mockResolvedValue( {
			...post,
			id: 2,
			meta: { ...post.meta, first: 'previous autosave first' },
		} );
		await save( { isAutosave: true } );
		editMeta( { first: post.meta.first } );
		editMeta( { second: 'edited second' } );
		apiFetch.mockResolvedValue( {
			...post,
			id: 2,
			meta: { ...post.meta, second: 'edited second' },
		} );

		await save( { isAutosave: true } );

		expect( apiFetch ).toHaveBeenLastCalledWith( {
			path: '/wp/v2/posts/1/autosaves',
			method: 'POST',
			data: {
				status: undefined,
				title: post.title,
				content: post.content,
				excerpt: post.excerpt,
				meta: { ...post.meta, second: 'edited second' },
			},
		} );
		expect( getMeta() ).toEqual( {
			...post.meta,
			second: 'edited second',
		} );
	} );

	it( 'undoes a cached title and metadata change atomically', () => {
		actions.editEntityRecord(
			'postType',
			'post',
			post.id,
			{ title: 'Edited title', meta: { first: 'edited first' } },
			{ isCached: true }
		);

		actions.undo();
		const restored = selectors.getEditedEntityRecord(
			'postType',
			'post',
			post.id
		);
		expect( restored.title ).toBe( post.title );
		expect( restored.meta ).toEqual( post.meta );
		actions.redo();
		const redone = selectors.getEditedEntityRecord(
			'postType',
			'post',
			post.id
		);
		expect( redone.title ).toBe( 'Edited title' );
		expect( redone.meta ).toEqual( {
			...post.meta,
			first: 'edited first',
		} );
	} );

	it( 'saves the sync document with the edited key and accepts server changes to untouched keys', async () => {
		post.meta._crdt_document = 'old document';
		receive( post );
		const manager = registerDocumentSyncManager();
		editMeta( { first: 'edited first' } );
		apiFetch.mockResolvedValue( {
			...post,
			meta: {
				first: 'edited first',
				second: 'server second',
				_crdt_document: 'new document',
			},
		} );

		await save();

		expect( manager.update.mock.calls[ 0 ][ 3 ].meta ).toEqual( {
			...post.meta,
			first: 'edited first',
		} );
		expect( manager.beforeSave.mock.calls[ 0 ][ 3 ].meta ).toEqual( {
			first: 'edited first',
		} );
		expectSavedMeta( {
			first: 'edited first',
			_crdt_document: 'new document',
		} );
		expect( getMeta() ).toEqual( {
			first: 'edited first',
			second: 'server second',
			_crdt_document: 'new document',
		} );
		expect(
			selectors.hasEditsForEntityRecord( 'postType', 'post', post.id )
		).toBe( false );
	} );

	it( 'retains untouched autosave metadata when a sync manager adds the document', async () => {
		post.meta._crdt_document = 'old document';
		receive( post );
		registerDocumentSyncManager();
		editMeta( { first: 'edited first' } );
		apiFetch.mockResolvedValue( { ...post, id: 2 } );

		await save( { isAutosave: true } );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/posts/1/autosaves',
			method: 'POST',
			data: {
				status: undefined,
				title: post.title,
				content: post.content,
				excerpt: post.excerpt,
				meta: {
					first: 'edited first',
					second: 'saved second',
					_crdt_document: 'new document',
				},
			},
		} );
	} );

	it( 'does not filter an explicit saveEntityRecord request', async () => {
		const meta = { first: post.meta.first, second: null };
		await actions.saveEntityRecord( 'postType', 'post', {
			id: post.id,
			meta,
		} );

		expect( apiFetch ).toHaveBeenCalledOnce();
		expectSavedMeta( meta );
	} );

	it( 'retains a pending pre-save revert with legacy merged-edit semantics', async () => {
		registry = createRegistry();
		registry.register( coreDataStore );
		actions = registry.dispatch( coreDataStore );
		selectors = registry.select( coreDataStore );
		actions.addEntities( [
			{
				kind: 'postType',
				name: 'post',
				baseURL: '/wp/v2/posts',
				mergedEdits: { meta: true },
			},
		] );
		actions.finishResolution( 'getEntitiesConfig', [ 'postType' ] );
		receive( post );
		let resolveSave;
		apiFetch.mockImplementationOnce(
			() =>
				new Promise( ( resolve ) => {
					resolveSave = resolve;
				} )
		);
		editMeta( { first: 'submitted first' } );
		const saving = save();
		await vi.waitFor( () => expect( apiFetch ).toHaveBeenCalledOnce() );

		editMeta( { second: 'edited second' } );
		editMeta( { first: post.meta.first } );
		resolveSave( {
			...post,
			meta: { ...post.meta, first: 'submitted first' },
		} );
		await saving;

		expect( getMeta() ).toEqual( {
			first: 'saved first',
			second: 'edited second',
		} );
		await save();
		expectSavedMeta( {
			first: 'saved first',
			second: 'edited second',
		} );
	} );

	it( 'preserves merged-edit request semantics for a custom entity', async () => {
		const custom = {
			id: 1,
			meta: { first: 'saved first', second: 'saved second' },
		};
		actions.addEntities( [
			{
				kind: 'custom',
				name: 'record',
				baseURL: '/custom/v1/records',
				mergedEdits: { meta: true },
			},
		] );
		actions.receiveEntityRecords( 'custom', 'record', custom );
		actions.finishResolution( 'getEntityRecord', [
			'custom',
			'record',
			1,
		] );
		apiFetch.mockResolvedValue( custom );
		actions.editEntityRecord( 'custom', 'record', 1, {
			meta: { first: 'edited first' },
		} );

		await actions.saveEditedEntityRecord( 'custom', 'record', 1 );

		expect( apiFetch ).toHaveBeenLastCalledWith( {
			path: '/custom/v1/records/1',
			method: 'PUT',
			data: {
				id: 1,
				meta: { first: 'edited first', second: 'saved second' },
			},
		} );
	} );
} );
