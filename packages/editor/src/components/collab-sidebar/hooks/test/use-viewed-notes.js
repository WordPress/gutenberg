/**
 * WordPress dependencies
 */
import { renderHook, act } from '@testing-library/react';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useViewedNotes } from '../use-viewed-notes';

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

// Mock the private getViewedNoteIds/markNotesViewed that `unlock()` exposes
// on the core-data store object passed to useSelect/useDispatch callbacks.
const mockGetViewedNoteIds = jest.fn();
const mockMarkNotesViewed = jest.fn();

jest.mock( '../../../../lock-unlock', () => ( {
	unlock: jest.fn( () => ( {
		getViewedNoteIds: mockGetViewedNoteIds,
		markNotesViewed: mockMarkNotesViewed,
	} ) ),
} ) );

describe( 'useViewedNotes', () => {
	const mockPostId = 123;
	const mockUserId = 42;

	beforeEach( () => {
		jest.clearAllMocks();

		useDispatch.mockReturnValue( {
			markNotesViewed: mockMarkNotesViewed,
		} );
	} );

	function mockSelectors( { currentUserId, viewedIds = [] } ) {
		useSelect.mockImplementation( ( selectorFn ) => {
			// First call in the hook resolves getCurrentUser via coreStore
			// directly; second resolves getViewedNoteIds via unlock().
			// We distinguish by calling the passed selector against a fake
			// `select` that dispatches to the right mock per call shape.
			const fakeSelect = () => ( {
				getCurrentUser: () => ( { id: currentUserId } ),
			} );
			try {
				const directResult = selectorFn( fakeSelect );
				if ( directResult !== undefined ) {
					return directResult;
				}
			} catch {
				// Selector referenced unlock() internals; fall through.
			}
			return viewedIds;
		} );
	}

	it( 'identifies unread notes and ignores notes authored by the current user', () => {
		mockGetViewedNoteIds.mockReturnValue( [] );
		mockSelectors( { currentUserId: mockUserId, viewedIds: [] } );

		const { result } = renderHook( () => useViewedNotes( mockPostId ) );

		expect( result.current.isNoteUnread( 99, 55 ) ).toBe( true );
		expect( result.current.isNoteUnread( 99, mockUserId ) ).toBe( false );
	} );

	it( 'returns false for isNoteUnread when the id is already viewed', () => {
		mockGetViewedNoteIds.mockReturnValue( [ '101', '102' ] );
		mockSelectors( {
			currentUserId: mockUserId,
			viewedIds: [ '101', '102' ],
		} );

		const { result } = renderHook( () => useViewedNotes( mockPostId ) );

		expect( result.current.isNoteUnread( 101, 55 ) ).toBe( false );
		expect( result.current.isNoteUnread( 103, 55 ) ).toBe( true );
	} );

	it( 'dispatches markNotesViewed with the post id and note ids', () => {
		mockGetViewedNoteIds.mockReturnValue( [ '101' ] );
		mockSelectors( {
			currentUserId: mockUserId,
			viewedIds: [ '101' ],
		} );

		const { result } = renderHook( () => useViewedNotes( mockPostId ) );

		act( () => {
			result.current.markNotesViewed( [ 101, 102, 103 ] );
		} );

		expect( mockMarkNotesViewed ).toHaveBeenCalledWith(
			mockPostId,
			[ 101, 102, 103 ]
		);
	} );

	it( 'does not dispatch when postId is missing', () => {
		mockGetViewedNoteIds.mockReturnValue( [] );
		mockSelectors( { currentUserId: mockUserId, viewedIds: [] } );

		const { result } = renderHook( () => useViewedNotes( undefined ) );

		act( () => {
			result.current.markNotesViewed( [ 101 ] );
		} );

		expect( mockMarkNotesViewed ).not.toHaveBeenCalled();
	} );
} );
