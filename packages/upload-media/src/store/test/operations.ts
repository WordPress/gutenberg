/**
 * Registry-level tests for the operation registry: registering and
 * unregistering operations, the handler contract, planning, and
 * concurrency pools, all through a real store.
 */
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
	type MockInstance,
} from 'vitest';
import { createRegistry } from '@wordpress/data';
import { store as uploadStore } from '..';
import {
	OperationType,
	type OperationContext,
	type OperationDefinition,
	type QueueItem,
} from '../types';
import type { ActionCreators, Selectors } from '../private-actions';
import { unlock } from '../../lock-unlock';
import { ErrorCode, UploadError } from '../../upload-error';
import { CORE_OPERATIONS } from '../operations';
type WPDataRegistry = ReturnType< typeof createRegistry >;

type Dispatch = ActionCreators &
	Pick<
		typeof import('../private-actions'),
		'updateSettings' | 'pauseQueue' | 'resumeQueue'
	>;

vi.mock(
	import( '@wordpress/blob' ),
	() =>
		( {
			createBlobURL: vi.fn( () => 'blob:foo' ),
			isBlobURL: vi.fn( ( str: string ) => str.startsWith( 'blob:' ) ),
			revokeBlobURL: vi.fn(),
		} ) as unknown as typeof import('@wordpress/blob')
);

vi.mock(
	import( '../utils' ),
	() =>
		( {
			vipsCancelOperations: vi.fn( () => Promise.resolve( true ) ),
			vipsResizeImage: vi.fn(),
			vipsRotateImage: vi.fn(),
			vipsHasTransparency: vi.fn( () => Promise.resolve( false ) ),
			vipsConvertImageFormat: vi.fn(),
			vipsGetUltraHdrInfo: vi.fn( () => Promise.resolve( null ) ),
			terminateVipsWorker: vi.fn(),
			maybeRecycleVipsWorker: vi.fn(),
		} ) as unknown as typeof import('../utils')
);

vi.mock( import( '../utils/video-conversion' ), async ( importOriginal ) => {
	const actual = await importOriginal();
	return {
		...actual,
		convertGifToVideo: vi.fn(),
		cancelGifToVideoOperations: vi.fn( () => Promise.resolve( true ) ),
		terminateVideoConversionWorker: vi.fn(),
	};
} );

const jpegFile = new File( [ 'foo' ], 'example.jpg', { type: 'image/jpeg' } );
const mp4File = new File( [ 'foo' ], 'video.mp4', { type: 'video/mp4' } );

/**
 * Lets the queue's asynchronous processing settle.
 */
async function flush() {
	for ( let i = 0; i < 5; i++ ) {
		await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
	}
}

function createDeferred< T >() {
	let resolve!: ( value: T ) => void;
	let reject!: ( reason?: unknown ) => void;
	const promise = new Promise< T >( ( res, rej ) => {
		resolve = res;
		reject = rej;
	} );
	return { promise, resolve, reject };
}

describe( 'operation registry', () => {
	let registry: WPDataRegistry;
	let dispatch: Dispatch;
	let select: Selectors;
	let consoleError: MockInstance;

	beforeEach( () => {
		registry = createRegistry();
		registry.register( uploadStore );
		dispatch = unlock< Dispatch >( registry.dispatch( uploadStore ) );
		select = unlock< Selectors >( registry.select( uploadStore ) );
		consoleError = vi
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );
	} );

	afterEach( () => {
		consoleError.mockRestore();
	} );

	const operation = (
		name: string,
		overrides: Partial< OperationDefinition > = {}
	): OperationDefinition => ( {
		name,
		label: `Running ${ name }`,
		handler: () => {},
		...overrides,
	} );

	describe( 'registerOperation', () => {
		it( 'ships with every core operation registered', () => {
			expect( select.getOperations().map( ( op ) => op.name ) ).toEqual(
				CORE_OPERATIONS.map( ( op ) => op.name )
			);
			expect( select.getOperation( OperationType.Upload )?.label ).toBe(
				'Uploading'
			);
		} );

		it( 'registers an operation and returns its definition', async () => {
			const definition = operation( 'my-plugin/ocr' );

			expect( await dispatch.registerOperation( definition ) ).toBe(
				definition
			);
			expect( select.getOperation( 'my-plugin/ocr' ) ).toBe( definition );
		} );

		it( 'rejects a name that is not namespaced', async () => {
			expect(
				await dispatch.registerOperation( operation( 'ocr' ) )
			).toBeUndefined();
			expect( select.getOperation( 'ocr' ) ).toBeUndefined();
			expect( consoleError ).toHaveBeenCalledWith(
				'Upload operation names must be strings in the form "namespace/operation-name", like "core/upload".'
			);
		} );

		it( 'rejects a name that is already registered', async () => {
			const replacement = operation( OperationType.Upload );

			expect(
				await dispatch.registerOperation( replacement )
			).toBeUndefined();
			expect( select.getOperation( OperationType.Upload ) ).not.toBe(
				replacement
			);
			expect( consoleError ).toHaveBeenCalledWith(
				'Upload operation "core/upload" is already registered.'
			);
		} );

		it( 'rejects an operation without a handler or a label', async () => {
			expect(
				await dispatch.registerOperation( {
					name: 'my-plugin/no-handler',
					label: 'No handler',
				} as OperationDefinition )
			).toBeUndefined();
			expect( consoleError ).toHaveBeenCalledWith(
				'Upload operation "my-plugin/no-handler" must have a "handler" function.'
			);

			expect(
				await dispatch.registerOperation( {
					name: 'my-plugin/no-label',
					handler: () => {},
				} as unknown as OperationDefinition )
			).toBeUndefined();
			expect( consoleError ).toHaveBeenCalledWith(
				'Upload operation "my-plugin/no-label" must have a "label" string.'
			);
		} );
	} );

	describe( 'unregisterOperation', () => {
		it( 'removes an operation and returns its definition', async () => {
			const definition = select.getOperation(
				OperationType.TranscodeGif
			);

			expect(
				await dispatch.unregisterOperation( OperationType.TranscodeGif )
			).toBe( definition );
			expect(
				select.getOperation( OperationType.TranscodeGif )
			).toBeUndefined();
		} );

		it( 'reports an operation that is not registered', async () => {
			expect(
				await dispatch.unregisterOperation( 'my-plugin/missing' )
			).toBeUndefined();
			expect( consoleError ).toHaveBeenCalledWith(
				'Upload operation "my-plugin/missing" is not registered.'
			);
		} );

		it( 'lets a core operation be replaced under the same name', async () => {
			const handler = vi.fn( () => ( {} ) );
			dispatch.unregisterOperation( OperationType.Finalize );
			dispatch.registerOperation(
				operation( OperationType.Finalize, { handler } )
			);

			dispatch.addItem( {
				file: jpegFile,
				operations: [ OperationType.Finalize ],
			} );
			await flush();

			expect( handler ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'runOperation', () => {
		it( 'merges the updates a handler resolves with into the item', async () => {
			const received: QueueItem[] = [];
			dispatch.registerOperation(
				operation( 'my-plugin/first', {
					handler: () => ( { additionalData: { ocr: 'text' } } ),
				} )
			);
			dispatch.registerOperation(
				operation( 'my-plugin/second', {
					handler: ( item ) => {
						received.push( item );
					},
				} )
			);

			dispatch.addItem( {
				file: jpegFile,
				operations: [ 'my-plugin/first', 'my-plugin/second' ],
			} );
			await flush();

			expect( received ).toHaveLength( 1 );
			expect( received[ 0 ].additionalData ).toEqual(
				expect.objectContaining( { ocr: 'text' } )
			);
			// Both steps ran, so the item has left the queue.
			expect( select.getAllItems() ).toHaveLength( 0 );
		} );

		it( 'passes the args of the step to the handler', async () => {
			const handler = vi.fn( () => ( {} ) );
			dispatch.registerOperation(
				operation( 'my-plugin/subtitles', { handler } )
			);

			dispatch.addItem( {
				file: mp4File,
				operations: [ [ 'my-plugin/subtitles', { language: 'en' } ] ],
			} );
			await flush();

			expect( handler ).toHaveBeenCalledWith(
				expect.objectContaining( { file: mp4File } ),
				{ language: 'en' },
				expect.anything()
			);
		} );

		it( 'cancels the item with the error a handler throws', async () => {
			const onError = vi.fn();
			const error = new UploadError( {
				code: 'my-plugin/rejected',
				message: 'This image is not allowed.',
				file: jpegFile,
			} );
			dispatch.registerOperation(
				operation( 'my-plugin/check', {
					handler: () => {
						throw error;
					},
				} )
			);

			dispatch.addItem( {
				file: jpegFile,
				onError,
				operations: [ 'my-plugin/check', OperationType.Upload ],
			} );
			await flush();

			expect( onError ).toHaveBeenCalledWith( error );
			expect( select.getAllItems() ).toHaveLength( 0 );
		} );

		it( 'cancels silently when the thrown error asks for it', async () => {
			const onError = vi.fn();
			dispatch.registerOperation(
				operation( 'my-plugin/optional', {
					handler: () => {
						throw new UploadError( {
							code: 'my-plugin/skipped',
							message: 'Not this time.',
							file: jpegFile,
							silent: true,
						} );
					},
				} )
			);

			dispatch.addItem( {
				file: jpegFile,
				onError,
				operations: [ 'my-plugin/optional' ],
			} );
			await flush();

			expect( onError ).not.toHaveBeenCalled();
			expect( select.getAllItems() ).toHaveLength( 0 );
		} );

		it( 'passes a rejection that is not an Error through unchanged', async () => {
			// The editor's media-upload wrapper rejects with the message
			// string, and a REST failure with a plain object. Both must
			// reach onError as they are, so the user sees the real message.
			const onError = vi.fn();
			const restError = { code: 'rest_error', message: 'Nope' };
			dispatch.registerOperation(
				operation( 'my-plugin/rest', {
					handler: () => Promise.reject( restError ),
				} )
			);
			dispatch.registerOperation(
				operation( 'my-plugin/string', {
					handler: () =>
						Promise.reject(
							'Sorry, you are not allowed to upload this file type.'
						),
				} )
			);

			dispatch.addItem( {
				file: jpegFile,
				onError,
				operations: [ 'my-plugin/rest' ],
			} );
			dispatch.addItem( {
				file: jpegFile,
				onError,
				operations: [ 'my-plugin/string' ],
			} );
			await flush();

			expect( onError ).toHaveBeenCalledWith( restError );
			expect( onError ).toHaveBeenCalledWith(
				'Sorry, you are not allowed to upload this file type.'
			);
			expect( select.getAllItems() ).toHaveLength( 0 );
		} );

		it( 'cancels an item whose next step is not registered', async () => {
			const onError = vi.fn();

			dispatch.addItem( {
				file: jpegFile,
				onError,
				operations: [ 'my-plugin/ghost' ],
			} );
			await flush();

			expect( onError ).toHaveBeenCalledWith(
				expect.objectContaining( {
					code: ErrorCode.UNKNOWN_OPERATION,
					message: 'Unknown upload operation "my-plugin/ghost".',
				} )
			);
			expect( select.getAllItems() ).toHaveLength( 0 );
		} );
	} );

	describe( 'handler context', () => {
		it( 'withholds the store from third-party operations', async () => {
			let context: OperationContext | undefined;
			dispatch.registerOperation(
				operation( 'my-plugin/inspect', {
					handler: ( _item, _args, ctx ) => {
						context = ctx;
					},
				} )
			);

			dispatch.addItem( {
				file: jpegFile,
				operations: [ 'my-plugin/inspect' ],
			} );
			await flush();

			expect( context ).toBeDefined();
			expect( context ).not.toHaveProperty( 'dispatch' );
			expect( context ).not.toHaveProperty( 'select' );
			expect( context?.signal ).toBeInstanceOf( AbortSignal );
			expect( context?.settings ).toBe( select.getSettings() );
		} );

		it( 'gives core operations the store', async () => {
			let context: OperationContext | undefined;
			dispatch.unregisterOperation( OperationType.Finalize );
			dispatch.registerOperation(
				operation( OperationType.Finalize, {
					handler: ( _item, _args, ctx ) => {
						context = ctx;
					},
				} )
			);

			dispatch.addItem( {
				file: jpegFile,
				operations: [ OperationType.Finalize ],
			} );
			await flush();

			expect( context ).toHaveProperty( 'dispatch' );
			expect( context ).toHaveProperty( 'select' );
		} );

		it( 'lets a handler append steps to its item', async () => {
			const later = vi.fn( () => ( {} ) );
			dispatch.registerOperation(
				operation( 'my-plugin/first', {
					handler: ( _item, _args, { addOperations } ) => {
						addOperations( [ 'my-plugin/later' ] );
					},
				} )
			);
			dispatch.registerOperation(
				operation( 'my-plugin/later', { handler: later } )
			);

			dispatch.addItem( {
				file: jpegFile,
				operations: [ 'my-plugin/first' ],
			} );
			await flush();

			expect( later ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'lets a handler report progress', async () => {
			const progress: ( number | undefined )[] = [];
			dispatch.registerOperation(
				operation( 'my-plugin/slow', {
					handler: ( item, _args, { updateProgress } ) => {
						updateProgress( 42 );
						progress.push( select.getItem( item.id )?.progress );
					},
				} )
			);

			dispatch.addItem( {
				file: jpegFile,
				operations: [ 'my-plugin/slow' ],
			} );
			await flush();

			expect( progress ).toEqual( [ 42 ] );
		} );

		it( 'sideloads a companion file to the item attachment', async () => {
			const mediaSideload = vi.fn();
			const vtt = new File( [ 'WEBVTT' ], 'video.vtt', {
				type: 'text/vtt',
			} );
			dispatch.updateSettings( {
				mediaUpload: ( { onSuccess } ) => {
					onSuccess?.( [
						{ id: 123, url: 'https://example.com/video.mp4' },
					] );
				},
				mediaSideload,
			} );
			dispatch.registerOperation(
				operation( 'my-plugin/subtitles', {
					handler: ( _item, _args, { addSideloadItem } ) => {
						addSideloadItem( {
							file: vtt,
							additionalData: { image_size: 'subtitles' },
						} );
					},
				} )
			);

			dispatch.addItem( {
				file: mp4File,
				operations: [ OperationType.Upload, 'my-plugin/subtitles' ],
			} );
			await flush();

			const parent = select
				.getAllItems()
				.find( ( item ) => item.file === mp4File );
			const child = select
				.getAllItems()
				.find( ( item ) => item.file === vtt );
			expect( child ).toEqual(
				expect.objectContaining( {
					parentId: parent?.id,
					additionalData: expect.objectContaining( {
						post: 123,
						image_size: 'subtitles',
					} ),
				} )
			);
			expect( mediaSideload ).toHaveBeenCalledWith(
				expect.objectContaining( { file: vtt, attachmentId: 123 } )
			);
		} );

		it( 'refuses to sideload before the item has been uploaded', async () => {
			const onError = vi.fn();
			dispatch.registerOperation(
				operation( 'my-plugin/too-early', {
					handler: ( _item, _args, { addSideloadItem } ) => {
						addSideloadItem( { file: jpegFile } );
					},
				} )
			);

			dispatch.addItem( {
				file: jpegFile,
				onError,
				operations: [ 'my-plugin/too-early' ],
			} );
			await flush();

			expect( onError ).toHaveBeenCalledWith(
				expect.objectContaining( {
					message:
						'A companion file can only be sideloaded once the item has been uploaded.',
				} )
			);
		} );
	} );

	describe( 'planning', () => {
		beforeEach( () => {
			// Keep the queue from running the planned pipeline, so the
			// operations list can be inspected as planned.
			dispatch.pauseQueue();
		} );

		async function plan( file: File ) {
			dispatch.addItem( { file } );
			const item = select.getAllItems()[ 0 ];
			await dispatch.runOperation( item.id, OperationType.Prepare );
			return select.getItem( item.id );
		}

		it( 'inserts an operation where its plan places it', async () => {
			dispatch.registerOperation(
				operation( 'my-plugin/subtitles', {
					plan: ( item ) =>
						item.file.type.startsWith( 'video/' )
							? {
									after: OperationType.Upload,
									args: { language: 'en' },
							  }
							: undefined,
				} )
			);

			expect( ( await plan( mp4File ) )?.operations ).toEqual( [
				OperationType.Upload,
				[ 'my-plugin/subtitles', { language: 'en' } ],
			] );
		} );

		it( 'leaves items alone when the plan returns nothing', async () => {
			dispatch.registerOperation(
				operation( 'my-plugin/subtitles', {
					plan: ( item ) =>
						item.file.type.startsWith( 'video/' )
							? { after: OperationType.Upload }
							: undefined,
				} )
			);

			expect( ( await plan( jpegFile ) )?.operations ).not.toContain(
				'my-plugin/subtitles'
			);
		} );

		it( 'skips an operation whose anchor is not in the pipeline', async () => {
			dispatch.registerOperation(
				operation( 'my-plugin/after-gif', {
					plan: () => ( { after: OperationType.TranscodeGif } ),
				} )
			);

			expect( ( await plan( mp4File ) )?.operations ).toEqual( [
				OperationType.Upload,
			] );
		} );

		it( 'lets a plan replace the pipeline', async () => {
			dispatch.registerOperation(
				operation( 'my-plugin/no-thumbnails', {
					plan: ( _item, { operations } ) =>
						operations.filter(
							( op ) => op !== OperationType.ThumbnailGeneration
						),
				} )
			);

			const planned = ( await plan( jpegFile ) )?.operations;
			expect( planned ).toContain( OperationType.Upload );
			expect( planned ).not.toContain(
				OperationType.ThumbnailGeneration
			);
		} );

		it( 'runs plans in priority order', async () => {
			dispatch.registerOperation(
				operation( 'my-plugin/late', {
					priority: 20,
					plan: () => ( { at: 'end' } ),
				} )
			);
			dispatch.registerOperation(
				operation( 'my-plugin/early', {
					priority: 5,
					plan: () => ( { at: 'end' } ),
				} )
			);

			expect( ( await plan( mp4File ) )?.operations ).toEqual( [
				OperationType.Upload,
				'my-plugin/early',
				'my-plugin/late',
			] );
		} );

		it( 'fails the item when a plan names an unregistered operation', async () => {
			const onError = vi.fn();
			dispatch.registerOperation(
				operation( 'my-plugin/planner', {
					plan: () => [ OperationType.Upload, 'my-plugin/ghost' ],
				} )
			);

			dispatch.addItem( { file: jpegFile, onError } );
			const item = select.getAllItems()[ 0 ];
			await dispatch.runOperation( item.id, OperationType.Prepare );

			expect( onError ).toHaveBeenCalledWith(
				expect.objectContaining( {
					code: ErrorCode.UNKNOWN_OPERATION,
					message: 'Unknown upload operation "my-plugin/ghost".',
				} )
			);
			expect( select.getItem( item.id ) ).toBeUndefined();
		} );

		it( 'does not plan items that were added with an explicit pipeline', async () => {
			const planner = vi.fn( () => ( { at: 'end' } ) as const );
			dispatch.registerOperation(
				operation( 'my-plugin/planner', { plan: planner } )
			);

			dispatch.addItem( {
				file: jpegFile,
				operations: [ OperationType.Upload ],
			} );
			dispatch.resumeQueue();
			await flush();

			expect( planner ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'concurrency pools', () => {
		it( 'runs at most the declared number of items in a pool at once', async () => {
			const first = createDeferred< object >();
			const handler = vi
				.fn()
				.mockImplementationOnce( () => first.promise )
				.mockImplementation( () => ( {} ) );
			dispatch.registerOperation(
				operation( 'my-plugin/ocr', {
					handler,
					concurrency: { pool: 'ocr', limit: 1 },
				} )
			);

			dispatch.addItem( {
				file: jpegFile,
				operations: [ 'my-plugin/ocr' ],
			} );
			dispatch.addItem( {
				file: jpegFile,
				operations: [ 'my-plugin/ocr' ],
			} );
			await flush();

			expect( handler ).toHaveBeenCalledTimes( 1 );
			expect( select.getActiveCountByPool( 'ocr' ) ).toBe( 1 );
			expect( select.getPendingItemsByPool( 'ocr' ) ).toHaveLength( 1 );

			first.resolve( {} );
			await flush();

			expect( handler ).toHaveBeenCalledTimes( 2 );
			expect( select.getAllItems() ).toHaveLength( 0 );
		} );

		it( 'lets an operation join a core pool by name', async () => {
			dispatch.updateSettings( { maxConcurrentImageProcessing: 1 } );
			const first = createDeferred< object >();
			const handler = vi
				.fn()
				.mockImplementationOnce( () => first.promise )
				.mockImplementation( () => ( {} ) );
			dispatch.registerOperation(
				operation( 'my-plugin/blurhash', {
					handler,
					concurrency: 'image',
				} )
			);

			dispatch.addItem( {
				file: jpegFile,
				operations: [ 'my-plugin/blurhash' ],
			} );
			dispatch.addItem( {
				file: jpegFile,
				operations: [ 'my-plugin/blurhash' ],
			} );
			await flush();

			expect( handler ).toHaveBeenCalledTimes( 1 );

			first.resolve( {} );
			await flush();

			expect( handler ).toHaveBeenCalledTimes( 2 );
		} );
	} );
} );
