import { describe, expect, it, vi } from 'vitest';
import reducer from '../reducer';
import {
	ItemStatus,
	type Operation,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: expect.any( Function ),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
					} as QueueItem,
					{
						id: '2',
						status: ItemStatus.Processing,
						progress: 0,
					},
				],
			} );
		} );
	} );

	describe( `${ Type.Cancel }`, () => {
		it( 'removes an item from the queue', () => {
			const initialState: State = {
				queueStatus: 'active',
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 1,
				blobUrls: {},
				settings: {
					mediaUpload: expect.any( Function ),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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

		it( 'does not count a sub-size failure as a failed upload', () => {
			const initialState: State = {
				queueStatus: 'active',
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
				},
				queue: [
					{
						id: '1',
						status: ItemStatus.Processing,
					} as QueueItem,
					{
						id: '1-thumb',
						parentId: '1',
						status: ItemStatus.Processing,
					} as QueueItem,
				],
			};
			const state = reducer( initialState, {
				type: Type.Cancel,
				id: '1-thumb',
				error: new Error(),
			} );

			expect( state.failureCount ).toBe( 0 );
		} );

		it( 'does not count a cancellation for an item that already left the queue', () => {
			const initialState: State = {
				queueStatus: 'active',
				failureCount: 2,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
				},
				queue: [],
			};
			const state = reducer( initialState, {
				type: Type.Cancel,
				id: '1',
				error: new Error(),
			} );

			expect( state.failureCount ).toBe( 2 );
		} );
	} );

	describe( `${ Type.Remove }`, () => {
		it( 'removes an item from the queue', () => {
			const initialState: State = {
				queueStatus: 'active',
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: expect.any( Function ),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: expect.any( Function ),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: expect.any( Function ),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: expect.any( Function ),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
				},
				queue: [
					{
						id: '1',
						additionalData: {},
						attachment: {},
						status: ItemStatus.Processing,
						currentOperation: undefined,
						operations: [],
						progress: 100,
					},
				],
			} );
		} );
	} );

	describe( `${ Type.PauseItem }`, () => {
		it( 'pauses a specific item', () => {
			const initialState: State = {
				queueStatus: 'active',
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: { '1': [ 'blob:foo' ] },
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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
				failureCount: 0,
				blobUrls: {},
				settings: {
					mediaUpload: vi.fn(),
					maxConcurrentUploads: 5,
					maxConcurrentImageProcessing: 2,
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

	describe( 'progress', () => {
		const initialState: State = {
			queueStatus: 'active',
			failureCount: 0,
			blobUrls: {},
			settings: {
				mediaUpload: vi.fn(),
				maxConcurrentUploads: 5,
				maxConcurrentImageProcessing: 2,
			},
			queue: [],
		};

		it( 'advances as operations finish', () => {
			let state = reducer( initialState, {
				type: Type.Add,
				item: {
					id: '1',
					status: ItemStatus.Processing,
					operations: [
						OperationType.Prepare,
						OperationType.Upload,
						OperationType.ThumbnailGeneration,
						OperationType.Finalize,
					],
				} as QueueItem,
			} );
			expect( state.queue[ 0 ].progress ).toBe( 0 );

			state = reducer( state, {
				type: Type.OperationFinish,
				id: '1',
				item: {},
			} );
			expect( state.queue[ 0 ].progress ).toBe( 25 );
		} );

		it( 'counts sub-size operations towards the parent', () => {
			let state = reducer(
				{
					...initialState,
					queue: [
						{
							id: '1',
							status: ItemStatus.Processing,
							operations: [ OperationType.Finalize ],
							progress: 50,
						} as QueueItem,
					],
				},
				{
					type: Type.Add,
					item: {
						id: '2',
						parentId: '1',
						status: ItemStatus.Processing,
						operations: [
							OperationType.ResizeCrop,
							OperationType.Upload,
						],
					} as QueueItem,
				}
			);
			// Queuing a sub-size does not move progress backwards.
			expect( state.queue[ 0 ].progress ).toBe( 50 );
			expect( state.queue[ 1 ].progress ).toBeUndefined();

			state = reducer( state, {
				type: Type.OperationFinish,
				id: '2',
				item: {},
			} );
			state = reducer( state, {
				type: Type.OperationFinish,
				id: '2',
				item: {},
			} );
			// The remaining half is spread over the three operations left.
			expect( state.queue[ 0 ].progress ).toBe( 84 );
		} );

		it( 'drops a removed sub-size from the total', () => {
			const state = reducer(
				{
					...initialState,
					queue: [
						{
							id: '1',
							status: ItemStatus.Processing,
							operations: [ OperationType.Finalize ],
							progress: 50,
						} as QueueItem,
						{
							id: '2',
							parentId: '1',
							status: ItemStatus.Processing,
							operations: [
								OperationType.ResizeCrop,
								OperationType.Upload,
							],
						} as QueueItem,
					],
				},
				{
					type: Type.Remove,
					id: '2',
				}
			);
			// Two of the three operations left went with the failed sub-size.
			expect( state.queue[ 0 ].progress ).toBe( 83 );
		} );
		it( 'keeps advancing while sub-sizes upload', () => {
			let state = reducer( initialState, {
				type: Type.Add,
				item: {
					id: '1',
					status: ItemStatus.Processing,
					operations: [
						OperationType.Prepare,
						OperationType.Upload,
						OperationType.ThumbnailGeneration,
						OperationType.Finalize,
					],
				} as QueueItem,
			} );
			const finish = ( id: string ) => {
				state = reducer( state, {
					type: Type.OperationFinish,
					id,
					item: {},
				} );
				return state.queue[ 0 ].progress as number;
			};

			finish( '1' );
			expect( finish( '1' ) ).toBe( 50 );

			// Thumbnail generation queues ten sub-sizes before it finishes.
			for ( let i = 0; i < 10; i++ ) {
				state = reducer( state, {
					type: Type.Add,
					item: {
						id: `child-${ i }`,
						parentId: '1',
						status: ItemStatus.Processing,
						operations: [
							OperationType.ResizeCrop,
							OperationType.Upload,
						],
					} as QueueItem,
				} );
			}

			let previous = finish( '1' );
			expect( previous ).toBeGreaterThan( 50 );
			for ( let i = 0; i < 10; i++ ) {
				for ( let j = 0; j < 2; j++ ) {
					const progress = finish( `child-${ i }` );
					expect( progress ).toBeGreaterThan( previous );
					previous = progress;
				}
			}
			expect( previous ).toBeLessThan( 100 );
			expect( finish( '1' ) ).toBe( 100 );
		} );

		it( 'continues from an explicitly set progress', () => {
			let state = reducer(
				{
					...initialState,
					queue: [
						{
							id: '1',
							status: ItemStatus.Processing,
							operations: [
								OperationType.Upload,
								OperationType.Finalize,
							],
							progress: 90,
						} as QueueItem,
					],
				},
				{ type: Type.UpdateProgress, id: '1', progress: 10 }
			);
			state = reducer( state, {
				type: Type.OperationFinish,
				id: '1',
				item: {},
			} );
			expect( state.queue[ 0 ].progress ).toBe( 55 );
		} );

		it( 'does not advance when an item without operations finishes', () => {
			const state = reducer(
				{
					...initialState,
					queue: [
						{
							id: '1',
							status: ItemStatus.Processing,
							operations: [ OperationType.Finalize ],
							progress: 50,
						} as QueueItem,
						{
							id: '2',
							parentId: '1',
							status: ItemStatus.Processing,
							operations: [] as Operation[],
						} as QueueItem,
					],
				},
				{ type: Type.OperationFinish, id: '2', item: {} }
			);
			expect( state.queue[ 0 ].progress ).toBe( 50 );
		} );

		it( 'counts nested sub-size operations towards the top-level item', () => {
			const state = reducer(
				{
					...initialState,
					queue: [
						{
							id: '1',
							status: ItemStatus.Processing,
							operations: [ OperationType.Finalize ],
							progress: 50,
						} as QueueItem,
						{
							id: '2',
							parentId: '1',
							status: ItemStatus.Processing,
							operations: [] as Operation[],
						} as QueueItem,
						{
							id: '3',
							parentId: '2',
							status: ItemStatus.Processing,
							operations: [ OperationType.Upload ],
						} as QueueItem,
					],
				},
				{ type: Type.OperationFinish, id: '3', item: {} }
			);
			expect( state.queue[ 0 ].progress ).toBe( 75 );
			expect( state.queue[ 1 ].progress ).toBeUndefined();
		} );

		it( 'ignores an operation finishing for an unknown item', () => {
			const state = reducer(
				{
					...initialState,
					queue: [
						{
							id: '1',
							status: ItemStatus.Processing,
							operations: [ OperationType.Finalize ],
							progress: 50,
						} as QueueItem,
					],
				},
				{ type: Type.OperationFinish, id: 'gone', item: {} }
			);
			expect( state.queue[ 0 ].progress ).toBe( 50 );
		} );
	} );
} );
