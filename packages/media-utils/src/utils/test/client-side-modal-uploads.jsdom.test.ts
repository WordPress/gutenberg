import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const addItems = vi.fn();
const getSettings = vi.fn( () => ( { mediaUpload: () => {} } ) );
const getItems = vi.fn( (): any[] => [] );
const detectClientSideMediaSupport = vi.fn( () => ( { supported: true } ) );
const isHeicCanvasSupported = vi.fn( () => false );
const unsubscribe = vi.fn();
let notifyStoreChange: () => void = () => {};

vi.mock(
	import( '@wordpress/data' ),
	() =>
		( {
			dispatch: () => ( { addItems } ),
			select: () => ( { getSettings, getItems } ),
			subscribe: ( listener: () => void ) => {
				notifyStoreChange = listener;
				return unsubscribe;
			},
		} ) as any
);

/**
 * A Backbone-ish attachment model with only the methods the module calls.
 *
 * @param attributes Initial model attributes.
 */
function createModel( attributes: Record< string, unknown > ) {
	return {
		attributes,
		set: vi.fn( ( values ) => Object.assign( attributes, values ) ),
		unset: vi.fn( ( key: string ) => delete attributes[ key ] ),
		destroy: vi.fn(),
		fetch: vi.fn( () => {
			const deferred = {
				done: ( fn: () => void ) => {
					fn();
					return deferred;
				},
				fail: () => deferred,
				always: ( fn: () => void ) => {
					fn();
					return deferred;
				},
			};
			return deferred;
		} ),
	};
}

/**
 * Installs the `wp` and `plupload` globals the module patches, and returns the
 * handles a test needs to drive them.
 */
function setUpGlobals() {
	const created: ReturnType< typeof createModel >[] = [];
	const queue = {
		add: vi.fn(),
		all: vi.fn( () => true ),
		reset: vi.fn(),
	};
	const errors = { unshift: vi.fn() };

	function Uploader() {}
	Uploader.prototype.init = vi.fn();
	Uploader.queue = queue;
	Uploader.errors = errors;

	( window as any ).plupload = { FAILED: 4 };
	( window as any ).wp = {
		Uploader,
		uploadMedia: {
			detectClientSideMediaSupport: () => detectClientSideMediaSupport(),
			isHeicCanvasSupported: () => isHeicCanvasSupported(),
		},
		media: {
			model: {
				settings: { post: { id: 42 } },
				Attachment: {
					create: vi.fn( ( attributes ) => {
						const model = createModel( attributes );
						created.push( model );
						return model;
					} ),
					get: vi.fn(),
				},
			},
		},
	};

	return { Uploader, queue, errors, created };
}

/**
 * Runs the patched `init` for one uploader and returns its FilesAdded handler
 * alongside the plupload and wp.Uploader stand-ins it was bound with.
 *
 * @param Uploader The patched `wp.Uploader` constructor.
 */
function createUploader( Uploader: any ) {
	const bindings: Array< {
		event: string;
		handler: Function;
		priority: number;
	} > = [];
	const up = {
		settings: {
			multipart_params: {
				action: 'upload-attachment',
				_wpnonce: 'nonce',
				post_id: '42',
				custom_field: 'kept',
			},
		},
		bind: vi.fn(
			(
				event: string,
				handler: Function,
				scope: unknown,
				priority: number
			) => bindings.push( { event, handler, priority } )
		),
		removeFile: vi.fn(),
		refresh: vi.fn(),
	};
	const wpUploader = {
		uploader: up,
		added: vi.fn(),
		success: vi.fn(),
		error: vi.fn(),
	};

	Uploader.prototype.init.call( wpUploader );

	return { up, wpUploader, bindings };
}

function createPluploadFile( name = 'test.jpeg' ) {
	const native = new window.File( [ 'file' ], name, { type: 'image/jpeg' } );
	return {
		status: 1,
		name,
		size: 4,
		loaded: 0,
		percent: 0,
		type: 'image/jpeg',
		getNative: () => native,
		native,
	};
}

async function loadModule() {
	vi.resetModules();
	return await import( '../client-side-modal-uploads' );
}

describe( 'installClientSideModalUploads', () => {
	beforeEach( () => {
		( window as any ).__clientSideMediaProcessing = true;
	} );

	afterEach( () => {
		vi.clearAllMocks();
		getItems.mockReturnValue( [] );
		notifyStoreChange = () => {};
		delete ( window as any ).wp;
		delete ( window as any ).plupload;
		delete ( window as any ).__clientSideMediaProcessing;
	} );

	it( 'binds FilesAdded ahead of the built-in handler', async () => {
		const { Uploader } = setUpGlobals();
		const { installClientSideModalUploads } = await loadModule();

		installClientSideModalUploads();
		const { bindings } = createUploader( Uploader );

		expect( bindings ).toHaveLength( 1 );
		expect( bindings[ 0 ].event ).toBe( 'FilesAdded' );
		// plupload runs handlers in descending priority order, and the
		// built-in one is bound at the default priority of 0.
		expect( bindings[ 0 ].priority ).toBeGreaterThan( 0 );
	} );

	it( 'does nothing without the wp.Uploader global', async () => {
		const { installClientSideModalUploads } = await loadModule();

		expect( () => installClientSideModalUploads() ).not.toThrow();
	} );

	it( 'routes a file through the pipeline instead of plupload', async () => {
		const { Uploader, queue, created } = setUpGlobals();
		const { installClientSideModalUploads } = await loadModule();

		installClientSideModalUploads();
		const { up, wpUploader, bindings } = createUploader( Uploader );
		const file = createPluploadFile();

		const result = bindings[ 0 ].handler( up, [ file ] );

		// Returning false suppresses plupload's own upload.
		expect( result ).toBe( false );
		expect( up.removeFile ).toHaveBeenCalledWith( file );

		// The modal's uploading tile is created as usual.
		expect( queue.add ).toHaveBeenCalledWith( created[ 0 ] );
		expect( wpUploader.added ).toHaveBeenCalledWith( created[ 0 ] );
		expect( created[ 0 ].attributes ).toMatchObject( {
			uploading: true,
			filename: 'test.jpeg',
			uploadedTo: 42,
			type: 'image',
			subtype: 'jpeg',
		} );

		// The file is queued with the multipart params plugins added, minus
		// the fields that only mean something to async-upload.php.
		expect( addItems ).toHaveBeenCalledWith(
			expect.objectContaining( {
				files: [ file.native ],
				additionalData: { custom_field: 'kept', post: 42 },
			} )
		);
	} );

	it( 'leaves the batch to plupload when the pipeline is unavailable', async () => {
		delete ( window as any ).__clientSideMediaProcessing;
		const { Uploader } = setUpGlobals();
		const { installClientSideModalUploads } = await loadModule();

		installClientSideModalUploads();
		const { up, bindings } = createUploader( Uploader );

		// Returning undefined lets the built-in handler run.
		expect(
			bindings[ 0 ].handler( up, [ createPluploadFile() ] )
		).toBeUndefined();
		expect( addItems ).not.toHaveBeenCalled();
	} );

	it( 'leaves the batch to plupload when a file has no native File', async () => {
		const { Uploader } = setUpGlobals();
		const { installClientSideModalUploads } = await loadModule();

		installClientSideModalUploads();
		const { up, bindings } = createUploader( Uploader );
		const file = { ...createPluploadFile(), getNative: () => null };

		expect( bindings[ 0 ].handler( up, [ file ] ) ).toBeUndefined();
		expect( addItems ).not.toHaveBeenCalled();
	} );

	it( 'only takes HEIC files when the browser converts HEIC alone', async () => {
		detectClientSideMediaSupport.mockReturnValue( { supported: false } );
		isHeicCanvasSupported.mockReturnValue( true );

		const { Uploader } = setUpGlobals();
		const { installClientSideModalUploads } = await loadModule();

		installClientSideModalUploads();
		const { up, bindings } = createUploader( Uploader );

		expect(
			bindings[ 0 ].handler( up, [ createPluploadFile() ] )
		).toBeUndefined();

		const heic = {
			...createPluploadFile( 'test.heic' ),
			type: 'image/heic',
		};
		expect( bindings[ 0 ].handler( up, [ heic ] ) ).toBe( false );

		detectClientSideMediaSupport.mockReturnValue( { supported: true } );
		isHeicCanvasSupported.mockReturnValue( false );
	} );

	it( 'syncs the tile with the finished attachment', async () => {
		const { Uploader, created } = setUpGlobals();
		const { installClientSideModalUploads } = await loadModule();

		installClientSideModalUploads();
		const { up, wpUploader, bindings } = createUploader( Uploader );

		bindings[ 0 ].handler( up, [ createPluploadFile() ] );
		addItems.mock.calls[ 0 ][ 0 ].onSuccess( [ { id: 99 } ] );

		const model = created[ 0 ];
		expect( model.attributes ).toMatchObject( {
			id: 99,
			uploading: false,
		} );
		expect( model.attributes.percent ).toBeUndefined();
		expect( wpUploader.success ).toHaveBeenCalledWith( model );

		// The id must not be set silently: Attachments re-keys the model from
		// its cid to its id on the change event, and a silent set skips it.
		expect( model.set ).toHaveBeenCalledWith( { id: 99 } );
	} );

	it( 'reports the outcome of an upload only once', async () => {
		const { Uploader, created } = setUpGlobals();
		const { installClientSideModalUploads } = await loadModule();

		installClientSideModalUploads();
		const { up, wpUploader, bindings } = createUploader( Uploader );

		bindings[ 0 ].handler( up, [ createPluploadFile() ] );
		const { onSuccess, onError } = addItems.mock.calls[ 0 ][ 0 ];

		onError( new Error( 'Upload cancelled' ) );
		// The store can report a parent item twice, and a cancel can be
		// followed by a late success. Neither may revive a destroyed tile.
		onSuccess( [ { id: 99 } ] );
		onSuccess( [ { id: 99 } ] );

		expect( created[ 0 ].destroy ).toHaveBeenCalledTimes( 1 );
		expect( created[ 0 ].fetch ).not.toHaveBeenCalled();
		expect( wpUploader.success ).not.toHaveBeenCalled();
	} );

	it( 'tracks progress for its own queue item only', async () => {
		const { Uploader, created } = setUpGlobals();
		const { installClientSideModalUploads } = await loadModule();

		installClientSideModalUploads();
		const { up, bindings } = createUploader( Uploader );

		bindings[ 0 ].handler( up, [ createPluploadFile() ] );
		const { onSuccess } = addItems.mock.calls[ 0 ][ 0 ];

		// An item the block editor queued for the very same file must not
		// claim this upload's tile.
		getItems.mockReturnValue( [
			{ id: 'other', onSuccess: () => {}, operations: [ 'a', 'b' ] },
			{ id: 'mine', onSuccess, operations: [ 'a', 'b', 'c', 'd' ] },
		] );
		notifyStoreChange();

		expect( created[ 0 ].attributes.percent ).toBe( 0 );

		getItems.mockReturnValue( [
			{ id: 'other', onSuccess: () => {}, operations: [] },
			{ id: 'mine', onSuccess, operations: [ 'c', 'd' ] },
		] );
		notifyStoreChange();

		expect( created[ 0 ].attributes.percent ).toBe( 50 );
	} );

	it( 'fails a tile whose queue item disappears without reporting', async () => {
		const { Uploader, errors, created } = setUpGlobals();
		const { installClientSideModalUploads } = await loadModule();

		installClientSideModalUploads();
		const { up, bindings } = createUploader( Uploader );

		bindings[ 0 ].handler( up, [ createPluploadFile() ] );
		const { onSuccess } = addItems.mock.calls[ 0 ][ 0 ];

		getItems.mockReturnValue( [
			{ id: 'mine', onSuccess, operations: [] },
		] );
		notifyStoreChange();

		// cancelItem() can remove an item silently, without calling back.
		getItems.mockReturnValue( [] );
		notifyStoreChange();

		expect( created[ 0 ].destroy ).toHaveBeenCalled();
		expect( errors.unshift ).toHaveBeenCalled();
		// Nothing left to watch.
		expect( unsubscribe ).toHaveBeenCalled();
	} );

	it( 'leaves a batch of files plupload already failed alone', async () => {
		const { Uploader } = setUpGlobals();
		const { installClientSideModalUploads } = await loadModule();

		installClientSideModalUploads();
		const { up, bindings } = createUploader( Uploader );
		const failed = { ...createPluploadFile(), status: 4 };

		// Suppressing the built-in handler here would leave plupload's queue
		// unstarted, because that handler is the only caller of up.start().
		expect( bindings[ 0 ].handler( up, [ failed ] ) ).toBeUndefined();
		expect( addItems ).not.toHaveBeenCalled();
	} );

	it( 'reports a failure through wp.Uploader.errors', async () => {
		const { Uploader, errors, created } = setUpGlobals();
		const { installClientSideModalUploads } = await loadModule();

		installClientSideModalUploads();
		const { up, wpUploader, bindings } = createUploader( Uploader );
		const file = createPluploadFile();

		bindings[ 0 ].handler( up, [ file ] );
		addItems.mock.calls[ 0 ][ 0 ].onError( {
			message: 'The server cannot process HEIC images.',
		} );

		expect( created[ 0 ].destroy ).toHaveBeenCalled();
		expect( errors.unshift ).toHaveBeenCalledWith( {
			message: 'The server cannot process HEIC images.',
			data: {},
			file,
		} );
		expect( wpUploader.error ).toHaveBeenCalledWith(
			'The server cannot process HEIC images.',
			{},
			file
		);
	} );
} );
