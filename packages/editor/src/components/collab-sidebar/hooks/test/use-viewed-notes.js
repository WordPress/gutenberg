/**
 * WordPress dependencies
 */
import { renderHook, act } from '@testing-library/react';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useViewedNotes } from '../use-viewed-notes';

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	useEntityProp: jest.fn(),
	store: {
		getCurrentUser: jest.fn(),
		getEntityRecord: jest.fn(),
	},
} ) );

describe( 'useViewedNotes', () => {
	const mockPostId = 123;
	const mockUserId = 42;
	const mockSaveEditedEntityRecord = jest.fn();
	const mockSetMeta = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();

		// Default mock implementation for useDispatch
		useDispatch.mockReturnValue( {
			saveEditedEntityRecord: mockSaveEditedEntityRecord,
		} );
	} );

	it( 'should identify unread notes correctly and ignore author notes', () => {
		// Setup mock select returns
		useSelect.mockImplementation( () => {
			// Mocking the getCurrentUser() selector inside the first useSelect
			return mockUserId;
		} );

		// Mock useEntityProp returning empty initial meta
		useEntityProp.mockReturnValue( [ {}, mockSetMeta ] );

		const { result } = renderHook( () => useViewedNotes( mockPostId ) );

		// Note is unread by default if not seen
		expect( result.current.isNoteUnread( 99, 55 ) ).toBe( true );

		// Note is automatically "read" if the current user authored it
		expect( result.current.isNoteUnread( 99, mockUserId ) ).toBe( false );
	} );

	it( 'should return false for isNoteUnread if the note ID is already seen', () => {
		useSelect.mockReturnValue( mockUserId );

		// Mock meta containing already seen notes for this post
		const initialMeta = {
			viewed_notes: {
				[ mockPostId ]: [ '101', '102' ],
			},
		};
		useEntityProp.mockReturnValue( [ initialMeta, mockSetMeta ] );

		const { result } = renderHook( () => useViewedNotes( mockPostId ) );

		expect( result.current.isNoteUnread( 101, 55 ) ).toBe( false ); // Already seen
		expect( result.current.isNoteUnread( 103, 55 ) ).toBe( true ); // New note
	} );

	it( 'should update meta and save record when marking new notes as viewed', () => {
		useSelect.mockReturnValue( mockUserId );

		const initialMeta = {
			viewed_notes: {
				[ mockPostId ]: [ '101' ],
			},
		};
		useEntityProp.mockReturnValue( [ initialMeta, mockSetMeta ] );

		const { result } = renderHook( () => useViewedNotes( mockPostId ) );

		act( () => {
			result.current.markNotesViewed( [ 101, 102, 103 ] );
		} );

		// Should combine old IDs and new unique IDs, converting them to strings
		expect( mockSetMeta ).toHaveBeenCalledWith( {
			viewed_notes: {
				[ mockPostId ]: [ '101', '102', '103' ],
			},
		} );

		// Verifies the crucial fix mentioned in your comments (saving with matching userId)
		expect( mockSaveEditedEntityRecord ).toHaveBeenCalledWith(
			'root',
			'user',
			mockUserId
		);
	} );

	it( 'should bail early and not update if no new note IDs are passed', () => {
		useSelect.mockReturnValue( mockUserId );

		const initialMeta = {
			viewed_notes: {
				[ mockPostId ]: [ '101' ],
			},
		};
		useEntityProp.mockReturnValue( [ initialMeta, mockSetMeta ] );

		const { result } = renderHook( () => useViewedNotes( mockPostId ) );

		act( () => {
			result.current.markNotesViewed( [ 101 ] ); // 101 is already seen
		} );

		expect( mockSetMeta ).not.toHaveBeenCalled();
		expect( mockSaveEditedEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'should bail early if required contexts (postId, notes, userId) are missing', () => {
		useSelect.mockReturnValue( null ); // No logged in user
		useEntityProp.mockReturnValue( [ {}, mockSetMeta ] );

		const { result } = renderHook( () => useViewedNotes( mockPostId ) );

		act( () => {
			result.current.markNotesViewed( [ 101 ] );
		} );

		expect( mockSetMeta ).not.toHaveBeenCalled();
	} );
} );
