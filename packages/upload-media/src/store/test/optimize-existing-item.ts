import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
	type Mock,
} from 'vitest';
import { createRegistry } from '@wordpress/data';
type WPDataRegistry = ReturnType< typeof createRegistry >;
import { store as uploadStore } from '..';
import { OperationType } from '../types';
import { unlock } from '../../lock-unlock';
import { StubFile } from '../../stub-file';
import { ErrorCode } from '../../upload-error';
import { isClientSideMediaSupported } from '../../feature-detection';

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
			vipsConvertImageFormat: vi.fn(),
			vipsResizeImage: vi.fn(),
			vipsRotateImage: vi.fn(),
			vipsHasTransparency: vi.fn( () => Promise.resolve( false ) ),
			vipsGetUltraHdrInfo: vi.fn(),
			terminateVipsWorker: vi.fn(),
			maybeRecycleVipsWorker: vi.fn(),
		} ) as unknown as typeof import('../utils')
);

vi.mock(
	import( '../../feature-detection' ),
	() =>
		( {
			isClientSideMediaSupported: vi.fn( () => true ),
			exceedsClientProcessingMemory: vi.fn( () => false ),
		} ) as unknown as typeof import('../../feature-detection')
);

function createRegistryWithStores() {
	const registry = createRegistry();
	[ uploadStore ].forEach( registry.register );
	return registry;
}

describe( 'optimizeExistingItem', () => {
	let registry: WPDataRegistry;
	beforeEach( () => {
		vi.clearAllMocks();
		( isClientSideMediaSupported as Mock ).mockReturnValue( true );
		registry = createRegistryWithStores();
		unlock( registry.dispatch( uploadStore ) ).pauseQueue();
	} );

	it( 'enqueues an optimize item with the expected operations', async () => {
		await registry.dispatch( uploadStore ).optimizeExistingItem( {
			id: 42,
			url: 'https://example.com/wp-content/uploads/photo.jpg',
		} );

		const items = unlock( registry.select( uploadStore ) ).getAllItems();
		expect( items ).toHaveLength( 1 );

		const item = items[ 0 ];
		expect( item.sourceAttachmentId ).toBe( 42 );
		expect( item.sourceUrl ).toBe(
			'https://example.com/wp-content/uploads/photo.jpg'
		);
		expect( item.file ).toBeInstanceOf( StubFile );
		expect( item.additionalData.generate_sub_sizes ).toBe( false );

		expect( item.operations ).toEqual( [
			[
				OperationType.FetchRemoteFile,
				{
					url: 'https://example.com/wp-content/uploads/photo.jpg',
					fileName: 'photo.jpg',
					newFileName: 'photo-optimized.jpg',
				},
			],
			[
				OperationType.TranscodeImage,
				{
					outputFormat: 'jpeg',
					outputQuality: 0.82,
					interlaced: false,
				},
			],
			OperationType.Upload,
			OperationType.ThumbnailGeneration,
			OperationType.Finalize,
		] );
	} );

	it( 'does not enqueue and reports an error when unsupported', async () => {
		( isClientSideMediaSupported as Mock ).mockReturnValue( false );
		const onError = vi.fn();

		await registry.dispatch( uploadStore ).optimizeExistingItem( {
			id: 7,
			url: 'https://example.com/photo.jpg',
			onError,
		} );

		expect( onError ).toHaveBeenCalledTimes( 1 );
		expect(
			unlock( registry.select( uploadStore ) ).getAllItems()
		).toHaveLength( 0 );
	} );

	it( 'does not enqueue non-image file types', async () => {
		const onError = vi.fn();

		await registry.dispatch( uploadStore ).optimizeExistingItem( {
			id: 8,
			url: 'https://example.com/document.pdf',
			onError,
		} );

		expect( onError ).toHaveBeenCalledTimes( 1 );
		const error = onError.mock.calls[ 0 ][ 0 ];
		expect( error.code ).toBe( ErrorCode.MIME_TYPE_NOT_SUPPORTED );
		expect(
			unlock( registry.select( uploadStore ) ).getAllItems()
		).toHaveLength( 0 );
	} );

	it( 'does not enqueue the same attachment twice concurrently', async () => {
		await registry.dispatch( uploadStore ).optimizeExistingItem( {
			id: 99,
			url: 'https://example.com/photo.jpg',
		} );
		await registry.dispatch( uploadStore ).optimizeExistingItem( {
			id: 99,
			url: 'https://example.com/photo.jpg',
		} );

		expect(
			unlock( registry.select( uploadStore ) ).getAllItems()
		).toHaveLength( 1 );
	} );
} );

describe( 'fetchRemoteFile', () => {
	let registry: WPDataRegistry;
	const originalFetch = global.fetch;

	beforeEach( () => {
		vi.clearAllMocks();
		registry = createRegistryWithStores();
		unlock( registry.dispatch( uploadStore ) ).pauseQueue();
	} );

	afterEach( () => {
		global.fetch = originalFetch;
	} );

	async function addStubItem( onError?: Mock ) {
		await unlock( registry.dispatch( uploadStore ) ).addItem( {
			file: new StubFile(),
			onError,
			sourceUrl: 'https://example.com/photo.jpg',
			sourceAttachmentId: 5,
			operations: [
				[
					OperationType.FetchRemoteFile,
					{
						url: 'https://example.com/photo.jpg',
						fileName: 'photo.jpg',
						newFileName: 'photo-optimized.jpg',
					},
				],
				OperationType.Upload,
			],
		} );
		return unlock( registry.select( uploadStore ) ).getAllItems()[ 0 ];
	}

	it( 'downloads and renames the file, then advances the queue', async () => {
		global.fetch = vi.fn().mockResolvedValue( {
			ok: true,
			blob: async () =>
				new Blob( [ 'image-bytes' ], { type: 'image/jpeg' } ),
		} ) as Mock;

		const item = await addStubItem();

		await unlock( registry.dispatch( uploadStore ) ).fetchRemoteFile(
			item.id,
			{
				url: 'https://example.com/photo.jpg',
				fileName: 'photo.jpg',
				newFileName: 'photo-optimized.jpg',
			}
		);

		const updated = unlock( registry.select( uploadStore ) ).getItem(
			item.id
		);
		expect( updated?.file.name ).toBe( 'photo-optimized.jpg' );
		expect( updated?.file.type ).toBe( 'image/jpeg' );
		expect( updated?.sourceFile.type ).toBe( 'image/jpeg' );
		// The FetchRemoteFile operation has been consumed.
		expect( updated?.operations?.[ 0 ] ).toBe( OperationType.Upload );
	} );

	it( 'cancels the item and reports an error when the fetch fails', async () => {
		global.fetch = vi
			.fn()
			.mockResolvedValue( { ok: false, status: 404 } ) as Mock;

		const onError = vi.fn();
		const item = await addStubItem( onError );

		await unlock( registry.dispatch( uploadStore ) ).fetchRemoteFile(
			item.id,
			{
				url: 'https://example.com/photo.jpg',
				fileName: 'photo.jpg',
				newFileName: 'photo-optimized.jpg',
			}
		);

		expect( onError ).toHaveBeenCalledTimes( 1 );
		expect( onError.mock.calls[ 0 ][ 0 ].code ).toBe(
			ErrorCode.FETCH_REMOTE_FILE_ERROR
		);
	} );
} );
