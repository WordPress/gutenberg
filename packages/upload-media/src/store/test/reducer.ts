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
} );
