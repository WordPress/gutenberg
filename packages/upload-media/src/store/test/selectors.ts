/**
 * Internal dependencies
 */
import {
	getItems,
	isUploading,
	isUploadingById,
	isUploadingByUrl,
} from '../selectors';
import {
	getActiveUploadCount,
	getActiveImageProcessingCount,
	getFailedItems,
	getItemProgress,
	getPendingUploads,
	getPendingImageProcessing,
	hasPendingItemsByParentId,
} from '../private-selectors';
import {
	ItemStatus,
	OperationType,
	type QueueItem,
	type State,
} from '../types';

describe( 'selectors', () => {
	describe( 'getItems', () => {
		it( 'should return empty array by default', () => {
			const state: State = {
				queue: [],
				queueStatus: 'paused',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
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
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
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
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
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
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
			};

			expect( isUploadingById( state, 123 ) ).toBe( true );
			expect( isUploadingById( state, 789 ) ).toBe( false );
		} );
	} );

	describe( 'getActiveUploadCount', () => {
		it( 'should return the count of items currently uploading', () => {
			const state: State = {
				queue: [
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
				] as QueueItem[],
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
			};

			expect( getActiveUploadCount( state ) ).toBe( 2 );
		} );
	} );

	describe( 'getActiveImageProcessingCount', () => {
		it( 'should return the count of items currently doing image processing', () => {
			const state: State = {
				queue: [
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
				] as QueueItem[],
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
			};

			expect( getActiveImageProcessingCount( state ) ).toBe( 2 );
		} );

		it( 'should return 0 when no image processing is active', () => {
			const state: State = {
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
						currentOperation: OperationType.Upload,
					},
				] as QueueItem[],
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
			};

			expect( getActiveImageProcessingCount( state ) ).toBe( 0 );
		} );
	} );

	describe( 'getPendingUploads', () => {
		it( 'should return items waiting for upload', () => {
			const state: State = {
				queue: [
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
				] as QueueItem[],
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
			};

			const pending = getPendingUploads( state );
			expect( pending ).toHaveLength( 1 );
			expect( pending[ 0 ].id ).toBe( '1' );
		} );
	} );

	describe( 'getPendingImageProcessing', () => {
		it( 'should return items waiting for image processing', () => {
			const state: State = {
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
						operations: [
							[
								OperationType.ResizeCrop,
								{
									resize: {
										width: 150,
										height: 150,
									},
								},
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
								{
									resize: {
										width: 300,
										height: 300,
									},
								},
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
				] as QueueItem[],
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
			};

			const pending = getPendingImageProcessing( state );
			expect( pending ).toHaveLength( 1 );
			expect( pending[ 0 ].id ).toBe( '1' );
		} );

		it( 'should include items pending Rotate operations', () => {
			const state: State = {
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
						operations: [
							[ OperationType.Rotate, { orientation: 6 } ],
						],
						currentOperation: undefined,
					},
				] as QueueItem[],
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
			};

			const pending = getPendingImageProcessing( state );
			expect( pending ).toHaveLength( 1 );
			expect( pending[ 0 ].id ).toBe( '1' );
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
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
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
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
			};

			expect( getItemProgress( state, '1' ) ).toBe( 50 );
			expect( getItemProgress( state, '2' ) ).toBe( 75 );
			expect( getItemProgress( state, '999' ) ).toBeUndefined();
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
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
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
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
			};

			expect( hasPendingItemsByParentId( state, 'parent-1' ) ).toBe(
				false
			);
		} );
	} );
} );
