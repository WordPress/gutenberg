/**
 * External dependencies
 */
import { act, renderHook, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import {
	useActiveCollaborators,
	useResolvedSelection,
	useGetDebugData,
	useIsDisconnected,
	useOnCollaboratorJoin,
	useOnCollaboratorLeave,
	useOnPostSave,
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
	collaboratorInfo: {
		id: 1,
		name: 'Test User',
		slug: 'test-user',
		avatar_urls: mockAvatarUrls,
		browserType: 'Chrome',
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
	collaboratorMap: {},
} );

describe( 'use-post-editor-awareness-state hooks', () => {
	let mockAwareness: {
		setUp: jest.Mock;
		getCurrentState: jest.Mock;
		onStateChange: jest.Mock;
		convertSelectionStateToAbsolute: jest.Mock;
		getDebugData: jest.Mock;
		doc: {
			getMap: jest.Mock;
		};
	};
	let mockSyncManager: {
		getAwareness: jest.Mock;
	};
	let stateChangeCallback:
		| ( ( newState: PostEditorAwarenessState[] ) => void )
		| null;
	let stateMapObserver:
		| ( ( event: { keysChanged: Set< string > } ) => void )
		| null;
	let mockStateMapData: Record< string, unknown >;
	let mockRecordMapData: Record< string, unknown >;

	beforeEach( () => {
		stateChangeCallback = null;
		stateMapObserver = null;
		mockStateMapData = {};
		mockRecordMapData = {};

		const mockStateMap = {
			get: jest.fn( ( key: string ) => mockStateMapData[ key ] ),
			observe: jest.fn( ( observer: typeof stateMapObserver ) => {
				stateMapObserver = observer;
			} ),
			unobserve: jest.fn(),
		};

		const mockRecordMap = {
			get: jest.fn( ( key: string ) => mockRecordMapData[ key ] ),
		};

		mockAwareness = {
			setUp: jest.fn(),
			getCurrentState: jest.fn().mockReturnValue( [] ),
			onStateChange: jest.fn( ( callback ) => {
				stateChangeCallback = callback;
				return jest.fn(); // unsubscribe function
			} ),
			convertSelectionStateToAbsolute: jest.fn().mockReturnValue( null ),
			getDebugData: jest.fn().mockReturnValue( createMockDebugData() ),
			doc: {
				getMap: jest.fn( ( name: string ) => {
					if ( name === 'state' ) {
						return mockStateMap;
					}
					if ( name === 'document' ) {
						return mockRecordMap;
					}
					return null;
				} ),
			},
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
				useActiveCollaborators( null, 'post' )
			);

			expect( result.current ).toEqual( [] );
			expect( mockSyncManager.getAwareness ).not.toHaveBeenCalled();
		} );

		test( 'should return empty array when postType is null', () => {
			const { result } = renderHook( () =>
				useActiveCollaborators( 123, null )
			);

			expect( result.current ).toEqual( [] );
			expect( mockSyncManager.getAwareness ).not.toHaveBeenCalled();
		} );

		test( 'should return empty array when getSyncManager returns undefined', () => {
			( getSyncManager as jest.Mock ).mockReturnValue( undefined );

			const { result } = renderHook( () =>
				useActiveCollaborators( 123, 'post' )
			);

			expect( result.current ).toEqual( [] );
		} );

		test( 'should return empty array when awareness is not available', () => {
			mockSyncManager.getAwareness.mockReturnValue( undefined );

			const { result } = renderHook( () =>
				useActiveCollaborators( 123, 'post' )
			);

			expect( result.current ).toEqual( [] );
		} );

		test( 'should call getAwareness with correct parameters', () => {
			renderHook( () => useActiveCollaborators( 123, 'post' ) );

			expect( mockSyncManager.getAwareness ).toHaveBeenCalledWith(
				'postType/post',
				'123'
			);
		} );

		test( 'should call awareness.setUp', () => {
			renderHook( () => useActiveCollaborators( 123, 'post' ) );

			expect( mockAwareness.setUp ).toHaveBeenCalled();
		} );

		test( 'should return initial state from getCurrentState', () => {
			const mockUsers = [ createMockActiveUser() ];
			mockAwareness.getCurrentState.mockReturnValue( mockUsers );

			const { result } = renderHook( () =>
				useActiveCollaborators( 123, 'post' )
			);

			expect( result.current ).toEqual( mockUsers );
		} );

		test( 'should subscribe to state changes', () => {
			renderHook( () => useActiveCollaborators( 123, 'post' ) );

			expect( mockAwareness.onStateChange ).toHaveBeenCalled();
		} );

		test( 'should update state when awareness emits changes', async () => {
			const initialUsers: PostEditorAwarenessState[] = [];
			const updatedUsers = [ createMockActiveUser() ];

			mockAwareness.getCurrentState.mockReturnValue( initialUsers );

			const { result } = renderHook( () =>
				useActiveCollaborators( 123, 'post' )
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
				( { postId } ) => useActiveCollaborators( postId, 'post' ),
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
				( { postType } ) => useActiveCollaborators( 123, postType ),
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
				( { postId } ) => useActiveCollaborators( postId, 'post' ),
				{ initialProps: { postId: 123 as number | null } }
			);

			expect( result.current ).toEqual( mockUsers );

			rerender( { postId: null } );

			expect( result.current ).toEqual( [] );
		} );
	} );

	describe( 'useResolvedSelection', () => {
		test( 'should return function that returns default when postId is null', () => {
			const { result } = renderHook( () =>
				useResolvedSelection( null, 'post' )
			);

			const mockSelection: SelectionCursor = {
				type: SelectionType.Cursor,
				cursorPosition: {
					relativePosition: {} as any,
					absoluteOffset: 5,
				},
			};

			expect( result.current( mockSelection ) ).toEqual( {
				richTextOffset: null,
				localClientId: null,
			} );
		} );

		test( 'should call awareness.convertSelectionStateToAbsolute with selection', () => {
			const mockSelection: SelectionCursor = {
				type: SelectionType.Cursor,
				cursorPosition: {
					relativePosition: {} as any,
					absoluteOffset: 5,
				},
			};
			mockAwareness.convertSelectionStateToAbsolute.mockReturnValue( {
				richTextOffset: 10,
				localClientId: 'block-1',
			} );

			const { result } = renderHook( () =>
				useResolvedSelection( 123, 'post' )
			);

			const position = result.current( mockSelection );

			expect(
				mockAwareness.convertSelectionStateToAbsolute
			).toHaveBeenCalledWith( mockSelection );
			expect( position ).toEqual( {
				richTextOffset: 10,
				localClientId: 'block-1',
			} );
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
				collaboratorMap: {},
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
				useActiveCollaborators( 123, 'post' )
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
				collaboratorInfo: {
					id: 1,
					name: 'User One',
					slug: 'user-one',
					avatar_urls: mockAvatarUrls,
					browserType: 'Chrome',
					enteredAt: 1704067200000,
				},
			} );
			const user2 = createMockActiveUser( {
				clientId: 2,
				isMe: false,
				collaboratorInfo: {
					id: 2,
					name: 'User Two',
					slug: 'user-two',
					avatar_urls: mockAvatarUrls,
					browserType: 'Firefox',
					enteredAt: 1704067300000,
				},
			} );

			mockAwareness.getCurrentState.mockReturnValue( [ user1, user2 ] );

			const { result } = renderHook( () =>
				useActiveCollaborators( 123, 'post' )
			);

			expect( result.current ).toHaveLength( 2 );
			expect( result.current[ 0 ].collaboratorInfo.name ).toBe(
				'User One'
			);
			expect( result.current[ 1 ].collaboratorInfo.name ).toBe(
				'User Two'
			);
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

	describe( 'useOnCollaboratorJoin', () => {
		const me = createMockActiveUser( {
			clientId: 1,
			isMe: true,
			collaboratorInfo: {
				id: 1,
				name: 'Me',
				slug: 'me',
				avatar_urls: mockAvatarUrls,
				browserType: 'Chrome',
				enteredAt: 1704067200000,
			},
		} );

		const alice = createMockActiveUser( {
			clientId: 2,
			isMe: false,
			collaboratorInfo: {
				id: 100,
				name: 'Alice',
				slug: 'alice',
				avatar_urls: mockAvatarUrls,
				browserType: 'Chrome',
				enteredAt: 1704067300000,
			},
		} );

		test( 'should not fire on initial mount', () => {
			const callback = jest.fn();
			mockAwareness.getCurrentState.mockReturnValue( [ me, alice ] );

			renderHook( () => useOnCollaboratorJoin( 123, 'post', callback ) );

			expect( callback ).not.toHaveBeenCalled();
		} );

		test( 'should not fire when collaborators load after initially empty state', async () => {
			const callback = jest.fn();
			mockAwareness.getCurrentState.mockReturnValue( [] );

			renderHook( () => useOnCollaboratorJoin( 123, 'post', callback ) );

			// Simulate store hydration: collaborators appear
			act( () => {
				stateChangeCallback?.( [ me, alice ] );
			} );

			await waitFor( () => {
				expect( callback ).not.toHaveBeenCalled();
			} );
		} );

		test( 'should fire callback when a new collaborator joins', async () => {
			const callback = jest.fn();
			mockAwareness.getCurrentState.mockReturnValue( [ me ] );

			renderHook( () => useOnCollaboratorJoin( 123, 'post', callback ) );

			// Alice joins
			act( () => {
				stateChangeCallback?.( [ me, alice ] );
			} );

			await waitFor( () => {
				expect( callback ).toHaveBeenCalledWith( alice, me );
			} );
		} );

		test( 'should not fire callback for the current user', async () => {
			const callback = jest.fn();
			mockAwareness.getCurrentState.mockReturnValue( [] );

			renderHook( () => useOnCollaboratorJoin( 123, 'post', callback ) );

			// First: hydrate with alice so prevCollaborators is non-empty
			act( () => {
				stateChangeCallback?.( [ alice ] );
			} );

			// Now "me" appears
			act( () => {
				stateChangeCallback?.( [ alice, me ] );
			} );

			await waitFor( () => {
				expect( callback ).not.toHaveBeenCalled();
			} );
		} );

		test( 'should not fire when postId is null', () => {
			const callback = jest.fn();

			renderHook( () => useOnCollaboratorJoin( null, 'post', callback ) );

			expect( callback ).not.toHaveBeenCalled();
			expect( mockSyncManager.getAwareness ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'useOnCollaboratorLeave', () => {
		const me = createMockActiveUser( {
			clientId: 1,
			isMe: true,
		} );

		const alice = createMockActiveUser( {
			clientId: 2,
			isMe: false,
			isConnected: true,
			collaboratorInfo: {
				id: 100,
				name: 'Alice',
				slug: 'alice',
				avatar_urls: mockAvatarUrls,
				browserType: 'Chrome',
				enteredAt: 1704067300000,
			},
		} );

		test( 'should fire callback when a connected collaborator disconnects', async () => {
			const callback = jest.fn();
			mockAwareness.getCurrentState.mockReturnValue( [ me, alice ] );

			renderHook( () => useOnCollaboratorLeave( 123, 'post', callback ) );

			// Alice disconnects
			act( () => {
				stateChangeCallback?.( [
					me,
					{ ...alice, isConnected: false },
				] );
			} );

			await waitFor( () => {
				expect( callback ).toHaveBeenCalledWith( alice );
			} );
		} );

		test( 'should fire callback when a connected collaborator disappears from the list', async () => {
			const callback = jest.fn();
			mockAwareness.getCurrentState.mockReturnValue( [ me, alice ] );

			renderHook( () => useOnCollaboratorLeave( 123, 'post', callback ) );

			// Alice disappears entirely
			act( () => {
				stateChangeCallback?.( [ me ] );
			} );

			await waitFor( () => {
				expect( callback ).toHaveBeenCalledWith( alice );
			} );
		} );

		test( 'should not fire callback when an already-disconnected collaborator is removed', async () => {
			const callback = jest.fn();
			const disconnectedAlice = { ...alice, isConnected: false };
			mockAwareness.getCurrentState.mockReturnValue( [
				me,
				disconnectedAlice,
			] );

			renderHook( () => useOnCollaboratorLeave( 123, 'post', callback ) );

			// Disconnected Alice is removed from list (cleanup after delay)
			act( () => {
				stateChangeCallback?.( [ me ] );
			} );

			await waitFor( () => {
				expect( callback ).not.toHaveBeenCalled();
			} );
		} );

		test( 'should not fire callback for the current user disconnecting', async () => {
			const callback = jest.fn();
			mockAwareness.getCurrentState.mockReturnValue( [ me, alice ] );

			renderHook( () => useOnCollaboratorLeave( 123, 'post', callback ) );

			// "Me" disconnects
			act( () => {
				stateChangeCallback?.( [
					{ ...me, isConnected: false },
					alice,
				] );
			} );

			await waitFor( () => {
				expect( callback ).not.toHaveBeenCalled();
			} );
		} );

		test( 'should not fire on initial mount', () => {
			const callback = jest.fn();
			mockAwareness.getCurrentState.mockReturnValue( [ me, alice ] );

			renderHook( () => useOnCollaboratorLeave( 123, 'post', callback ) );

			expect( callback ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'useOnPostSave', () => {
		const me = createMockActiveUser( {
			clientId: 1,
			isMe: true,
		} );

		const alice = createMockActiveUser( {
			clientId: 2,
			isMe: false,
			collaboratorInfo: {
				id: 100,
				name: 'Alice',
				slug: 'alice',
				avatar_urls: mockAvatarUrls,
				browserType: 'Chrome',
				enteredAt: 1704067300000,
			},
		} );

		test( 'should fire callback when a remote collaborator saves', async () => {
			const callback = jest.fn();
			mockAwareness.getCurrentState.mockReturnValue( [ me, alice ] );

			renderHook( () => useOnPostSave( 123, 'post', callback ) );

			// Simulate a save event via the Y.Doc state map
			const savedAt = Date.now() + 1000;
			mockStateMapData = {
				savedAt,
				savedBy: alice.clientId,
			};
			mockRecordMapData = { status: 'draft' };

			act( () => {
				stateMapObserver?.( {
					keysChanged: new Set( [ 'savedAt' ] ),
				} );
			} );

			await waitFor( () => {
				expect( callback ).toHaveBeenCalledWith(
					{
						savedAt,
						savedByClientId: alice.clientId,
						postStatus: 'draft',
					},
					alice,
					null
				);
			} );
		} );

		test( 'should pass previous save event on subsequent saves', async () => {
			const callback = jest.fn();
			mockAwareness.getCurrentState.mockReturnValue( [ me, alice ] );

			renderHook( () => useOnPostSave( 123, 'post', callback ) );

			// First save
			const firstSavedAt = Date.now() + 1000;
			mockStateMapData = {
				savedAt: firstSavedAt,
				savedBy: alice.clientId,
			};
			mockRecordMapData = { status: 'draft' };

			act( () => {
				stateMapObserver?.( {
					keysChanged: new Set( [ 'savedAt' ] ),
				} );
			} );

			await waitFor( () => {
				expect( callback ).toHaveBeenCalledTimes( 1 );
			} );

			// Second save
			const secondSavedAt = Date.now() + 2000;
			mockStateMapData = {
				savedAt: secondSavedAt,
				savedBy: alice.clientId,
			};
			mockRecordMapData = { status: 'publish' };

			act( () => {
				stateMapObserver?.( {
					keysChanged: new Set( [ 'savedAt' ] ),
				} );
			} );

			await waitFor( () => {
				expect( callback ).toHaveBeenCalledTimes( 2 );
			} );

			expect( callback ).toHaveBeenLastCalledWith(
				{
					savedAt: secondSavedAt,
					savedByClientId: alice.clientId,
					postStatus: 'publish',
				},
				alice,
				{
					savedAt: firstSavedAt,
					savedByClientId: alice.clientId,
					postStatus: 'draft',
				}
			);
		} );

		test( 'should not fire callback when the current user saves', async () => {
			const callback = jest.fn();
			mockAwareness.getCurrentState.mockReturnValue( [ me, alice ] );

			renderHook( () => useOnPostSave( 123, 'post', callback ) );

			// Simulate a save event by "me"
			const savedAt = Date.now() + 1000;
			mockStateMapData = {
				savedAt,
				savedBy: me.clientId,
			};
			mockRecordMapData = { status: 'draft' };

			act( () => {
				stateMapObserver?.( {
					keysChanged: new Set( [ 'savedAt' ] ),
				} );
			} );

			await waitFor( () => {
				expect( callback ).not.toHaveBeenCalled();
			} );
		} );

		test( 'should not fire callback when saver is not in the collaborator list', async () => {
			const callback = jest.fn();
			mockAwareness.getCurrentState.mockReturnValue( [ me ] );

			renderHook( () => useOnPostSave( 123, 'post', callback ) );

			// Simulate a save from an unknown client
			const savedAt = Date.now() + 1000;
			mockStateMapData = {
				savedAt,
				savedBy: 99999,
			};
			mockRecordMapData = { status: 'draft' };

			act( () => {
				stateMapObserver?.( {
					keysChanged: new Set( [ 'savedAt' ] ),
				} );
			} );

			await waitFor( () => {
				expect( callback ).not.toHaveBeenCalled();
			} );
		} );

		test( 'should not fire duplicate callbacks for the same savedAt timestamp', async () => {
			const callback = jest.fn();
			mockAwareness.getCurrentState.mockReturnValue( [ me, alice ] );

			renderHook( () => useOnPostSave( 123, 'post', callback ) );

			const savedAt = Date.now() + 1000;
			mockStateMapData = {
				savedAt,
				savedBy: alice.clientId,
			};
			mockRecordMapData = { status: 'draft' };

			// First save event
			act( () => {
				stateMapObserver?.( {
					keysChanged: new Set( [ 'savedAt' ] ),
				} );
			} );

			await waitFor( () => {
				expect( callback ).toHaveBeenCalledTimes( 1 );
			} );

			// Same savedAt again (e.g. component re-render)
			act( () => {
				stateMapObserver?.( {
					keysChanged: new Set( [ 'savedAt' ] ),
				} );
			} );

			// Should still be 1 call
			expect( callback ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'should not fire when postId is null', () => {
			const callback = jest.fn();

			renderHook( () => useOnPostSave( null, 'post', callback ) );

			expect( callback ).not.toHaveBeenCalled();
		} );
	} );
} );
