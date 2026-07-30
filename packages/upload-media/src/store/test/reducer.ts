/**
 * Internal dependencies
 */
import reducer from '../reducer';
import {
	ItemStatus,
	OperationType,
	type QueueItem,
	type State,
	Type,
} from '../types';

describe( 'reducer', () => {
	describe( `${ Type.Add }`, () => {
		it( 'adds an item to the queue', () => {
			const initialState: State = {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
					} as QueueItem,
				],
			};
			const state = reducer( initialState, {
				type: Type.Add,
				item: {
					id: '2',
					status: ItemStatus.Processing,
				} as QueueItem,
			} );

			expect( state ).toEqual( {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: expect.any( Function ),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
					} as QueueItem,
					{
						id: '2',
						status: ItemStatus.Processing,
					},
				],
			} );
		} );
	} );

	describe( `${ Type.Cancel }`, () => {
		it( 'removes an item from the queue', () => {
			const initialState: State = {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
					} as QueueItem,
					{
						id: '2',
						status: ItemStatus.Processing,
					} as QueueItem,
				],
			};
			const state = reducer( initialState, {
				type: Type.Cancel,
				id: '2',
				error: new Error(),
			} );

			expect( state ).toEqual( {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: expect.any( Function ),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
					},
					{
						id: '2',
						status: ItemStatus.Processing,
						error: expect.any( Error ),
					},
				],
			} );
		} );
	} );

	describe( `${ Type.Remove }`, () => {
		it( 'removes an item from the queue', () => {
			const initialState: State = {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
					} as QueueItem,
					{
						id: '2',
						status: ItemStatus.Processing,
					} as QueueItem,
				],
			};
			const state = reducer( initialState, {
				type: Type.Remove,
				id: '1',
			} );

			expect( state ).toEqual( {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: expect.any( Function ),
				},
				queue: [
					{
						id: '2',
						status: ItemStatus.Processing,
					},
				],
			} );
		} );
	} );

	describe( `${ Type.AddOperations }`, () => {
		it( 'appends operations to the list', () => {
			const initialState: State = {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
						operations: [ OperationType.Upload ],
					} as QueueItem,
				],
			};
			const state = reducer( initialState, {
				type: Type.AddOperations,
				id: '1',
				operations: [ OperationType.Upload ],
			} );

			expect( state ).toEqual( {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: expect.any( Function ),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
						operations: [
							OperationType.Upload,
							OperationType.Upload,
						],
					},
				],
			} );
		} );
	} );

	describe( `${ Type.OperationStart }`, () => {
		it( 'marks an item as processing', () => {
			const initialState: State = {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
						operations: [ OperationType.Upload ],
					} as QueueItem,
					{
						id: '2',
						status: ItemStatus.Processing,
						operations: [ OperationType.Upload ],
					} as QueueItem,
				],
			};
			const state = reducer( initialState, {
				type: Type.OperationStart,
				id: '2',
				operation: OperationType.Upload,
			} );

			expect( state ).toEqual( {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: expect.any( Function ),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
						operations: [ OperationType.Upload ],
					},
					{
						id: '2',
						status: ItemStatus.Processing,
						operations: [ OperationType.Upload ],
						currentOperation: OperationType.Upload,
					},
				],
			} );
		} );
	} );

	describe( `${ Type.OperationFinish }`, () => {
		it( 'marks an item as processing', () => {
			const initialState: State = {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [
					{
						id: '1',
						additionalData: {},
						attachment: {},
						status: ItemStatus.Processing,
						operations: [ OperationType.Upload ],
						currentOperation: OperationType.Upload,
					} as QueueItem,
				],
			};
			const state = reducer( initialState, {
				type: Type.OperationFinish,
				id: '1',
				item: {},
			} );

			expect( state ).toEqual( {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: expect.any( Function ),
				},
				queue: [
					{
						id: '1',
						additionalData: {},
						attachment: {},
						status: ItemStatus.Processing,
						currentOperation: undefined,
						operations: [],
					},
				],
			} );
		} );
	} );

	describe( `${ Type.PauseItem }`, () => {
		it( 'pauses a specific item', () => {
			const initialState: State = {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
					} as QueueItem,
					{
						id: '2',
						status: ItemStatus.Processing,
					} as QueueItem,
				],
			};
			const state = reducer( initialState, {
				type: Type.PauseItem,
				id: '2',
			} );

			expect( state.queue[ 0 ].status ).toBe( ItemStatus.Processing );
			expect( state.queue[ 1 ].status ).toBe( ItemStatus.Paused );
		} );
	} );

	describe( `${ Type.ResumeItem }`, () => {
		it( 'resumes a paused item', () => {
			const initialState: State = {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Paused,
					} as QueueItem,
				],
			};
			const state = reducer( initialState, {
				type: Type.ResumeItem,
				id: '1',
			} );

			expect( state.queue[ 0 ].status ).toBe( ItemStatus.Processing );
		} );
	} );

	describe( `${ Type.RetryItem }`, () => {
		it( 'retries a failed item', () => {
			const initialState: State = {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
						error: new Error( 'Upload failed' ),
						retryCount: 0,
					} as QueueItem,
				],
			};
			const state = reducer( initialState, {
				type: Type.RetryItem,
				id: '1',
			} );

			expect( state.queue[ 0 ].status ).toBe( ItemStatus.Processing );
			expect( state.queue[ 0 ].error ).toBeUndefined();
			expect( state.queue[ 0 ].retryCount ).toBe( 1 );
		} );

		it( 'increments retry count on subsequent retries', () => {
			const initialState: State = {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
						error: new Error( 'Upload failed' ),
						retryCount: 2,
					} as QueueItem,
				],
			};
			const state = reducer( initialState, {
				type: Type.RetryItem,
				id: '1',
			} );

			expect( state.queue[ 0 ].retryCount ).toBe( 3 );
		} );

		it( 'creates a fresh AbortController when retrying', () => {
			const oldController = new AbortController();
			oldController.abort();
			const initialState: State = {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.PendingRetry,
						error: new Error( 'Upload failed' ),
						retryCount: 1,
						abortController: oldController,
					} as QueueItem,
				],
			};
			const state = reducer( initialState, {
				type: Type.RetryItem,
				id: '1',
			} );

			expect( state.queue[ 0 ].abortController ).toBeInstanceOf(
				AbortController
			);
			expect( state.queue[ 0 ].abortController ).not.toBe(
				oldController
			);
			expect( state.queue[ 0 ].abortController?.signal.aborted ).toBe(
				false
			);
		} );
	} );

	describe( `${ Type.ScheduleRetry }`, () => {
		it( 'sets item status to PendingRetry', () => {
			const initialState: State = {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
					} as QueueItem,
				],
			};
			const state = reducer( initialState, {
				type: Type.ScheduleRetry,
				id: '1',
				error: new Error( 'Network error' ),
				retryCount: 0,
				nextRetryTimestamp: Date.now() + 1000,
			} );

			expect( state.queue[ 0 ].status ).toBe( ItemStatus.PendingRetry );
		} );

		it( 'sets error from action', () => {
			const initialState: State = {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
					} as QueueItem,
				],
			};
			const error = new Error( 'Network error' );
			const state = reducer( initialState, {
				type: Type.ScheduleRetry,
				id: '1',
				error,
				retryCount: 0,
				nextRetryTimestamp: Date.now() + 1000,
			} );

			expect( state.queue[ 0 ].error ).toBe( error );
		} );

		it( 'does not modify other items in queue', () => {
			const initialState: State = {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
					} as QueueItem,
					{
						id: '2',
						status: ItemStatus.Queued,
					} as QueueItem,
				],
			};
			const state = reducer( initialState, {
				type: Type.ScheduleRetry,
				id: '1',
				error: new Error( 'Network error' ),
				retryCount: 0,
				nextRetryTimestamp: Date.now() + 1000,
			} );

			expect( state.queue[ 0 ].status ).toBe( ItemStatus.PendingRetry );
			expect( state.queue[ 1 ].status ).toBe( ItemStatus.Queued );
			expect( state.queue[ 1 ].error ).toBeUndefined();
		} );
	} );

	describe( `${ Type.PauseQueue }`, () => {
		it( 'transitions queueStatus from active to paused', () => {
			const initialState: State = {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [],
			};
			const state = reducer( initialState, {
				type: Type.PauseQueue,
			} );

			expect( state.queueStatus ).toBe( 'paused' );
		} );

		it( 'is idempotent when queue is already paused', () => {
			const initialState: State = {
				queueStatus: 'paused',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [],
			};
			const state = reducer( initialState, {
				type: Type.PauseQueue,
			} );

			expect( state.queueStatus ).toBe( 'paused' );
		} );

		it( 'preserves other state fields', () => {
			const initialState: State = {
				queueStatus: 'active',
				blobUrls: { '1': [ 'blob:foo' ] },
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
					} as QueueItem,
				],
			};
			const state = reducer( initialState, {
				type: Type.PauseQueue,
			} );

			expect( state.queue ).toEqual( initialState.queue );
			expect( state.blobUrls ).toEqual( initialState.blobUrls );
		} );
	} );

	describe( `${ Type.ResumeQueue }`, () => {
		it( 'transitions queueStatus from paused to active', () => {
			const initialState: State = {
				queueStatus: 'paused',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [],
			};
			const state = reducer( initialState, {
				type: Type.ResumeQueue,
			} );

			expect( state.queueStatus ).toBe( 'active' );
		} );

		it( 'is idempotent when queue is already active', () => {
			const initialState: State = {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [],
			};
			const state = reducer( initialState, {
				type: Type.ResumeQueue,
			} );

			expect( state.queueStatus ).toBe( 'active' );
		} );

		it( 'preserves item statuses', () => {
			const initialState: State = {
				queueStatus: 'paused',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.PendingRetry,
					} as QueueItem,
					{
						id: '2',
						status: ItemStatus.Processing,
					} as QueueItem,
				],
			};
			const state = reducer( initialState, {
				type: Type.ResumeQueue,
			} );

			expect( state.queue[ 0 ].status ).toBe( ItemStatus.PendingRetry );
			expect( state.queue[ 1 ].status ).toBe( ItemStatus.Processing );
		} );
	} );

	describe( `${ Type.UpdateProgress }`, () => {
		it( 'updates the progress of an item', () => {
			const initialState: State = {
				queueStatus: 'active',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
						progress: 0,
					} as QueueItem,
				],
			};
			const state = reducer( initialState, {
				type: Type.UpdateProgress,
				id: '1',
				progress: 50,
			} );

			expect( state.queue[ 0 ].progress ).toBe( 50 );
		} );
	} );
} );
