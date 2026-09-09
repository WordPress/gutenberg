import { describe, expect, it, vi } from 'vitest';
import * as privateSelectors from '../private-selectors';
import {
	getItems,
	isUploading,
	isUploadingById,
	isUploadingByUrl,
} from '../selectors';
import {
	getActiveCountByPool,
	getConcurrencyPoolLimit,
	getFailureCount,
	getFailedItems,
	getItemProgress,
	getOperation,
	getOperations,
	getPendingItemsByPool,
	hasPendingItemsByParentId,
} from '../private-selectors';
import {
	ItemStatus,
	OperationType,
	type OperationDefinition,
	type QueueItem,
	type State,
} from '../types';
import {
	CORE_OPERATIONS,
	IMAGE_PROCESSING_POOL,
	UPLOAD_POOL,
	VIDEO_PROCESSING_POOL,
} from '../operations';

/**
 * Builds a state with the core operations registered.
 *
 * @param queue      Queue items.
 * @param operations Extra operations to register.
 * @return State.
 */
function createState(
	queue: Partial< QueueItem >[],
	operations: OperationDefinition[] = []
): State {
	return {
		queue: queue as QueueItem[],
		queueStatus: 'active',
		failureCount: 0,
		blobUrls: {},
		operations: Object.fromEntries(
			[ ...CORE_OPERATIONS, ...operations ].map( ( operation ) => [
				operation.name,
				operation,
			] )
		),
		settings: {
			mediaUpload: vi.fn(),
			maxConcurrentUploads: 5,
			maxConcurrentImageProcessing: 2,
		},
	};
}

describe( 'selectors', () => {
	describe( 'getFailureCount', () => {
		it( 'should return the number of failed uploads', () => {
			const state: State = {
				queue: [],
				queueStatus: 'active',
				failureCount: 3,
				blobUrls: {},
				operations: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
				},
			};

			expect( getFailureCount( state ) ).toBe( 3 );
		} );
	} );

	describe( 'getItems', () => {
		it( 'should return empty array by default', () => {
			const state: State = {
				queue: [],
				queueStatus: 'paused',
				failureCount: 0,
				blobUrls: {},
				operations: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
				},
			};

			expect( getItems( state ) ).toHaveLength( 0 );
		} );
	} );

	describe( 'isUploading', () => {
		it( 'should return true if there are items in the pipeline', () => {
			const state: State = {
				queue: [
					{
						status: ItemStatus.Processing,
					},
					{
						status: ItemStatus.Processing,
					},
					{
						status: ItemStatus.Paused,
					},
				] as QueueItem[],
				queueStatus: 'paused',
				failureCount: 0,
				blobUrls: {},
				operations: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
				},
			};

			expect( isUploading( state ) ).toBe( true );
		} );
	} );

	describe( 'isUploadingByUrl', () => {
		it( 'should return true if there are items in the pipeline', () => {
			const state: State = {
				queue: [
					{
						status: ItemStatus.Processing,
						attachment: {
							url: 'https://example.com/one.jpeg',
						},
					},
					{
						status: ItemStatus.Processing,
					},
				] as QueueItem[],
				queueStatus: 'paused',
				failureCount: 0,
				blobUrls: {},
				operations: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
				},
			};

			expect(
				isUploadingByUrl( state, 'https://example.com/one.jpeg' )
			).toBe( true );
			expect(
				isUploadingByUrl( state, 'https://example.com/three.jpeg' )
			).toBe( false );
		} );
	} );

	describe( 'isUploadingById', () => {
		it( 'should return true if there are items in the pipeline', () => {
			const state: State = {
				queue: [
					{
						status: ItemStatus.Processing,
						attachment: {
							id: 123,
						},
					},
				] as QueueItem[],
				queueStatus: 'paused',
				failureCount: 0,
				blobUrls: {},
				operations: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
				},
			};

			expect( isUploadingById( state, 123 ) ).toBe( true );
			expect( isUploadingById( state, 789 ) ).toBe( false );
		} );
	} );

	describe( 'getOperations', () => {
		it( 'returns the registered operations in registration order', () => {
			const custom: OperationDefinition = {
				name: 'my-plugin/ocr',
				label: 'Reading text',
				handler: () => {},
			};
			const state = createState( [], [ custom ] );

			const names = getOperations( state ).map( ( op ) => op.name );
			expect( names ).toEqual( [
				...CORE_OPERATIONS.map( ( op ) => op.name ),
				'my-plugin/ocr',
			] );
		} );
	} );

	describe( 'getOperation', () => {
		it( 'returns a registered operation by name', () => {
			const state = createState( [] );

			expect( getOperation( state, OperationType.Upload )?.name ).toBe(
				OperationType.Upload
			);
			expect(
				getOperation( state, 'my-plugin/missing' )
			).toBeUndefined();
		} );
	} );

	describe( 'getConcurrencyPoolLimit', () => {
		it( 'derives the upload and image pools from settings', () => {
			const state = createState( [] );

			expect( getConcurrencyPoolLimit( state, UPLOAD_POOL ) ).toBe( 5 );
			expect(
				getConcurrencyPoolLimit( state, IMAGE_PROCESSING_POOL )
			).toBe( 2 );
		} );

		it( 'limits video processing to one item at a time', () => {
			const state = createState( [] );

			expect(
				getConcurrencyPoolLimit( state, VIDEO_PROCESSING_POOL )
			).toBe( 1 );
		} );

		it( 'uses the limit declared by an operation for its own pool', () => {
			const state = createState(
				[],
				[
					{
						name: 'my-plugin/ocr',
						label: 'Reading text',
						handler: () => {},
						concurrency: { pool: 'ocr', limit: 3 },
					},
				]
			);

			expect( getConcurrencyPoolLimit( state, 'ocr' ) ).toBe( 3 );
		} );

		it( 'does not limit a pool nothing declares a limit for', () => {
			const state = createState( [] );

			expect( getConcurrencyPoolLimit( state, 'unknown' ) ).toBe(
				Infinity
			);
		} );
	} );

	describe( 'getActiveCountByPool', () => {
		it( 'counts items whose current operation belongs to the pool', () => {
			const state = createState( [
				{
					id: '1',
					status: ItemStatus.Processing,
					currentOperation: OperationType.Upload,
				},
				{
					id: '2',
					status: ItemStatus.Processing,
					currentOperation: OperationType.Prepare,
				},
				{
					id: '3',
					status: ItemStatus.Processing,
					currentOperation: OperationType.Upload,
				},
			] );

			expect( getActiveCountByPool( state, UPLOAD_POOL ) ).toBe( 2 );
		} );

		it( 'counts every operation sharing the pool', () => {
			const state = createState( [
				{
					id: '1',
					status: ItemStatus.Processing,
					currentOperation: OperationType.ResizeCrop,
				},
				{
					id: '2',
					status: ItemStatus.Processing,
					currentOperation: OperationType.Upload,
				},
				{
					id: '3',
					status: ItemStatus.Processing,
					currentOperation: OperationType.Rotate,
				},
				{
					id: '4',
					status: ItemStatus.Processing,
					currentOperation: OperationType.Prepare,
				},
			] );

			expect( getActiveCountByPool( state, IMAGE_PROCESSING_POOL ) ).toBe(
				2
			);
		} );

		it( 'returns 0 when nothing in the pool is active', () => {
			const state = createState( [
				{
					id: '1',
					status: ItemStatus.Processing,
					currentOperation: OperationType.Upload,
				},
			] );

			expect( getActiveCountByPool( state, IMAGE_PROCESSING_POOL ) ).toBe(
				0
			);
		} );

		it( 'counts items transcoding a GIF towards the video pool', () => {
			const state = createState( [
				{ currentOperation: OperationType.TranscodeGif },
				{ currentOperation: OperationType.Upload },
				{ currentOperation: OperationType.TranscodeGif },
			] );

			expect( getActiveCountByPool( state, VIDEO_PROCESSING_POOL ) ).toBe(
				2
			);
		} );
	} );

	describe( 'getPendingItemsByPool', () => {
		it( 'returns items whose next operation is in the pool but not started', () => {
			const state = createState( [
				{
					id: '1',
					status: ItemStatus.Processing,
					operations: [ OperationType.Upload ],
					currentOperation: undefined,
				},
				{
					id: '2',
					status: ItemStatus.Processing,
					operations: [ OperationType.Upload ],
					currentOperation: OperationType.Upload,
				},
			] );

			const pending = getPendingItemsByPool( state, UPLOAD_POOL );
			expect( pending ).toHaveLength( 1 );
			expect( pending[ 0 ].id ).toBe( '1' );
		} );

		it( 'matches operations carrying arguments', () => {
			const state = createState( [
				{
					id: '1',
					status: ItemStatus.Processing,
					operations: [
						[
							OperationType.ResizeCrop,
							{ resize: { width: 150, height: 150 } },
						],
					],
					currentOperation: undefined,
				},
				{
					id: '2',
					status: ItemStatus.Processing,
					operations: [
						[
							OperationType.ResizeCrop,
							{ resize: { width: 300, height: 300 } },
						],
					],
					currentOperation: OperationType.ResizeCrop,
				},
				{
					id: '3',
					status: ItemStatus.Processing,
					operations: [ OperationType.Upload ],
					currentOperation: undefined,
				},
			] );

			const pending = getPendingItemsByPool(
				state,
				IMAGE_PROCESSING_POOL
			);
			expect( pending ).toHaveLength( 1 );
			expect( pending[ 0 ].id ).toBe( '1' );
		} );

		it( 'includes every operation sharing the pool', () => {
			const state = createState( [
				{
					id: '1',
					status: ItemStatus.Processing,
					operations: [
						[ OperationType.Rotate, { orientation: 6 } ],
					],
					currentOperation: undefined,
				},
				{
					id: '2',
					status: ItemStatus.Processing,
					operations: [
						[
							OperationType.ResizeCrop,
							{ resize: { width: 150, height: 150 } },
						],
					],
					currentOperation: undefined,
				},
			] );

			const pending = getPendingItemsByPool(
				state,
				IMAGE_PROCESSING_POOL
			);
			expect( pending.map( ( item ) => item.id ) ).toEqual( [
				'1',
				'2',
			] );
		} );

		it( 'returns items whose next operation is a GIF transcode', () => {
			const state = createState( [
				{
					operations: [ OperationType.TranscodeGif ],
					currentOperation: undefined,
				},
				{
					operations: [ OperationType.Upload ],
					currentOperation: undefined,
				},
			] );

			expect(
				getPendingItemsByPool( state, VIDEO_PROCESSING_POOL )
			).toHaveLength( 1 );
		} );

		it( 'ignores items with nothing left to do', () => {
			const state = createState( [
				{ id: '1', operations: [], currentOperation: undefined },
			] );

			expect( getPendingItemsByPool( state, UPLOAD_POOL ) ).toEqual( [] );
		} );
	} );

	describe( 'getFailedItems', () => {
		it( 'should return items with errors', () => {
			const state: State = {
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
						error: new Error( 'Upload failed' ),
					},
					{
						id: '2',
						status: ItemStatus.Processing,
					},
					{
						id: '3',
						status: ItemStatus.Processing,
						error: new Error( 'Network error' ),
					},
				] as QueueItem[],
				queueStatus: 'active',
				failureCount: 0,
				blobUrls: {},
				operations: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
				},
			};

			const failed = getFailedItems( state );
			expect( failed ).toHaveLength( 2 );
			expect( failed[ 0 ].id ).toBe( '1' );
			expect( failed[ 1 ].id ).toBe( '3' );
		} );
	} );

	describe( 'getItemProgress', () => {
		it( 'should return the progress of a specific item', () => {
			const state: State = {
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
						progress: 50,
					},
					{
						id: '2',
						status: ItemStatus.Processing,
						progress: 75,
					},
				] as QueueItem[],
				queueStatus: 'active',
				failureCount: 0,
				blobUrls: {},
				operations: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
				},
			};

			expect( getItemProgress( state, '1' ) ).toBe( 50 );
			expect( getItemProgress( state, '2' ) ).toBe( 75 );
			expect( getItemProgress( state, '999' ) ).toBeUndefined();
		} );
	} );

	describe( 'removed selectors', () => {
		it( 'isUploadingToPost is no longer exported', () => {
			expect( privateSelectors ).not.toHaveProperty(
				'isUploadingToPost'
			);
		} );

		it( 'getPausedUploadForPost is no longer exported', () => {
			expect( privateSelectors ).not.toHaveProperty(
				'getPausedUploadForPost'
			);
		} );
	} );

	describe( 'hasPendingItemsByParentId', () => {
		it( 'should return true if there are items with matching parent ID', () => {
			const state: State = {
				queue: [
					{
						id: '1',
						parentId: 'parent-1',
						status: ItemStatus.Processing,
					},
					{
						id: '2',
						status: ItemStatus.Processing,
					},
				] as QueueItem[],
				queueStatus: 'paused',
				failureCount: 0,
				blobUrls: {},
				operations: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
				},
			};

			expect( hasPendingItemsByParentId( state, 'parent-1' ) ).toBe(
				true
			);
			expect( hasPendingItemsByParentId( state, 'parent-2' ) ).toBe(
				false
			);
		} );

		it( 'should return false if no items have a parent ID', () => {
			const state: State = {
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
					},
				] as QueueItem[],
				queueStatus: 'paused',
				failureCount: 0,
				blobUrls: {},
				operations: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
				},
			};

			expect( hasPendingItemsByParentId( state, 'parent-1' ) ).toBe(
				false
			);
		} );
	} );
} );
