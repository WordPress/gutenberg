/**
 * Internal dependencies
 */
import {
	getItems,
	isPendingApproval,
	isUploading,
	isUploadingById,
	isUploadingByUrl,
} from '../selectors';
import { ItemStatus, type QueueItem, type State } from '../types';

describe( 'selectors', () => {
	describe( 'getItems', () => {
		it( 'should return empty array by default', () => {
			const state: State = {
				queue: [],
				queueStatus: 'paused',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
					mediaSideload: jest.fn(),
					imageSizes: {},
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
						status: ItemStatus.PendingApproval,
					},
					{
						status: ItemStatus.Paused,
					},
				] as QueueItem[],
				queueStatus: 'paused',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
					mediaSideload: jest.fn(),
					imageSizes: {},
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
						status: ItemStatus.PendingApproval,
						sourceUrl: 'https://example.com/two.jpeg',
					},
					{
						status: ItemStatus.Processing,
					},
				] as QueueItem[],
				queueStatus: 'paused',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
					mediaSideload: jest.fn(),
					imageSizes: {},
				},
			};

			expect(
				isUploadingByUrl( state, 'https://example.com/one.jpeg' )
			).toBe( true );
			expect(
				isUploadingByUrl( state, 'https://example.com/two.jpeg' )
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
					{
						status: ItemStatus.PendingApproval,
						sourceAttachmentId: 456,
					},
					{
						status: ItemStatus.PendingApproval,
					},
				] as QueueItem[],
				queueStatus: 'paused',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
					mediaSideload: jest.fn(),
					imageSizes: {},
				},
			};

			expect( isUploadingById( state, 123 ) ).toBe( true );
			expect( isUploadingById( state, 456 ) ).toBe( true );
			expect( isUploadingById( state, 789 ) ).toBe( false );
		} );
	} );

	describe( 'isPendingApproval', () => {
		it( 'should return true if there are items pending approval', () => {
			const state: State = {
				queue: [
					{
						status: ItemStatus.Processing,
					},
					{
						status: ItemStatus.Processing,
					},
					{
						status: ItemStatus.PendingApproval,
					},
					{
						status: ItemStatus.Paused,
					},
					{
						status: ItemStatus.Processing,
					},
					{
						status: ItemStatus.PendingApproval,
					},
					{
						status: ItemStatus.Paused,
					},
					{
						status: ItemStatus.Processing,
					},
				] as QueueItem[],
				queueStatus: 'paused',
				blobUrls: {},
				settings: {
					mediaUpload: jest.fn(),
					mediaSideload: jest.fn(),
					imageSizes: {},
				},
			};

			expect( isPendingApproval( state ) ).toBe( true );
		} );
	} );
} );
