/**
 * External dependencies
 */
import { act, renderHook, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import {
	useActiveUsers,
	useGetAbsolutePositionIndex,
	useGetDebugData,
	useIsDisconnected,
} from '../use-post-editor-awareness-state';
import { getSyncManager } from '../../sync';
import { SelectionType } from '../../utils/crdt-user-selections';
import type {
	PostEditorAwarenessState,
	YDocDebugData,
} from '../../awareness/types';
import type { SelectionCursor } from '../../types';

// Mock the sync module
jest.mock( '../../sync', () => ( {
	getSyncManager: jest.fn(),
} ) );

const mockAvatarUrls = {
	'24': 'https://example.com/avatar-24.png',
	'48': 'https://example.com/avatar-48.png',
	'96': 'https://example.com/avatar-96.png',
};

const createMockActiveUser = (
	overrides: Partial< PostEditorAwarenessState > = {}
): PostEditorAwarenessState => ( {
	clientId: 12345,
	isMe: false,
	isConnected: true,
	userInfo: {
		id: 1,
		name: 'Test User',
		slug: 'test-user',
		avatar_urls: mockAvatarUrls,
		browserType: 'Chrome',
		color: '#3858E9',
		enteredAt: 1704067200000,
	},
	editorState: {
		selection: {
			type: SelectionType.None,
		},
	},
	...overrides,
} );

const createMockDebugData = (): YDocDebugData => ( {
	doc: { testKey: 'testValue' },
	clients: {},
	userMap: {},
} );

describe( 'use-post-editor-awareness-state hooks', () => {
	let mockAwareness: {
		setUp: jest.Mock;
		getCurrentState: jest.Mock;
		onStateChange: jest.Mock;
		getAbsolutePositionIndex: jest.Mock;
		getDebugData: jest.Mock;
	};
	let mockSyncManager: {
		getAwareness: jest.Mock;
	};
	let stateChangeCallback:
		| ( ( newState: PostEditorAwarenessState[] ) => void )
		| null;

	beforeEach( () => {
		stateChangeCallback = null;

		mockAwareness = {
			setUp: jest.fn(),
			getCurrentState: jest.fn().mockReturnValue( [] ),
			onStateChange: jest.fn( ( callback ) => {
				stateChangeCallback = callback;
				return jest.fn(); // unsubscribe function
			} ),
			getAbsolutePositionIndex: jest.fn().mockReturnValue( null ),
			getDebugData: jest.fn().mockReturnValue( createMockDebugData() ),
		};

		mockSyncManager = {
			getAwareness: jest.fn().mockReturnValue( mockAwareness ),
		};

		( getSyncManager as jest.Mock ).mockReturnValue( mockSyncManager );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'useActiveUsers', () => {
		test( 'should return empty array when postId is null', () => {
			const { result } = renderHook( () =>
				useActiveUsers( null, 'post' )
			);

			expect( result.current ).toEqual( [] );
			expect( mockSyncManager.getAwareness ).not.toHaveBeenCalled();
		} );

		test( 'should return empty array when postType is null', () => {
			const { result } = renderHook( () => useActiveUsers( 123, null ) );

			expect( result.current ).toEqual( [] );
			expect( mockSyncManager.getAwareness ).not.toHaveBeenCalled();
		} );

		test( 'should return empty array when getSyncManager returns undefined', () => {
			( getSyncManager as jest.Mock ).mockReturnValue( undefined );

			const { result } = renderHook( () =>
				useActiveUsers( 123, 'post' )
			);

			expect( result.current ).toEqual( [] );
		} );

		test( 'should return empty array when awareness is not available', () => {
			mockSyncManager.getAwareness.mockReturnValue( undefined );

			const { result } = renderHook( () =>
				useActiveUsers( 123, 'post' )
			);

			expect( result.current ).toEqual( [] );
		} );

		test( 'should call getAwareness with correct parameters', () => {
			renderHook( () => useActiveUsers( 123, 'post' ) );

			expect( mockSyncManager.getAwareness ).toHaveBeenCalledWith(
				'postType/post',
				'123'
			);
		} );

		test( 'should call awareness.setUp', () => {
			renderHook( () => useActiveUsers( 123, 'post' ) );

			expect( mockAwareness.setUp ).toHaveBeenCalled();
		} );

		test( 'should return initial state from getCurrentState', () => {
			const mockUsers = [ createMockActiveUser() ];
			mockAwareness.getCurrentState.mockReturnValue( mockUsers );

			const { result } = renderHook( () =>
				useActiveUsers( 123, 'post' )
			);

			expect( result.current ).toEqual( mockUsers );
		} );

		test( 'should subscribe to state changes', () => {
			renderHook( () => useActiveUsers( 123, 'post' ) );

			expect( mockAwareness.onStateChange ).toHaveBeenCalled();
		} );

		test( 'should update state when awareness emits changes', async () => {
			const initialUsers: PostEditorAwarenessState[] = [];
			const updatedUsers = [ createMockActiveUser() ];

			mockAwareness.getCurrentState.mockReturnValue( initialUsers );

			const { result } = renderHook( () =>
				useActiveUsers( 123, 'post' )
			);

			expect( result.current ).toEqual( initialUsers );

			// Simulate awareness state change
			act( () => {
				stateChangeCallback?.( updatedUsers );
			} );

			await waitFor( () => {
				expect( result.current ).toEqual( updatedUsers );
			} );
		} );

		test( 'should unsubscribe when postId changes', () => {
			const unsubscribe = jest.fn();
			mockAwareness.onStateChange.mockReturnValue( unsubscribe );

			const { rerender } = renderHook(
				( { postId } ) => useActiveUsers( postId, 'post' ),
				{ initialProps: { postId: 123 as number | null } }
			);

			expect( unsubscribe ).not.toHaveBeenCalled();

			rerender( { postId: 456 } );

			expect( unsubscribe ).toHaveBeenCalled();
		} );

		test( 'should unsubscribe when postType changes', () => {
			const unsubscribe = jest.fn();
			mockAwareness.onStateChange.mockReturnValue( unsubscribe );

			const { rerender } = renderHook(
				( { postType } ) => useActiveUsers( 123, postType ),
				{ initialProps: { postType: 'post' as string | null } }
			);

			expect( unsubscribe ).not.toHaveBeenCalled();

			rerender( { postType: 'page' } );

			expect( unsubscribe ).toHaveBeenCalled();
		} );

		test( 'should reset state when postId becomes null', () => {
			const mockUsers = [ createMockActiveUser() ];
			mockAwareness.getCurrentState.mockReturnValue( mockUsers );

			const { result, rerender } = renderHook(
				( { postId } ) => useActiveUsers( postId, 'post' ),
				{ initialProps: { postId: 123 as number | null } }
			);

			expect( result.current ).toEqual( mockUsers );

			rerender( { postId: null } );

			expect( result.current ).toEqual( [] );
		} );
	} );

	describe( 'useGetAbsolutePositionIndex', () => {
		test( 'should return function that returns null when postId is null', () => {
			const { result } = renderHook( () =>
				useGetAbsolutePositionIndex( null, 'post' )
			);

			const mockSelection: SelectionCursor = {
				type: SelectionType.Cursor,
				blockId: 'block-1',
				cursorPosition: {
					relativePosition: {} as any,
					absoluteOffset: 5,
				},
			};

			expect( result.current( mockSelection ) ).toBeNull();
		} );

		test( 'should call awareness.getAbsolutePositionIndex with selection', () => {
			const mockSelection: SelectionCursor = {
				type: SelectionType.Cursor,
				blockId: 'block-1',
				cursorPosition: {
					relativePosition: {} as any,
					absoluteOffset: 5,
				},
			};
			mockAwareness.getAbsolutePositionIndex.mockReturnValue( 10 );

			const { result } = renderHook( () =>
				useGetAbsolutePositionIndex( 123, 'post' )
			);

			const position = result.current( mockSelection );

			expect(
				mockAwareness.getAbsolutePositionIndex
			).toHaveBeenCalledWith( mockSelection );
			expect( position ).toBe( 10 );
		} );
	} );

	describe( 'useGetDebugData', () => {
		test( 'should return default debug data when postId is null', () => {
			const { result } = renderHook( () =>
				useGetDebugData( null, 'post' )
			);

			expect( result.current ).toEqual( {
				doc: {},
				clients: {},
				userMap: {},
			} );
		} );

		test( 'should call awareness.getDebugData and return result', () => {
			const mockDebugData = createMockDebugData();
			mockAwareness.getDebugData.mockReturnValue( mockDebugData );

			const { result } = renderHook( () =>
				useGetDebugData( 123, 'post' )
			);

			expect( result.current ).toEqual( mockDebugData );
		} );
	} );

	describe( 'useIsDisconnected', () => {
		test( 'should return false when postId is null', () => {
			const { result } = renderHook( () =>
				useIsDisconnected( null, 'post' )
			);

			expect( result.current ).toBe( false );
		} );

		test( 'should return false when current user is connected', () => {
			const connectedUser = createMockActiveUser( {
				isMe: true,
				isConnected: true,
			} );
			mockAwareness.getCurrentState.mockReturnValue( [ connectedUser ] );

			const { result } = renderHook( () =>
				useIsDisconnected( 123, 'post' )
			);

			expect( result.current ).toBe( false );
		} );

		test( 'should return true when current user is disconnected', () => {
			const disconnectedUser = createMockActiveUser( {
				isMe: true,
				isConnected: false,
			} );
			mockAwareness.getCurrentState.mockReturnValue( [
				disconnectedUser,
			] );

			const { result } = renderHook( () =>
				useIsDisconnected( 123, 'post' )
			);

			expect( result.current ).toBe( true );
		} );

		test( 'should return false when no user is marked as me', () => {
			const otherUser = createMockActiveUser( {
				isMe: false,
				isConnected: false,
			} );
			mockAwareness.getCurrentState.mockReturnValue( [ otherUser ] );

			const { result } = renderHook( () =>
				useIsDisconnected( 123, 'post' )
			);

			expect( result.current ).toBe( false );
		} );

		test( 'should update when state changes to disconnected', async () => {
			const connectedUser = createMockActiveUser( {
				isMe: true,
				isConnected: true,
			} );
			const disconnectedUser = createMockActiveUser( {
				isMe: true,
				isConnected: false,
			} );

			mockAwareness.getCurrentState.mockReturnValue( [ connectedUser ] );

			const { result } = renderHook( () =>
				useIsDisconnected( 123, 'post' )
			);

			expect( result.current ).toBe( false );

			// Simulate disconnection
			act( () => {
				stateChangeCallback?.( [ disconnectedUser ] );
			} );

			await waitFor( () => {
				expect( result.current ).toBe( true );
			} );
		} );
	} );

	describe( 'hook cleanup', () => {
		test( 'should unsubscribe on unmount', () => {
			const unsubscribe = jest.fn();
			mockAwareness.onStateChange.mockReturnValue( unsubscribe );

			const { unmount } = renderHook( () =>
				useActiveUsers( 123, 'post' )
			);

			expect( unsubscribe ).not.toHaveBeenCalled();

			unmount();

			expect( unsubscribe ).toHaveBeenCalled();
		} );
	} );

	describe( 'multiple users scenario', () => {
		test( 'should handle multiple active users', () => {
			const user1 = createMockActiveUser( {
				clientId: 1,
				isMe: true,
				userInfo: {
					id: 1,
					name: 'User One',
					slug: 'user-one',
					avatar_urls: mockAvatarUrls,
					browserType: 'Chrome',
					color: '#3858E9',
					enteredAt: 1704067200000,
				},
			} );
			const user2 = createMockActiveUser( {
				clientId: 2,
				isMe: false,
				userInfo: {
					id: 2,
					name: 'User Two',
					slug: 'user-two',
					avatar_urls: mockAvatarUrls,
					browserType: 'Firefox',
					color: '#E33184',
					enteredAt: 1704067300000,
				},
			} );

			mockAwareness.getCurrentState.mockReturnValue( [ user1, user2 ] );

			const { result } = renderHook( () =>
				useActiveUsers( 123, 'post' )
			);

			expect( result.current ).toHaveLength( 2 );
			expect( result.current[ 0 ].userInfo.name ).toBe( 'User One' );
			expect( result.current[ 1 ].userInfo.name ).toBe( 'User Two' );
		} );

		test( 'should identify correct user as disconnected among multiple', () => {
			const meConnected = createMockActiveUser( {
				clientId: 1,
				isMe: true,
				isConnected: true,
			} );
			const otherDisconnected = createMockActiveUser( {
				clientId: 2,
				isMe: false,
				isConnected: false,
			} );

			mockAwareness.getCurrentState.mockReturnValue( [
				meConnected,
				otherDisconnected,
			] );

			const { result } = renderHook( () =>
				useIsDisconnected( 123, 'post' )
			);

			// Should be false because *I* am connected (other user's status doesn't matter)
			expect( result.current ).toBe( false );
		} );
	} );
} );
