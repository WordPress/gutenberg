/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useCollaboratorNotifications } from '../use-collaborator-notifications';

// --- Mocks ---

const mockCreateNotice = jest.fn();
let mockOnJoinCallback: Function | null = null;
let mockOnLeaveCallback: Function | null = null;
let mockOnPostSaveCallback: Function | null = null;
let lastJoinPostId: unknown;
let lastLeavePostId: unknown;
let lastSavePostId: unknown;
let mockEditorState = {
	postStatus: 'draft',
	isCollaborationEnabled: true,
	showCollaborationNotifications: true,
};

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
} ) );

jest.mock( '@wordpress/notices', () => ( {
	store: 'core/notices',
} ) );

jest.mock( '@wordpress/preferences', () => ( {
	store: 'core/preferences',
} ) );

// Mock the editor store to prevent deep import chain (blocks, rich-text, etc.)
jest.mock( '../../../store', () => ( {
	store: 'core/editor',
} ) );

// Mock the private APIs and unlock mechanism
jest.mock( '@wordpress/core-data', () => ( {
	privateApis: {},
} ) );

jest.mock( '../../../lock-unlock', () => ( {
	unlock: jest.fn( () => ( {
		useOnCollaboratorJoin: jest.fn(
			( postId: unknown, _postType: unknown, callback: Function ) => {
				lastJoinPostId = postId;
				mockOnJoinCallback = callback;
			}
		),
		useOnCollaboratorLeave: jest.fn(
			( postId: unknown, _postType: unknown, callback: Function ) => {
				lastLeavePostId = postId;
				mockOnLeaveCallback = callback;
			}
		),
		useOnPostSave: jest.fn(
			( postId: unknown, _postType: unknown, callback: Function ) => {
				lastSavePostId = postId;
				mockOnPostSaveCallback = callback;
			}
		),
	} ) ),
} ) );

// --- Helpers ---

const BASE_ENTERED_AT = 1704067200000;

function makeCollaborator( overrides: Record< string, unknown > = {} ) {
	return {
		clientId: 1,
		isMe: false,
		isConnected: true,
		collaboratorInfo: {
			id: 100,
			name: 'Alice',
			slug: 'alice',
			avatar_urls: {},
			browserType: 'Chrome',
			enteredAt: BASE_ENTERED_AT + 1000,
		},
		...overrides,
	};
}

function makeMe( overrides: Record< string, unknown > = {} ) {
	return makeCollaborator( {
		clientId: 999,
		isMe: true,
		collaboratorInfo: {
			id: 1,
			name: 'Me',
			slug: 'me',
			avatar_urls: {},
			browserType: 'Chrome',
			enteredAt: BASE_ENTERED_AT + 5000, // joined later than Alice
		},
		...overrides,
	} );
}

// --- Setup ---

function buildMockSelect() {
	return ( storeKey: string ) => {
		if ( storeKey === 'core/preferences' ) {
			return {
				get: ( scope: string, name: string ) => {
					if (
						scope === 'core' &&
						name === 'showCollaborationNotifications'
					) {
						return mockEditorState.showCollaborationNotifications;
					}
					return undefined;
				},
			};
		}
		return {
			getCurrentPostAttribute: ( attr: string ) =>
				attr === 'status' ? mockEditorState.postStatus : undefined,
			isCollaborationEnabledForCurrentPost: () =>
				mockEditorState.isCollaborationEnabled,
		};
	};
}

beforeEach( () => {
	mockOnJoinCallback = null;
	mockOnLeaveCallback = null;
	mockOnPostSaveCallback = null;
	lastJoinPostId = undefined;
	lastLeavePostId = undefined;
	lastSavePostId = undefined;
	mockEditorState = {
		postStatus: 'draft',
		isCollaborationEnabled: true,
		showCollaborationNotifications: true,
	};
	mockCreateNotice.mockClear();
	( useSelect as jest.Mock ).mockImplementation( ( selector: Function ) =>
		selector( buildMockSelect() )
	);
	( useDispatch as jest.Mock ).mockReturnValue( {
		createNotice: mockCreateNotice,
	} );
} );

// --- Tests ---

describe( 'useCollaboratorNotifications', () => {
	describe( 'collaborator join notifications', () => {
		it( 'fires join notification for a collaborator who joined after current user', () => {
			const me = makeMe(); // enteredAt: BASE_ENTERED_AT + 5000
			const bobJoinedAfter = makeCollaborator( {
				clientId: 2,
				collaboratorInfo: {
					id: 200,
					name: 'Bob',
					slug: 'bob',
					avatar_urls: {},
					browserType: 'Firefox',
					enteredAt: BASE_ENTERED_AT + 10000, // joined after me
				},
			} );

			renderHook( () => useCollaboratorNotifications( 123, 'post' ) );

			// Simulate the core-data hook firing the join callback
			mockOnJoinCallback?.( bobJoinedAfter, me );

			expect( mockCreateNotice ).toHaveBeenCalledWith(
				'info',
				'Bob has joined the post.',
				expect.objectContaining( {
					id: 'collab-user-entered-200',
				} )
			);
		} );

		it( 'skips join notification for collaborators who joined before current user', () => {
			const me = makeMe(); // enteredAt: BASE_ENTERED_AT + 5000
			const aliceJoinedFirst = makeCollaborator( {
				collaboratorInfo: {
					id: 100,
					name: 'Alice',
					slug: 'alice',
					avatar_urls: {},
					browserType: 'Chrome',
					enteredAt: BASE_ENTERED_AT + 1000, // joined earlier than me
				},
			} );

			renderHook( () => useCollaboratorNotifications( 123, 'post' ) );

			// Simulate the core-data hook firing the join callback
			mockOnJoinCallback?.( aliceJoinedFirst, me );

			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'collaborator leave notifications', () => {
		it( 'fires a leave notification when a collaborator leaves', () => {
			const alice = makeCollaborator();
			renderHook( () => useCollaboratorNotifications( 123, 'post' ) );

			// Simulate the core-data hook firing the leave callback
			mockOnLeaveCallback?.( alice );

			expect( mockCreateNotice ).toHaveBeenCalledWith(
				'info',
				'Alice has left the post.',
				expect.objectContaining( {
					type: 'snackbar',
					isDismissible: false,
					id: 'collab-user-exited-100',
				} )
			);
		} );
	} );

	describe( 'post updated notifications', () => {
		it( 'fires a post updated notification when a collaborator saves (draft)', () => {
			const alice = makeCollaborator();
			renderHook( () => useCollaboratorNotifications( 123, 'post' ) );

			// Simulate the core-data hook firing the save callback
			mockOnPostSaveCallback?.(
				{
					savedAt: Date.now(),
					savedByClientId: alice.clientId,
					postStatus: undefined,
				},
				alice,
				null
			);

			expect( mockCreateNotice ).toHaveBeenCalledWith(
				'info',
				'Draft saved by Alice.',
				expect.objectContaining( {
					type: 'snackbar',
					isDismissible: false,
					id: 'collab-post-updated-100',
				} )
			);
		} );

		it( 'fires a post updated notification with "Post updated" for published status', () => {
			mockEditorState = {
				...mockEditorState,
				postStatus: 'publish',
			};
			const alice = makeCollaborator();
			renderHook( () => useCollaboratorNotifications( 123, 'post' ) );

			mockOnPostSaveCallback?.(
				{
					savedAt: Date.now(),
					savedByClientId: alice.clientId,
					postStatus: 'publish',
				},
				alice,
				null
			);

			expect( mockCreateNotice ).toHaveBeenCalledWith(
				'info',
				'Post updated by Alice.',
				expect.objectContaining( {
					id: 'collab-post-updated-100',
				} )
			);
		} );

		it( 'fires a "Post published" notification on first publish (no previous save)', () => {
			mockEditorState = {
				...mockEditorState,
				postStatus: 'draft',
			};
			const alice = makeCollaborator();
			renderHook( () => useCollaboratorNotifications( 123, 'post' ) );

			mockOnPostSaveCallback?.(
				{
					savedAt: Date.now(),
					savedByClientId: alice.clientId,
					postStatus: 'publish',
				},
				alice,
				null
			);

			expect( mockCreateNotice ).toHaveBeenCalledWith(
				'info',
				'Post published by Alice.',
				expect.objectContaining( {
					id: 'collab-post-updated-100',
				} )
			);
		} );

		it( 'fires a "Post published" notification using prevEvent status for transition detection', () => {
			// Redux postStatus may already be 'publish' by the time the
			// callback fires. The prevEvent carries the accurate prior status.
			mockEditorState = {
				...mockEditorState,
				postStatus: 'publish',
			};
			const alice = makeCollaborator();
			renderHook( () => useCollaboratorNotifications( 123, 'post' ) );

			mockOnPostSaveCallback?.(
				{
					savedAt: Date.now() + 2000,
					savedByClientId: alice.clientId,
					postStatus: 'publish',
				},
				alice,
				{
					savedAt: Date.now() + 1000,
					savedByClientId: alice.clientId,
					postStatus: 'draft',
				}
			);

			expect( mockCreateNotice ).toHaveBeenCalledWith(
				'info',
				'Post published by Alice.',
				expect.objectContaining( {
					id: 'collab-post-updated-100',
				} )
			);
		} );

		it( 'does not fire a notification when postStatus is undefined', () => {
			mockEditorState = {
				...mockEditorState,
				postStatus: undefined as any,
			};
			const alice = makeCollaborator();
			renderHook( () => useCollaboratorNotifications( 123, 'post' ) );

			mockOnPostSaveCallback?.(
				{
					savedAt: Date.now(),
					savedByClientId: alice.clientId,
					postStatus: undefined,
				},
				alice,
				null
			);

			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'when notifications are disabled', () => {
		it( 'passes null postId to hooks when showCollaborationNotifications preference is false', () => {
			mockEditorState = {
				...mockEditorState,
				showCollaborationNotifications: false,
			};
			renderHook( () => useCollaboratorNotifications( 123, 'post' ) );

			expect( lastJoinPostId ).toBeNull();
			expect( lastLeavePostId ).toBeNull();
			expect( lastSavePostId ).toBeNull();
		} );

		it( 'passes null postId to hooks when collaboration is disabled', () => {
			mockEditorState = {
				...mockEditorState,
				isCollaborationEnabled: false,
			};
			renderHook( () => useCollaboratorNotifications( 123, 'post' ) );

			expect( lastJoinPostId ).toBeNull();
			expect( lastLeavePostId ).toBeNull();
			expect( lastSavePostId ).toBeNull();
		} );
	} );
} );
