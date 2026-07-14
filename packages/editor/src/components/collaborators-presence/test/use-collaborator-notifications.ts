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
//
// These mocks isolate the hook from `@wordpress/data`, the editor store, and
// the core-data private APIs it unlocks, so tests can drive the join/leave/
// save callbacks directly instead of simulating real awareness events.

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
} ) );

jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );

jest.mock( '@wordpress/preferences', () => ( { store: 'core/preferences' } ) );

// Avoids pulling in the full editor store (blocks, rich-text, etc.).
jest.mock( '../../../store', () => ( { store: 'core/editor' } ) );

jest.mock( '@wordpress/core-data', () => ( { privateApis: {} } ) );

// Captures the callbacks and postIds the hook registers with each of the
// three core-data subscriptions it unlocks. Must be prefixed with `mock`
// so jest's module factory hoisting allows referencing it below.
const mockRegistered: {
	join: Function | null;
	leave: Function | null;
	save: Function | null;
	joinPostId: unknown;
	leavePostId: unknown;
	savePostId: unknown;
} = {
	join: null,
	leave: null,
	save: null,
	joinPostId: undefined,
	leavePostId: undefined,
	savePostId: undefined,
};

jest.mock( '../../../lock-unlock', () => ( {
	unlock: jest.fn( ( value: unknown ) => ( {
		...( value as object ),
		useOnCollaboratorJoin: (
			postId: unknown,
			_t: unknown,
			cb: Function
		) => {
			mockRegistered.joinPostId = postId;
			mockRegistered.join = cb;
		},
		useOnCollaboratorLeave: (
			postId: unknown,
			_t: unknown,
			cb: Function
		) => {
			mockRegistered.leavePostId = postId;
			mockRegistered.leave = cb;
		},
		useOnPostSave: ( postId: unknown, _t: unknown, cb: Function ) => {
			mockRegistered.savePostId = postId;
			mockRegistered.save = cb;
		},
	} ) ),
} ) );

// --- Fixtures ---

const BASE_ENTERED_AT = 1704067200000;

function makeCollaborator(
	id: number,
	name: string,
	enteredAt: number,
	overrides: Record< string, unknown > = {}
) {
	return {
		clientId: id,
		isMe: false,
		isConnected: true,
		collaboratorInfo: {
			id,
			name,
			slug: name.toLowerCase(),
			avatar_urls: {},
			browserType: 'Chrome',
			enteredAt,
		},
		...overrides,
	};
}

// "me" is the current user; Alice entered before "me", Bob after.
const me = makeCollaborator( 1, 'Me', BASE_ENTERED_AT + 5000, {
	isMe: true,
} );
const alice = makeCollaborator( 100, 'Alice', BASE_ENTERED_AT + 1000 );
const bob = makeCollaborator( 200, 'Bob', BASE_ENTERED_AT + 10000 );

// --- Setup ---

const mockCreateNotice = jest.fn();

type PreferenceState = {
	postStatus: string | undefined;
	isCollaborationEnabled: boolean;
	showCollaborationJoinNotifications: boolean;
	showCollaborationLeaveNotifications: boolean;
	showCollaborationPostSaveNotifications: boolean;
};

const DEFAULT_STATE: PreferenceState = {
	postStatus: 'draft',
	isCollaborationEnabled: true,
	showCollaborationJoinNotifications: true,
	showCollaborationLeaveNotifications: true,
	showCollaborationPostSaveNotifications: true,
};

let state: PreferenceState = { ...DEFAULT_STATE };

function mockSelect( storeKey: string ) {
	if ( storeKey === 'core/preferences' ) {
		return {
			get: ( scope: string, name: string ) =>
				scope === 'core' && name in state
					? ( state as unknown as Record< string, boolean > )[ name ]
					: undefined,
		};
	}
	return {
		getCurrentPostAttribute: ( attr: string ) =>
			attr === 'status' ? state.postStatus : undefined,
		isCollaborationEnabledForCurrentPost: () =>
			state.isCollaborationEnabled,
	};
}

/**
 * Renders the hook under test with the given preference/state overrides
 * applied on top of the defaults (everything enabled, status: 'draft').
 *
 * @param overrides Partial preference/state overrides.
 */
function renderNotifications( overrides: Partial< PreferenceState > = {} ) {
	state = { ...DEFAULT_STATE, ...overrides };
	return renderHook( () => useCollaboratorNotifications( 123, 'post' ) );
}

beforeEach( () => {
	mockRegistered.join = null;
	mockRegistered.leave = null;
	mockRegistered.save = null;
	mockRegistered.joinPostId = undefined;
	mockRegistered.leavePostId = undefined;
	mockRegistered.savePostId = undefined;
	mockCreateNotice.mockClear();
	( useSelect as jest.Mock ).mockImplementation( ( selector: Function ) =>
		selector( mockSelect )
	);
	( useDispatch as jest.Mock ).mockReturnValue( {
		createNotice: mockCreateNotice,
	} );
} );

// --- Tests ---

describe( 'useCollaboratorNotifications', () => {
	describe( 'collaborator join notifications', () => {
		it( 'fires when the collaborator entered after the current user', () => {
			renderNotifications();

			mockRegistered.join?.( bob, me );

			expect( mockCreateNotice ).toHaveBeenCalledWith(
				'info',
				'Bob has joined the post.',
				expect.objectContaining( {
					id: 'collab-user-entered-200',
					type: 'snackbar',
					isDismissible: false,
				} )
			);
		} );

		it( 'is skipped when the collaborator entered before the current user', () => {
			renderNotifications();

			mockRegistered.join?.( alice, me );

			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );

		it( 'does not fire when join notifications are disabled', () => {
			renderNotifications( {
				showCollaborationJoinNotifications: false,
			} );

			// The hook unsubscribes by passing a null postId...
			expect( mockRegistered.joinPostId ).toBeNull();

			// ...while the other two hooks stay wired to the real post id,
			// proving this preference doesn't accidentally couple with them.
			expect( mockRegistered.leavePostId ).toBe( 123 );
			expect( mockRegistered.savePostId ).toBe( 123 );

			// ...and the callback itself guards against any queued event.
			mockRegistered.join?.( bob, me );
			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );

		it( 'stops firing once join notifications are toggled off mid-session', () => {
			const { rerender } = renderNotifications();

			state = {
				...state,
				showCollaborationJoinNotifications: false,
			};
			rerender();

			mockRegistered.join?.( bob, me );

			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'collaborator leave notifications', () => {
		it( 'fires when a collaborator leaves', () => {
			renderNotifications();

			mockRegistered.leave?.( alice );

			expect( mockCreateNotice ).toHaveBeenCalledWith(
				'info',
				'Alice has left the post.',
				expect.objectContaining( {
					id: 'collab-user-exited-100',
					type: 'snackbar',
					isDismissible: false,
				} )
			);
		} );

		it( 'does not fire when leave notifications are disabled', () => {
			renderNotifications( {
				showCollaborationLeaveNotifications: false,
			} );

			expect( mockRegistered.leavePostId ).toBeNull();

			// The other two hooks stay wired to the real post id.
			expect( mockRegistered.joinPostId ).toBe( 123 );
			expect( mockRegistered.savePostId ).toBe( 123 );

			mockRegistered.leave?.( alice );
			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );

		it( 'stops firing once leave notifications are toggled off mid-session', () => {
			const { rerender } = renderNotifications();

			state = {
				...state,
				showCollaborationLeaveNotifications: false,
			};
			rerender();

			mockRegistered.leave?.( alice );

			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'post save notifications', () => {
		it.each( [
			{
				description: 'a draft is saved',
				postStatus: 'draft',
				saveEventStatus: undefined,
				prevEvent: null,
				expected: 'Draft saved by Alice.',
			},
			{
				description: 'an already-published post is updated',
				postStatus: 'publish',
				saveEventStatus: 'publish',
				prevEvent: null,
				expected: 'Post updated by Alice.',
			},
			{
				description:
					'a post is first published (no previous save event)',
				postStatus: 'draft',
				saveEventStatus: 'publish',
				prevEvent: null,
				expected: 'Post published by Alice.',
			},
			{
				description:
					'a post is first published (prevEvent carries the prior draft status)',
				postStatus: 'publish',
				saveEventStatus: 'publish',
				prevEvent: {
					savedAt: 0,
					savedByClientId: 1,
					postStatus: 'draft',
				},
				expected: 'Post published by Alice.',
			},
		] )(
			'fires "$expected" when $description',
			( { postStatus, saveEventStatus, prevEvent, expected } ) => {
				renderNotifications( { postStatus } );

				mockRegistered.save?.(
					{
						savedAt: Date.now(),
						savedByClientId: alice.clientId,
						postStatus: saveEventStatus,
					},
					alice,
					prevEvent
				);

				expect( mockCreateNotice ).toHaveBeenCalledWith(
					'info',
					expected,
					expect.objectContaining( {
						id: 'collab-post-updated-100',
						type: 'snackbar',
						isDismissible: false,
					} )
				);
			}
		);

		it( 'does not fire when postStatus is unknown', () => {
			renderNotifications( { postStatus: undefined } );

			mockRegistered.save?.(
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

		it( 'does not fire when post-save notifications are disabled', () => {
			renderNotifications( {
				showCollaborationPostSaveNotifications: false,
			} );

			expect( mockRegistered.savePostId ).toBeNull();

			// The other two hooks stay wired to the real post id.
			expect( mockRegistered.joinPostId ).toBe( 123 );
			expect( mockRegistered.leavePostId ).toBe( 123 );

			mockRegistered.save?.(
				{
					savedAt: Date.now(),
					savedByClientId: alice.clientId,
					postStatus: 'publish',
				},
				alice,
				null
			);
			expect( mockCreateNotice ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'when collaboration is disabled entirely', () => {
		it( 'unsubscribes all three hooks', () => {
			renderNotifications( { isCollaborationEnabled: false } );

			expect( mockRegistered.joinPostId ).toBeNull();
			expect( mockRegistered.leavePostId ).toBeNull();
			expect( mockRegistered.savePostId ).toBeNull();
		} );
	} );
} );
