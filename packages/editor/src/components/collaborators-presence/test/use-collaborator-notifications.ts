/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { useCollaboratorNotifications } from '../use-collaborator-notifications';

// --- Mocks ---

const mockCreateNotice = jest.fn();
const mockBroadcastSaveEvent = jest.fn();
let mockActiveCollaborators: any[] = [];
let mockEditorState = {
	isSaving: false,
	isAutosaving: false,
	didSaveSucceed: true,
	postStatus: 'draft',
	isCollaborationEnabled: true,
};

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
} ) );

jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn(
		( _hook: string, defaultValue: unknown ) => defaultValue
	),
} ) );

jest.mock( '@wordpress/notices', () => ( {
	store: 'core/notices',
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
		useActiveCollaborators: jest.fn( () => mockActiveCollaborators ),
		useBroadcastSaveEvent: jest.fn( () => mockBroadcastSaveEvent ),
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
	return () => ( {
		isSavingPost: () => mockEditorState.isSaving,
		isAutosavingPost: () => mockEditorState.isAutosaving,
		didPostSaveRequestSucceed: () => mockEditorState.didSaveSucceed,
		getCurrentPostAttribute: ( attr: string ) =>
			attr === 'status' ? mockEditorState.postStatus : undefined,
		isCollaborationEnabledForCurrentPost: () =>
			mockEditorState.isCollaborationEnabled,
	} );
}

beforeEach( () => {
	mockActiveCollaborators = [];
	mockEditorState = {
		isSaving: false,
		isAutosaving: false,
		didSaveSucceed: true,
		postStatus: 'draft',
		isCollaborationEnabled: true,
	};
	mockCreateNotice.mockClear();
	mockBroadcastSaveEvent.mockClear();
	( applyFilters as jest.Mock ).mockImplementation(
		( _hook: string, defaultValue: unknown ) => defaultValue
	);
	( useSelect as jest.Mock ).mockImplementation( ( selector: Function ) =>
		selector( buildMockSelect() )
	);
	( useDispatch as jest.Mock ).mockReturnValue( {
		createNotice: mockCreateNotice,
	} );
} );

// --- Tests ---

describe( 'useCollaboratorNotifications', () => {
	describe( 'initial mount', () => {
		it( 'does not fire join notifications for collaborators already present on mount', () => {
			mockActiveCollaborators = [ makeMe(), makeCollaborator() ];

			renderHook( () => useCollaboratorNotifications( 123, 'post' ) );

			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );

		it( 'does not fire any notification when no collaborators are present', () => {
			mockActiveCollaborators = [];

			renderHook( () => useCollaboratorNotifications( 123, 'post' ) );

			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );

		it( 'does not fire join notifications when collaborators load after an initially empty state', () => {
			// Simulates the store hydrating: first render has no collaborators,
			// second render receives the full list.
			mockActiveCollaborators = [];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			mockActiveCollaborators = [ makeMe(), makeCollaborator() ];
			rerender();

			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'collaborator join notifications', () => {
		it( 'does not fire a join notification for the current user', () => {
			mockActiveCollaborators = [];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			mockActiveCollaborators = [ makeMe() ];
			rerender();

			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );

		it( 'skips join notification for collaborators who joined before current user', () => {
			// Alice joined BEFORE the current user (smaller enteredAt)
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

			mockActiveCollaborators = [ me ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			// Alice appears in the state — but she was there before us
			mockActiveCollaborators = [ me, aliceJoinedFirst ];
			rerender();

			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );

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

			mockActiveCollaborators = [ me ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			mockActiveCollaborators = [ me, bobJoinedAfter ];
			rerender();

			expect( mockCreateNotice ).toHaveBeenCalledWith(
				'info',
				'Bob has joined the post.',
				expect.objectContaining( {
					id: 'collab-user-entered-200',
				} )
			);
		} );
	} );

	describe( 'collaborator leave notifications', () => {
		it( 'fires a leave notification when a collaborator disconnects (isConnected → false)', () => {
			const alice = makeCollaborator();
			mockActiveCollaborators = [ makeMe(), alice ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			// Alice disconnects — still in the list but greyed out.
			mockActiveCollaborators = [
				makeMe(),
				{ ...alice, isConnected: false },
			];
			rerender();

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

		it( 'does not fire a duplicate leave notification when a disconnected collaborator is removed from the list', () => {
			const alice = makeCollaborator();
			mockActiveCollaborators = [ makeMe(), alice ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			// Alice disconnects (greyed out).
			mockActiveCollaborators = [
				makeMe(),
				{ ...alice, isConnected: false },
			];
			rerender();
			mockCreateNotice.mockClear();

			// After the 5s delay Alice is fully removed from the list.
			mockActiveCollaborators = [ makeMe() ];
			rerender();

			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );

		it( 'fires a leave notification when a connected collaborator is removed from the list directly', () => {
			const alice = makeCollaborator();
			mockActiveCollaborators = [ makeMe(), alice ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			// Alice disappears from the list without going through isConnected=false
			// (e.g. polling detects the disconnect and removes in one update).
			mockActiveCollaborators = [ makeMe() ];
			rerender();

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

		it( 'does not fire a leave notification for the current user', () => {
			const me = makeMe();
			mockActiveCollaborators = [ me, makeCollaborator() ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			// "Me" disconnects
			mockActiveCollaborators = [
				{ ...me, isConnected: false },
				makeCollaborator(),
			];
			rerender();

			// Should not notify about self
			const selfLeaveCall = mockCreateNotice.mock.calls.find(
				( [ , message ] ) => message.includes( 'Me' )
			);
			expect( selfLeaveCall ).toBeUndefined();
		} );
	} );

	describe( 'post updated notifications', () => {
		it( 'fires a post updated notification when a collaborator saves (draft)', () => {
			const alice = makeCollaborator();
			mockActiveCollaborators = [ makeMe(), alice ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			// Alice saves the post (draft status)
			mockActiveCollaborators = [
				makeMe(),
				{
					...alice,
					lastSaveEvent: { savedAt: Date.now(), status: 'draft' },
				},
			];
			rerender();

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
			const alice = makeCollaborator();
			mockActiveCollaborators = [ makeMe(), alice ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			mockActiveCollaborators = [
				makeMe(),
				{
					...alice,
					lastSaveEvent: {
						savedAt: Date.now(),
						status: 'publish',
					},
				},
			];
			rerender();

			expect( mockCreateNotice ).toHaveBeenCalledWith(
				'info',
				'Post updated by Alice.',
				expect.objectContaining( {
					id: 'collab-post-updated-100',
				} )
			);
		} );

		it( 'does not fire a post updated notification on the initial mount even with a saveEvent', () => {
			mockActiveCollaborators = [
				makeMe(),
				{
					...makeCollaborator(),
					lastSaveEvent: { savedAt: Date.now(), status: 'draft' },
				},
			];

			renderHook( () => useCollaboratorNotifications( 123, 'post' ) );

			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );

		it( 'does not fire a post updated notification for a newly appeared collaborator with a historical save event', () => {
			const me = makeMe();
			mockActiveCollaborators = [ me ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			// Alice appears for the first time carrying a save event from
			// before our session — should not trigger a notification.
			mockActiveCollaborators = [
				me,
				{
					...makeCollaborator( {
						collaboratorInfo: {
							id: 100,
							name: 'Alice',
							slug: 'alice',
							avatar_urls: {},
							browserType: 'Chrome',
							enteredAt: BASE_ENTERED_AT + 10000,
						},
					} ),
					lastSaveEvent: { savedAt: Date.now(), status: 'draft' },
				},
			];
			rerender();

			// The join notification fires, but no save notification.
			expect( mockCreateNotice ).toHaveBeenCalledTimes( 1 );
			expect( mockCreateNotice ).toHaveBeenCalledWith(
				'info',
				'Alice has joined the post.',
				expect.objectContaining( {
					id: 'collab-user-entered-100',
				} )
			);
		} );

		it( 'does not fire duplicate notifications for the same savedAt timestamp', () => {
			const savedAt = Date.now();
			const alice = {
				...makeCollaborator(),
				lastSaveEvent: { savedAt, status: 'draft' },
			};

			mockActiveCollaborators = [ makeMe(), alice ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			// Simulate a re-render with the same saveEvent
			mockActiveCollaborators = [ makeMe(), { ...alice } ];
			rerender();

			// The initial mount should record it, not notify.
			// A subsequent rerender with the same savedAt should not notify either.
			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'WordPress filter: editor.collaborationNotifications', () => {
		it( 'suppresses join notifications when userEntered is false', () => {
			( applyFilters as jest.Mock ).mockReturnValue( {
				userEntered: false,
				userExited: true,
				postUpdated: true,
			} );

			mockActiveCollaborators = [ makeMe() ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			mockActiveCollaborators = [
				makeMe(),
				makeCollaborator( {
					collaboratorInfo: {
						id: 100,
						name: 'Alice',
						slug: 'alice',
						avatar_urls: {},
						browserType: 'Chrome',
						enteredAt: BASE_ENTERED_AT + 10000,
					},
				} ),
			];
			rerender();

			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );

		it( 'suppresses leave notifications when userExited is false', () => {
			( applyFilters as jest.Mock ).mockReturnValue( {
				userEntered: true,
				userExited: false,
				postUpdated: true,
			} );

			const alice = makeCollaborator();
			mockActiveCollaborators = [ makeMe(), alice ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			mockActiveCollaborators = [ makeMe() ];
			rerender();

			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );

		it( 'suppresses post updated notifications when postUpdated is false', () => {
			( applyFilters as jest.Mock ).mockReturnValue( {
				userEntered: true,
				userExited: true,
				postUpdated: false,
			} );

			const alice = makeCollaborator();
			mockActiveCollaborators = [ makeMe(), alice ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			mockActiveCollaborators = [
				makeMe(),
				{
					...alice,
					lastSaveEvent: { savedAt: Date.now(), status: 'draft' },
				},
			];
			rerender();

			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'save event broadcasting', () => {
		it( 'broadcasts save event when save transitions from in-progress to complete', () => {
			mockActiveCollaborators = [];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			// Save starts
			mockEditorState = {
				...mockEditorState,
				isSaving: true,
				isAutosaving: false,
			};
			rerender();

			// Save completes
			mockEditorState = {
				...mockEditorState,
				isSaving: false,
				isAutosaving: false,
				didSaveSucceed: true,
				postStatus: 'draft',
			};
			rerender();

			expect( mockBroadcastSaveEvent ).toHaveBeenCalledWith( 'draft' );
		} );

		it( 'does not broadcast save event for autosaves', () => {
			mockActiveCollaborators = [];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			// Autosave starts
			mockEditorState = {
				...mockEditorState,
				isSaving: true,
				isAutosaving: true,
			};
			rerender();

			// Autosave completes
			mockEditorState = {
				...mockEditorState,
				isSaving: false,
				isAutosaving: false,
			};
			rerender();

			expect( mockBroadcastSaveEvent ).not.toHaveBeenCalled();
		} );

		it( 'does not broadcast when collaboration is not enabled', () => {
			mockEditorState = {
				...mockEditorState,
				isCollaborationEnabled: false,
			};
			mockActiveCollaborators = [];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			mockEditorState = {
				...mockEditorState,
				isSaving: true,
				isCollaborationEnabled: false,
			};
			rerender();

			mockEditorState = {
				...mockEditorState,
				isSaving: false,
			};
			rerender();

			expect( mockBroadcastSaveEvent ).not.toHaveBeenCalled();
		} );
	} );
} );
