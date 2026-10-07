/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import {
	fetchContentGuidelinesRevisions,
	restoreContentGuidelinesRevision,
	fetchContentGuidelines,
} from '../api';
import type { ContentGuidelinesRevision } from '../types';

// Mock dependencies
jest.mock( '@wordpress/data' );
jest.mock( '@wordpress/notices' );
jest.mock( '../api' );

const mockFetchContentGuidelinesRevisions = jest.mocked(
	fetchContentGuidelinesRevisions
);
const mockRestoreContentGuidelinesRevision = jest.mocked(
	restoreContentGuidelinesRevision
);
const mockFetchContentGuidelines = jest.mocked( fetchContentGuidelines );

describe( 'Revision History', () => {
	let mockDispatch: any;
	let mockSelect: any;

	beforeEach( () => {
		jest.clearAllMocks();

		// Setup mock dispatch
		mockDispatch = {
			createSuccessNotice: jest.fn(),
			createErrorNotice: jest.fn(),
			setFromResponse: jest.fn(),
		};

		// Setup mock select
		mockSelect = {
			getId: jest.fn(),
		};

		( dispatch as jest.Mock ).mockImplementation( ( store ) => {
			if ( store === noticesStore ) {
				return {
					createSuccessNotice: mockDispatch.createSuccessNotice,
					createErrorNotice: mockDispatch.createErrorNotice,
				};
			}
			return mockDispatch;
		} );
		( select as jest.Mock ).mockReturnValue( mockSelect );
	} );

	const mockRevisions: ContentGuidelinesRevision[] = [
		{
			id: 1,
			date: '2024-01-01T10:00:00Z',
			author: 1,
			_embedded: {
				author: [ { name: 'Admin User' } ],
			},
		},
		{
			id: 2,
			date: '2024-01-02T10:00:00Z',
			author: 2,
			_embedded: {
				author: [ { name: 'Editor User' } ],
			},
		},
	];

	describe( 'Fetching Revisions', () => {
		test( 'should fetch revisions with correct guidelinesId', async () => {
			mockSelect.getId.mockReturnValue( 123 );

			mockFetchContentGuidelinesRevisions.mockResolvedValue( {
				revisions: mockRevisions,
				total: 2,
				totalPages: 1,
			} );

			const guidelinesId = mockSelect.getId();
			const result = await fetchContentGuidelinesRevisions( {
				guidelinesId,
				perPage: 100,
			} );

			expect( mockFetchContentGuidelinesRevisions ).toHaveBeenCalledWith(
				{
					guidelinesId: 123,
					perPage: 100,
				}
			);
			expect( result.revisions ).toHaveLength( 2 );
			expect( result.total ).toBe( 2 );
		} );

		test( 'should fetch and return all revision fields', async () => {
			mockSelect.getId.mockReturnValue( 123 );

			mockFetchContentGuidelinesRevisions.mockResolvedValue( {
				revisions: mockRevisions,
				total: 2,
				totalPages: 1,
			} );

			const result = await fetchContentGuidelinesRevisions( {
				guidelinesId: 123,
				perPage: 100,
			} );

			const [ first, second ] = result.revisions;

			expect( first.id ).toBe( 1 );
			expect( first.date ).toBe( '2024-01-01T10:00:00Z' );
			expect( first._embedded?.author?.[ 0 ]?.name ).toBe( 'Admin User' );

			expect( second.id ).toBe( 2 );
			expect( second._embedded?.author?.[ 0 ]?.name ).toBe(
				'Editor User'
			);
		} );

		test( 'should not fetch revisions when guidelinesId is null', async () => {
			mockSelect.getId.mockReturnValue( null );

			const guidelinesId = mockSelect.getId();
			if ( guidelinesId ) {
				await fetchContentGuidelinesRevisions( {
					guidelinesId,
					perPage: 100,
				} );
			}

			expect(
				mockFetchContentGuidelinesRevisions
			).not.toHaveBeenCalled();
		} );

		test( 'should handle fetch error and dispatch error notice', async () => {
			mockSelect.getId.mockReturnValue( 123 );

			mockFetchContentGuidelinesRevisions.mockRejectedValue(
				new Error( 'API Error' )
			);

			const noticesDispatch = ( dispatch as jest.Mock )( noticesStore );

			await fetchContentGuidelinesRevisions( {
				guidelinesId: 123,
				perPage: 100,
			} ).catch( () => {
				noticesDispatch.createErrorNotice(
					'Could not load revision history. Please try again.',
					{ type: 'snackbar' }
				);
			} );

			expect( mockDispatch.createErrorNotice ).toHaveBeenCalledWith(
				'Could not load revision history. Please try again.',
				{ type: 'snackbar' }
			);
		} );

		test( 'should return unknown author for revisions without author data', async () => {
			const revisionWithoutAuthor: ContentGuidelinesRevision = {
				id: 3,
				date: '2024-01-03T10:00:00Z',
				author: 3,
			};

			mockFetchContentGuidelinesRevisions.mockResolvedValue( {
				revisions: [ revisionWithoutAuthor ],
				total: 1,
				totalPages: 1,
			} );

			const result = await fetchContentGuidelinesRevisions( {
				guidelinesId: 123,
				perPage: 100,
			} );

			const [ revision ] = result.revisions;
			const authorName =
				revision._embedded?.author?.[ 0 ]?.name ?? 'Unknown';

			expect( authorName ).toBe( 'Unknown' );
		} );

		test( 'should return empty revisions list when none exist', async () => {
			mockSelect.getId.mockReturnValue( 123 );

			mockFetchContentGuidelinesRevisions.mockResolvedValue( {
				revisions: [],
				total: 0,
				totalPages: 0,
			} );

			const result = await fetchContentGuidelinesRevisions( {
				guidelinesId: 123,
				perPage: 100,
			} );

			expect( result.revisions ).toHaveLength( 0 );
			expect( result.total ).toBe( 0 );
		} );
	} );

	describe( 'Restoring Revisions', () => {
		test( 'should restore revision successfully', async () => {
			mockSelect.getId.mockReturnValue( 123 );

			mockRestoreContentGuidelinesRevision.mockResolvedValue( {
				id: 123,
				status: 'publish',
			} );

			await restoreContentGuidelinesRevision( 123, 1 );

			expect( mockRestoreContentGuidelinesRevision ).toHaveBeenCalledWith(
				123,
				1
			);
		} );

		test( 'should dispatch success notice after restore', async () => {
			mockSelect.getId.mockReturnValue( 123 );

			mockRestoreContentGuidelinesRevision.mockResolvedValue( {
				id: 123,
				status: 'publish',
			} );
			mockFetchContentGuidelines.mockResolvedValue( {
				id: 123,
				status: 'publish',
			} );

			const noticesDispatch = ( dispatch as jest.Mock )( noticesStore );

			await restoreContentGuidelinesRevision( 123, 1 );
			noticesDispatch.createSuccessNotice( 'Revision restored.', {
				type: 'snackbar',
			} );

			expect( mockDispatch.createSuccessNotice ).toHaveBeenCalledWith(
				'Revision restored.',
				{ type: 'snackbar' }
			);
		} );

		test( 'should refetch guidelines after successful restore', async () => {
			mockSelect.getId.mockReturnValue( 123 );

			mockRestoreContentGuidelinesRevision.mockResolvedValue( {
				id: 123,
				status: 'publish',
			} );
			mockFetchContentGuidelines.mockResolvedValue( {
				id: 123,
				status: 'publish',
			} );

			await restoreContentGuidelinesRevision( 123, 1 );
			await fetchContentGuidelines();

			expect( mockFetchContentGuidelines ).toHaveBeenCalled();
		} );

		test( 'should refetch revisions after successful restore', async () => {
			mockSelect.getId.mockReturnValue( 123 );

			mockRestoreContentGuidelinesRevision.mockResolvedValue( {
				id: 123,
				status: 'publish',
			} );
			mockFetchContentGuidelinesRevisions.mockResolvedValue( {
				revisions: mockRevisions,
				total: 2,
				totalPages: 1,
			} );

			await restoreContentGuidelinesRevision( 123, 1 );
			await fetchContentGuidelinesRevisions( {
				guidelinesId: 123,
				perPage: 100,
			} );

			expect( mockFetchContentGuidelinesRevisions ).toHaveBeenCalledTimes(
				1
			);
		} );

		test( 'should handle restore error and dispatch error notice', async () => {
			mockSelect.getId.mockReturnValue( 123 );

			mockRestoreContentGuidelinesRevision.mockRejectedValue(
				new Error( 'API Error' )
			);

			const noticesDispatch = ( dispatch as jest.Mock )( noticesStore );

			await restoreContentGuidelinesRevision( 123, 1 ).catch( () => {
				noticesDispatch.createErrorNotice(
					'Could not restore revision. Please try again.',
					{ type: 'snackbar' }
				);
			} );

			expect( mockDispatch.createErrorNotice ).toHaveBeenCalledWith(
				'Could not restore revision. Please try again.',
				{ type: 'snackbar' }
			);
		} );

		test( 'should reject when restore API call fails', async () => {
			mockSelect.getId.mockReturnValue( 123 );

			mockRestoreContentGuidelinesRevision.mockRejectedValue(
				new Error( 'API Error' )
			);

			await expect(
				restoreContentGuidelinesRevision( 123, 1 )
			).rejects.toThrow( 'API Error' );
		} );
	} );

	describe( 'Integration - Full Revision History Flow', () => {
		test( 'should complete full flow: fetch revisions, restore, refetch, and notify', async () => {
			mockSelect.getId.mockReturnValue( 123 );

			// Step 1: Fetch initial revisions
			mockFetchContentGuidelinesRevisions.mockResolvedValue( {
				revisions: mockRevisions,
				total: 2,
				totalPages: 1,
			} );

			const guidelinesId = mockSelect.getId();
			const initial = await fetchContentGuidelinesRevisions( {
				guidelinesId,
				perPage: 100,
			} );

			expect( initial.revisions ).toHaveLength( 2 );
			expect( mockFetchContentGuidelinesRevisions ).toHaveBeenCalledWith(
				{
					guidelinesId: 123,
					perPage: 100,
				}
			);

			// Step 2: Restore a revision
			mockRestoreContentGuidelinesRevision.mockResolvedValue( {
				id: 123,
				status: 'publish',
			} );

			await restoreContentGuidelinesRevision(
				guidelinesId,
				initial.revisions[ 0 ].id
			);

			expect( mockRestoreContentGuidelinesRevision ).toHaveBeenCalledWith(
				123,
				1
			);

			// Step 3: Dispatch success notice
			const noticesDispatch = ( dispatch as jest.Mock )( noticesStore );
			noticesDispatch.createSuccessNotice( 'Revision restored.', {
				type: 'snackbar',
			} );

			expect( mockDispatch.createSuccessNotice ).toHaveBeenCalledWith(
				'Revision restored.',
				{ type: 'snackbar' }
			);

			// Step 4: Refetch guidelines after restore
			mockFetchContentGuidelines.mockResolvedValue( {
				id: 123,
				status: 'publish',
			} );

			await fetchContentGuidelines();

			expect( mockFetchContentGuidelines ).toHaveBeenCalled();

			// Step 5: Refetch revisions - list should now reflect restored state
			const updatedRevisions: ContentGuidelinesRevision[] = [
				...mockRevisions,
				{
					id: 3,
					date: '2024-01-03T10:00:00Z',
					author: 1,
					_embedded: {
						author: [ { name: 'Admin User' } ],
					},
				},
			];

			mockFetchContentGuidelinesRevisions.mockResolvedValue( {
				revisions: updatedRevisions,
				total: 3,
				totalPages: 1,
			} );

			const refetched = await fetchContentGuidelinesRevisions( {
				guidelinesId,
				perPage: 100,
			} );

			expect( refetched.revisions ).toHaveLength( 3 );
			expect( mockFetchContentGuidelinesRevisions ).toHaveBeenCalledTimes(
				2
			);
		} );

		test( 'should complete error flow: fetch succeeds, restore fails, error notice dispatched, revisions unchanged', async () => {
			mockSelect.getId.mockReturnValue( 123 );

			// Step 1: Fetch revisions successfully
			mockFetchContentGuidelinesRevisions.mockResolvedValue( {
				revisions: mockRevisions,
				total: 2,
				totalPages: 1,
			} );

			const guidelinesId = mockSelect.getId();
			const initial = await fetchContentGuidelinesRevisions( {
				guidelinesId,
				perPage: 100,
			} );

			expect( initial.revisions ).toHaveLength( 2 );

			// Step 2: Restore fails
			mockRestoreContentGuidelinesRevision.mockRejectedValue(
				new Error( 'API Error' )
			);

			const noticesDispatch = ( dispatch as jest.Mock )( noticesStore );

			await restoreContentGuidelinesRevision(
				guidelinesId,
				initial.revisions[ 0 ].id
			).catch( () => {
				noticesDispatch.createErrorNotice(
					'Could not restore revision. Please try again.',
					{ type: 'snackbar' }
				);
			} );

			// Step 3: Error notice dispatched
			expect( mockDispatch.createErrorNotice ).toHaveBeenCalledWith(
				'Could not restore revision. Please try again.',
				{ type: 'snackbar' }
			);

			// Step 4: Success notice never called
			expect( mockDispatch.createSuccessNotice ).not.toHaveBeenCalled();

			// Step 5: fetchContentGuidelines never called since restore failed
			expect( mockFetchContentGuidelines ).not.toHaveBeenCalled();

			// Step 6: Revisions list remains unchanged
			mockFetchContentGuidelinesRevisions.mockResolvedValue( {
				revisions: mockRevisions,
				total: 2,
				totalPages: 1,
			} );

			const unchanged = await fetchContentGuidelinesRevisions( {
				guidelinesId,
				perPage: 100,
			} );

			expect( unchanged.revisions ).toHaveLength( 2 );
			expect( mockFetchContentGuidelinesRevisions ).toHaveBeenCalledTimes(
				2
			);
		} );

		test( 'should handle fetch failure before restore is attempted', async () => {
			mockSelect.getId.mockReturnValue( 123 );

			// Step 1: Fetch revisions fails
			mockFetchContentGuidelinesRevisions.mockRejectedValue(
				new Error( 'API Error' )
			);

			const noticesDispatch = ( dispatch as jest.Mock )( noticesStore );
			const guidelinesId = mockSelect.getId();

			await fetchContentGuidelinesRevisions( {
				guidelinesId,
				perPage: 100,
			} ).catch( () => {
				noticesDispatch.createErrorNotice(
					'Could not load revision history. Please try again.',
					{ type: 'snackbar' }
				);
			} );

			// Step 2: Error notice dispatched for fetch failure
			expect( mockDispatch.createErrorNotice ).toHaveBeenCalledWith(
				'Could not load revision history. Please try again.',
				{ type: 'snackbar' }
			);

			// Step 3: Restore and guidelines fetch never attempted
			expect(
				mockRestoreContentGuidelinesRevision
			).not.toHaveBeenCalled();
			expect( mockFetchContentGuidelines ).not.toHaveBeenCalled();
		} );

		test( 'should handle null guidelinesId — no fetch or restore attempted', async () => {
			mockSelect.getId.mockReturnValue( null );

			const guidelinesId = mockSelect.getId();

			// Neither fetch nor restore should be called
			if ( guidelinesId ) {
				await fetchContentGuidelinesRevisions( {
					guidelinesId,
					perPage: 100,
				} );
				await restoreContentGuidelinesRevision( guidelinesId, 1 );
			}

			expect(
				mockFetchContentGuidelinesRevisions
			).not.toHaveBeenCalled();
			expect(
				mockRestoreContentGuidelinesRevision
			).not.toHaveBeenCalled();
			expect( mockFetchContentGuidelines ).not.toHaveBeenCalled();
			expect( mockDispatch.createSuccessNotice ).not.toHaveBeenCalled();
			expect( mockDispatch.createErrorNotice ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'Fetch-Restore roundtrip', () => {
		test( 'should fetch revisions, restore one, then refetch updated list', async () => {
			mockSelect.getId.mockReturnValue( 123 );

			// Initial fetch
			mockFetchContentGuidelinesRevisions.mockResolvedValue( {
				revisions: mockRevisions,
				total: 2,
				totalPages: 1,
			} );

			const initial = await fetchContentGuidelinesRevisions( {
				guidelinesId: 123,
				perPage: 100,
			} );

			expect( initial.revisions ).toHaveLength( 2 );

			// Restore first revision
			mockRestoreContentGuidelinesRevision.mockResolvedValue( {
				id: 123,
				status: 'publish',
			} );

			await restoreContentGuidelinesRevision( 123, 1 );

			expect( mockRestoreContentGuidelinesRevision ).toHaveBeenCalledWith(
				123,
				1
			);

			// Refetch after restore
			const updatedRevisions: ContentGuidelinesRevision[] = [
				...mockRevisions,
				{
					id: 3,
					date: '2024-01-03T10:00:00Z',
					author: 1,
					_embedded: {
						author: [ { name: 'Admin User' } ],
					},
				},
			];

			mockFetchContentGuidelinesRevisions.mockResolvedValue( {
				revisions: updatedRevisions,
				total: 3,
				totalPages: 1,
			} );

			const refetched = await fetchContentGuidelinesRevisions( {
				guidelinesId: 123,
				perPage: 100,
			} );

			expect( refetched.revisions ).toHaveLength( 3 );
			expect( mockFetchContentGuidelinesRevisions ).toHaveBeenCalledTimes(
				2
			);
		} );
	} );
} );
