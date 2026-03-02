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
let mockActiveCollaborators: any[] = [];
let mockLastPostSave: { savedAt: number; savedByClientId: number } | null =
	null;
let mockEditorState = {
	postStatus: 'draft',
	isCollaborationEnabled: true,
};

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
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
		useLastPostSave: jest.fn( () => mockLastPostSave ),
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
		getCurrentPostAttribute: ( attr: string ) =>
			attr === 'status' ? mockEditorState.postStatus : undefined,
		isCollaborationEnabledForCurrentPost: () =>
			mockEditorState.isCollaborationEnabled,
	} );
}

beforeEach( () => {
	mockActiveCollaborators = [];
	mockLastPostSave = null;
	mockEditorState = {
		postStatus: 'draft',
		isCollaborationEnabled: true,
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

			// State map reports Alice saved
			mockLastPostSave = {
				savedAt: Date.now(),
				savedByClientId: alice.clientId,
			};
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
			mockEditorState = {
				...mockEditorState,
				postStatus: 'publish',
			};
			const alice = makeCollaborator();
			mockActiveCollaborators = [ makeMe(), alice ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			mockLastPostSave = {
				savedAt: Date.now(),
				savedByClientId: alice.clientId,
			};
			rerender();

			expect( mockCreateNotice ).toHaveBeenCalledWith(
				'info',
				'Post updated by Alice.',
				expect.objectContaining( {
					id: 'collab-post-updated-100',
				} )
			);
		} );

		it( 'does not fire a notification when the current user saves', () => {
			const me = makeMe();
			mockActiveCollaborators = [ me, makeCollaborator() ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			// State map reports "me" saved
			mockLastPostSave = {
				savedAt: Date.now(),
				savedByClientId: me.clientId,
			};
			rerender();

			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );

		it( 'does not fire duplicate notifications for the same savedAt timestamp', () => {
			const alice = makeCollaborator();
			mockActiveCollaborators = [ makeMe(), alice ];
			const savedAt = Date.now();

			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			// First save event
			mockLastPostSave = {
				savedAt,
				savedByClientId: alice.clientId,
			};
			rerender();
			mockCreateNotice.mockClear();

			// Rerender with same savedAt — should not notify again
			rerender();

			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );

		it( 'does not fire a notification when a peer reconnects without a new save', () => {
			const alice = makeCollaborator();
			mockActiveCollaborators = [ makeMe(), alice ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			// Alice disconnects and reconnects — useLastPostSave filters
			// pre-existing state map values via its baseline check, so
			// lastPostSave stays null.
			mockActiveCollaborators = [
				makeMe(),
				{ ...alice, isConnected: false },
			];
			rerender();
			mockCreateNotice.mockClear();

			mockActiveCollaborators = [
				makeMe(),
				{ ...alice, clientId: 50, isConnected: true },
			];
			rerender();

			// Only the leave/join notices should have fired, no save notice.
			const saveNotice = mockCreateNotice.mock.calls.find(
				( [ , msg ] ) => ( msg as string ).includes( 'saved' )
			);
			expect( saveNotice ).toBeUndefined();
		} );

		it( 'does not fire a notification when the saver is not in the collaborator list', () => {
			mockActiveCollaborators = [ makeMe(), makeCollaborator() ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);

			// State map reports a save by unknown clientId
			mockLastPostSave = {
				savedAt: Date.now(),
				savedByClientId: 12345,
			};
			rerender();

			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );
	} );
} );
