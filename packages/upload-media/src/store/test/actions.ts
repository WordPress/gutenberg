/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';
// eslint-disable-next-line no-restricted-syntax
import type { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { store as uploadStore } from '..';
import { ItemStatus, OperationType, type QueueItem } from '../types';
import { unlock } from '../../lock-unlock';

jest.mock( '@wordpress/blob', () => ( {
	__esModule: true,
	createBlobURL: jest.fn( () => 'blob:foo' ),
	isBlobURL: jest.fn( ( str: string ) => str.startsWith( 'blob:' ) ),
	revokeBlobURL: jest.fn(),
} ) );

function createRegistryWithStores() {
	// Create a registry and register used stores.
	const registry = createRegistry();
	// @ts-ignore
	[ uploadStore ].forEach( registry.register );
	return registry;
}

const jpegFile = new File( [], 'example.jpg', {
	lastModified: 1234567891,
	type: 'image/jpeg',
} );

const mp4File = new File( [], 'amazing-video.mp4', {
	lastModified: 1234567891,
	type: 'video/mp4',
} );

describe( 'actions', () => {
	let registry: WPDataRegistry;
	beforeEach( () => {
		registry = createRegistryWithStores();
		unlock( registry.dispatch( uploadStore ) ).pauseQueue();
	} );

	describe( 'addItem', () => {
		it( 'adds an item to the queue', () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
			} );

			expect( registry.select( uploadStore ).getItems() ).toHaveLength(
				1
			);
			expect(
				registry.select( uploadStore ).getItems()[ 0 ]
			).toStrictEqual(
				expect.objectContaining( {
					id: expect.any( String ),
					file: jpegFile,
					sourceFile: jpegFile,
					status: ItemStatus.Processing,
					attachment: {
						url: expect.stringMatching( /^blob:/ ),
					},
				} )
			);
		} );
	} );

	describe( 'addItems', () => {
		it( 'adds multiple items to the queue', () => {
			registry.dispatch( uploadStore ).addItems( {
				files: [ jpegFile, mp4File ],
			} );

			expect( registry.select( uploadStore ).getItems() ).toHaveLength(
				2
			);
			expect(
				registry.select( uploadStore ).getItems()[ 0 ]
			).toStrictEqual(
				expect.objectContaining( {
					id: expect.any( String ),
					file: jpegFile,
					sourceFile: jpegFile,
					status: ItemStatus.Processing,
					attachment: {
						url: expect.stringMatching( /^blob:/ ),
					},
				} )
			);
			expect(
				registry.select( uploadStore ).getItems()[ 1 ]
			).toStrictEqual(
				expect.objectContaining( {
					id: expect.any( String ),
					file: mp4File,
					sourceFile: mp4File,
					status: ItemStatus.Processing,
					attachment: {
						url: expect.stringMatching( /^blob:/ ),
					},
				} )
			);
		} );
	} );

	describe( 'addItemFromUrl', () => {
		it( 'adds an item to the queue for downloading', async () => {
			await registry.dispatch( uploadStore ).addItemFromUrl( {
				url: 'https://example.com/example.jpg',
			} );

			expect( registry.select( uploadStore ).getItems() ).toHaveLength(
				1
			);
			expect(
				registry.select( uploadStore ).getItems()[ 0 ]
			).toStrictEqual(
				expect.objectContaining( {
					id: expect.any( String ),
					sourceUrl: 'https://example.com/example.jpg',
					file: expect.any( File ),
					sourceFile: expect.any( File ),
					status: ItemStatus.Processing,
					attachment: {
						url: undefined,
					},
					operations: [
						[
							OperationType.FetchRemoteFile,
							{
								url: 'https://example.com/example.jpg',
								fileName: 'example.jpg',
							},
						],
						OperationType.Prepare,
					],
				} )
			);
		} );
	} );

	describe( 'optimizeExistingItem', () => {
		it( 'adds an item to the queue for downloading', async () => {
			await registry.dispatch( uploadStore ).optimizeExistingItem( {
				id: 1234,
				url: 'https://example.com/awesome-video.mp4',
			} );

			expect( registry.select( uploadStore ).getItems() ).toHaveLength(
				1
			);

			const item: QueueItem = registry
				.select( uploadStore )
				.getItems()[ 0 ];

			expect( item ).toEqual(
				expect.objectContaining( {
					abortController: expect.any( AbortController ),
					id: expect.any( String ),
					sourceUrl: 'https://example.com/awesome-video.mp4',
					file: expect.any( File ),
					sourceFile: expect.any( File ),
					sourceAttachmentId: 1234,
					status: ItemStatus.Processing,
					additionalData: {
						generate_sub_sizes: false,
					},
					attachment: {
						url: 'https://example.com/awesome-video.mp4',
						poster: undefined,
					},
					operations: [
						[
							OperationType.FetchRemoteFile,
							{
								url: 'https://example.com/awesome-video.mp4',
								fileName: 'awesome-video.mp4',
								newFileName: 'awesome-video-optimized.mp4',
							},
						],
						[
							OperationType.Compress,
							{ requireApproval: undefined },
						],
						OperationType.Upload,
						OperationType.ThumbnailGeneration,
					],
				} )
			);
		} );
	} );

	describe( 'grantApproval', () => {
		it( 'should approve upload by attachment ID', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
				sourceAttachmentId: 1234,
			} );

			registry.dispatch( uploadStore ).grantApproval( 1234 );

			expect( registry.select( uploadStore ).getItems() ).toHaveLength(
				1
			);
			expect(
				registry.select( uploadStore ).getItems()[ 0 ]
			).toStrictEqual(
				expect.objectContaining( {
					status: ItemStatus.Processing,
				} )
			);
		} );

		it( 'should do nothing for an invalid attachment ID', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
				sourceAttachmentId: 1234,
			} );

			expect( registry.select( uploadStore ).getItems() ).toHaveLength(
				1
			);

			const item = registry.select( uploadStore ).getItems()[ 0 ];

			await registry.dispatch( uploadStore ).grantApproval( 5678 );

			expect( registry.select( uploadStore ).getItems()[ 0 ] ).toBe(
				item
			);
		} );
	} );

	describe( 'rejectApproval', () => {
		it( 'should cancel upload by attachment ID', async () => {
			const onError = jest.fn();
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
				sourceAttachmentId: 1234,
				onError,
			} );

			await registry.dispatch( uploadStore ).rejectApproval( 1234 );

			expect( registry.select( uploadStore ).getItems() ).toHaveLength(
				0
			);
			expect( onError ).toHaveBeenCalled();
		} );

		it( 'should do nothing for an invalid attachment ID', async () => {
			unlock( registry.dispatch( uploadStore ) ).addItem( {
				file: jpegFile,
				sourceAttachmentId: 1234,
			} );

			expect( registry.select( uploadStore ).getItems() ).toHaveLength(
				1
			);

			const item = registry.select( uploadStore ).getItems()[ 0 ];

			await registry.dispatch( uploadStore ).rejectApproval( 5678 );

			expect( registry.select( uploadStore ).getItems()[ 0 ] ).toBe(
				item
			);
		} );
	} );
} );
