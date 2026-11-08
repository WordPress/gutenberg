import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useCollaboratorNotifications } from '../use-collaborator-notifications';

type NoticesStore = ( typeof import( '@wordpress/notices' ) )[ 'store' ];
type PreferencesStore =
	( typeof import( '@wordpress/preferences' ) )[ 'store' ];
type EditorStore = ( typeof import( '../../../store' ) )[ 'store' ];
type CoreStore = ( typeof import( '@wordpress/core-data' ) )[ 'store' ];
type Unlock = ( typeof import( '../../../lock-unlock' ) )[ 'unlock' ];

// --- Mocks ---
//
// These mocks isolate the hook from `@wordpress/data`, the editor store, and
// the core-data private APIs it unlocks, so tests can drive the join/leave/
// save callbacks directly instead of simulating real awareness events.

vi.mock( import( '@wordpress/data' ), () => ( {
	useSelect: vi.fn(),
	useDispatch: vi.fn(),
	useRegistry: vi.fn(),
} ) );

vi.mock( import( '@wordpress/notices' ), () => ( {
	store: 'core/notices' as unknown as NoticesStore,
} ) );

vi.mock( import( '@wordpress/preferences' ), () => ( {
	store: 'core/preferences' as unknown as PreferencesStore,
} ) );

// Avoids pulling in the full editor store (blocks, rich-text, etc.).
vi.mock( import( '../../../store' ), () => ( {
	store: 'core/editor' as unknown as EditorStore,
} ) );

vi.mock( import( '@wordpress/core-data' ), () => ( {
	privateApis: {},
	store: 'core' as unknown as CoreStore,
} ) );

// Captures the callbacks and postIds the hook registers with each of the
// three core-data subscriptions it unlocks. Must be prefixed with `mock`
// so Vitest's module factory hoisting allows referencing it below.
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

vi.mock( import( '../../../lock-unlock' ), () => {
	const unlock = vi.fn( ( value: unknown ) => ( {
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
	} ) ) as unknown as Unlock;

	return { unlock };
} );

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
const alice = makeCollaborator( 100, 'Alice', BASE_ENTERED_AT + 1000, {
	clientId: 1000,
} );
const bob = makeCollaborator( 200, 'Bob', BASE_ENTERED_AT + 10000, {
	clientId: 2000,
} );

// --- Setup ---

const mockCreateNotice = vi.fn();

// Stands in for `resolveSelect( coreStore ).getEntityRecord()`. Spied so
// tests can prove a status is only requested when a message names it.
const mockGetEntityRecord = vi.fn(
	async ( kind: string, name: string, key: string ) => {
		if ( kind !== 'root' || name !== 'status' ) {
			return undefined;
		}
		if ( state.postStatuses === undefined ) {
			throw new Error( 'rest_no_route' );
		}
		return state.postStatuses.find( ( record ) => record.slug === key );
	}
);

type PostStatusRecord = { slug: string; name: string };

type PreferenceState = {
	postStatus: string | undefined;
	// Singular label the post type's item labels are built from; undefined
	// mimics a post type that has not resolved yet.
	postTypeLabel: string | undefined;
	// Records the statuses endpoint can resolve; undefined mimics a failed
	// request.
	postStatuses: PostStatusRecord[] | undefined;
	isCollaborationEnabled: boolean;
	showCollaborationJoinNotifications: boolean;
	showCollaborationLeaveNotifications: boolean;
	showCollaborationPostSaveNotifications: boolean;
};

// Statuses the REST API can resolve: a plugin-registered one, plus a core
// status whose REST label differs from the editor's own, to prove core
// statuses never reach the lookup.
const REGISTERED_STATUSES: PostStatusRecord[] = [
	{ slug: 'pending', name: 'Pending review (from REST)' },
	{ slug: 'embargo', name: 'Embargoed' },
];

/**
 * Builds the item labels WordPress registers for a post type, as the
 * `/wp/v2/types` endpoint returns them.
 *
 * @param singular Singular name, e.g. "Post".
 */
function makeLabels( singular: string ) {
	return {
		singular_name: singular,
		item_published: `${ singular } published.`,
		item_published_privately: `${ singular } published privately.`,
		item_reverted_to_draft: `${ singular } reverted to draft.`,
		item_scheduled: `${ singular } scheduled.`,
		item_updated: `${ singular } updated.`,
	};
}

const DEFAULT_STATE: PreferenceState = {
	postStatus: 'draft',
	postTypeLabel: 'Post',
	postStatuses: REGISTERED_STATUSES,
	isCollaborationEnabled: true,
	showCollaborationJoinNotifications: true,
	showCollaborationLeaveNotifications: true,
	showCollaborationPostSaveNotifications: true,
};

let state: PreferenceState = { ...DEFAULT_STATE };

function mockSelect( storeKey: string ) {
	if ( storeKey === 'core' ) {
		return {
			getPostType: ( slug: string ) =>
				state.postTypeLabel === undefined
					? undefined
					: { slug, labels: makeLabels( state.postTypeLabel ) },
		};
	}
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
	mockGetEntityRecord.mockClear();
	( useSelect as Mock ).mockImplementation( ( selector: Function ) =>
		selector( mockSelect )
	);
	( useRegistry as Mock ).mockReturnValue( {
		resolveSelect: () => ( { getEntityRecord: mockGetEntityRecord } ),
	} );
	( useDispatch as Mock ).mockReturnValue( {
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

		it( 'uses the session ID for a fallback collaborator notification', () => {
			const fallbackCollaborator = {
				...bob,
				clientId: 321,
				collaboratorInfo: {
					...bob.collaboratorInfo,
					id: null,
					name: 'Anonymous User',
				},
			};
			renderNotifications();

			mockRegistered.join?.( fallbackCollaborator, me );

			expect( mockCreateNotice ).toHaveBeenCalledWith(
				'info',
				'Anonymous User has joined the post.',
				expect.objectContaining( {
					id: 'collab-user-entered-321',
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
				expected: 'Post updated. By Alice.',
			},
			{
				description:
					'a post is first published (no previous save event)',
				postStatus: 'draft',
				saveEventStatus: 'publish',
				prevEvent: null,
				expected: 'Post published. By Alice.',
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
				expected: 'Post published. By Alice.',
			},
			{
				description: 'a draft is scheduled',
				postStatus: 'draft',
				saveEventStatus: 'future',
				prevEvent: null,
				expected: 'Post scheduled. By Alice.',
			},
			{
				description: 'a draft is published privately',
				postStatus: 'draft',
				saveEventStatus: 'private',
				prevEvent: null,
				expected: 'Post published privately. By Alice.',
			},
			{
				description: 'a scheduled post is updated',
				postStatus: 'future',
				saveEventStatus: 'future',
				prevEvent: null,
				expected: 'Post updated. By Alice.',
			},
			{
				description: 'a published post is reverted to draft',
				postStatus: 'publish',
				saveEventStatus: 'draft',
				prevEvent: null,
				expected: 'Post reverted to draft. By Alice.',
			},
			{
				description: 'a draft is submitted for review',
				postStatus: 'draft',
				saveEventStatus: 'pending',
				prevEvent: null,
				expected: 'Status set to Pending by Alice.',
			},
			{
				description: 'a pending post is saved again',
				postStatus: 'pending',
				saveEventStatus: 'pending',
				prevEvent: null,
				expected: 'Saved by Alice.',
			},
			{
				description: 'a draft is moved to a custom status',
				postStatus: 'draft',
				saveEventStatus: 'embargo',
				prevEvent: null,
				expected: 'Status set to Embargoed by Alice.',
			},
			{
				description: 'a published post is moved to a custom status',
				postStatus: 'publish',
				saveEventStatus: 'embargo',
				prevEvent: null,
				expected: 'Status set to Embargoed by Alice.',
			},
			{
				description: 'a post in a custom status is saved again',
				postStatus: 'embargo',
				saveEventStatus: 'embargo',
				prevEvent: null,
				expected: 'Saved by Alice.',
			},
			{
				description: 'a post in a custom status is moved back to draft',
				postStatus: 'embargo',
				saveEventStatus: 'draft',
				prevEvent: null,
				expected: 'Status set to Draft by Alice.',
			},
			{
				description: 'a pending post is moved back to draft',
				postStatus: 'pending',
				saveEventStatus: 'draft',
				prevEvent: null,
				expected: 'Status set to Draft by Alice.',
			},
		] )(
			'fires "$expected" when $description',
			async ( { postStatus, saveEventStatus, prevEvent, expected } ) => {
				renderNotifications( { postStatus } );

				await mockRegistered.save?.(
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

		it.each( [
			{
				description: 'publishing',
				postStatus: 'draft',
				saveEventStatus: 'publish',
				expected: 'Story published. By Alice.',
			},
			{
				description: 'scheduling',
				postStatus: 'draft',
				saveEventStatus: 'future',
				expected: 'Story scheduled. By Alice.',
			},
			{
				description: 'updating',
				postStatus: 'publish',
				saveEventStatus: 'publish',
				expected: 'Story updated. By Alice.',
			},
		] )(
			'uses the registered post type label when $description',
			async ( { postStatus, saveEventStatus, expected } ) => {
				renderNotifications( { postStatus, postTypeLabel: 'Story' } );

				await mockRegistered.save?.(
					{
						savedAt: Date.now(),
						savedByClientId: alice.clientId,
						postStatus: saveEventStatus,
					},
					alice,
					null
				);

				expect( mockCreateNotice ).toHaveBeenCalledWith(
					'info',
					expected,
					expect.anything()
				);
			}
		);

		it( 'only requests a status the editor does not know', async () => {
			renderNotifications( { postStatus: 'draft' } );

			// Core transitions have their own wording and need no label.
			await mockRegistered.save?.(
				{
					savedAt: Date.now(),
					savedByClientId: alice.clientId,
					postStatus: 'publish',
				},
				alice,
				null
			);
			expect( mockGetEntityRecord ).not.toHaveBeenCalled();

			// A core status the message names uses the editor's own label.
			await mockRegistered.save?.(
				{
					savedAt: Date.now(),
					savedByClientId: alice.clientId,
					postStatus: 'pending',
				},
				alice,
				null
			);
			expect( mockGetEntityRecord ).not.toHaveBeenCalled();
			expect( mockCreateNotice ).toHaveBeenLastCalledWith(
				'info',
				'Status set to Pending by Alice.',
				expect.anything()
			);

			// A move to another status resolves just that status.
			await mockRegistered.save?.(
				{
					savedAt: Date.now(),
					savedByClientId: alice.clientId,
					postStatus: 'embargo',
				},
				alice,
				null
			);
			expect( mockGetEntityRecord ).toHaveBeenCalledTimes( 1 );
			expect( mockGetEntityRecord ).toHaveBeenCalledWith(
				'root',
				'status',
				'embargo'
			);
		} );

		it( 'names the status when the post type has not resolved', async () => {
			renderNotifications( {
				postStatus: 'draft',
				postTypeLabel: undefined,
			} );

			await mockRegistered.save?.(
				{
					savedAt: Date.now(),
					savedByClientId: alice.clientId,
					postStatus: 'publish',
				},
				alice,
				null
			);

			// Without the post type's "Post published." label, the registered
			// status label still says what happened.
			expect( mockCreateNotice ).toHaveBeenCalledWith(
				'info',
				'Status set to Published by Alice.',
				expect.anything()
			);
		} );

		describe( 'while a status lookup is still in flight', () => {
			// Hands control of the pending lookup to the test. The save that
			// triggers it returns a promise the test settles later.
			function startPendingEmbargoSave() {
				let resolveLookup: (
					record: PostStatusRecord
				) => void = () => {};
				mockGetEntityRecord.mockImplementationOnce(
					() =>
						new Promise< PostStatusRecord >( ( resolve ) => {
							resolveLookup = resolve;
						} )
				);
				const pendingSave = mockRegistered.save?.(
					{
						savedAt: Date.now(),
						savedByClientId: alice.clientId,
						postStatus: 'embargo',
					},
					alice,
					null
				);
				return {
					pendingSave,
					finishLookup: () =>
						resolveLookup( { slug: 'embargo', name: 'Embargoed' } ),
				};
			}

			it( 'drops the older notice when a newer save already posted', async () => {
				renderNotifications( { postStatus: 'draft' } );
				const { pendingSave, finishLookup } = startPendingEmbargoSave();

				// A publish needs no lookup, so its notice posts right away.
				await mockRegistered.save?.(
					{
						savedAt: Date.now(),
						savedByClientId: alice.clientId,
						postStatus: 'publish',
					},
					alice,
					{ savedAt: 0, savedByClientId: 1, postStatus: 'embargo' }
				);
				expect( mockCreateNotice ).toHaveBeenCalledTimes( 1 );
				expect( mockCreateNotice ).toHaveBeenCalledWith(
					'info',
					'Post published. By Alice.',
					expect.anything()
				);

				// The older lookup finishing must not replace the newer notice.
				finishLookup();
				await pendingSave;
				expect( mockCreateNotice ).toHaveBeenCalledTimes( 1 );
			} );

			it( 'drops the notice when the preference was turned off', async () => {
				const { rerender } = renderNotifications( {
					postStatus: 'draft',
				} );
				const { pendingSave, finishLookup } = startPendingEmbargoSave();

				state = {
					...state,
					showCollaborationPostSaveNotifications: false,
				};
				rerender();

				finishLookup();
				await pendingSave;
				expect( mockCreateNotice ).not.toHaveBeenCalled();
			} );

			it( 'drops the notice when the component unmounted', async () => {
				const { unmount } = renderNotifications( {
					postStatus: 'draft',
				} );
				const { pendingSave, finishLookup } = startPendingEmbargoSave();

				unmount();

				finishLookup();
				await pendingSave;
				expect( mockCreateNotice ).not.toHaveBeenCalled();
			} );
		} );

		it( 'reports a plain save when the status cannot be resolved', async () => {
			renderNotifications( {
				postStatus: 'draft',
				postStatuses: undefined,
			} );

			await mockRegistered.save?.(
				{
					savedAt: Date.now(),
					savedByClientId: alice.clientId,
					postStatus: 'embargo',
				},
				alice,
				null
			);

			expect( mockCreateNotice ).toHaveBeenCalledWith(
				'info',
				'Saved by Alice.',
				expect.anything()
			);
		} );

		it( 'does not fire when postStatus is unknown', async () => {
			renderNotifications( { postStatus: undefined } );

			await mockRegistered.save?.(
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

		it( 'does not fire when post-save notifications are disabled', async () => {
			renderNotifications( {
				showCollaborationPostSaveNotifications: false,
			} );

			expect( mockRegistered.savePostId ).toBeNull();

			// The other two hooks stay wired to the real post id.
			expect( mockRegistered.joinPostId ).toBe( 123 );
			expect( mockRegistered.leavePostId ).toBe( 123 );

			await mockRegistered.save?.(
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
