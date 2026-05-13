/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	DISTRIBUTED_EDITING_DISPOSITIONS,
	DISTRIBUTED_EDITING_NOTICE_ACTIONS,
	DISTRIBUTED_EDITING_NOTICE_IDS,
	DISTRIBUTED_EDITING_NOTICE_KINDS,
	DISTRIBUTED_EDITING_REASON_CODES,
	DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS,
	DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE,
	getDistributedEditingNoticeDescriptorsForSessionState,
	getDistributedEditingUnloadWarningStateForSessionState,
	isDistributedEditingConflictDisposition,
	isValidDistributedEditingDisposition,
	isValidDistributedEditingReasonCode,
	normalizeDistributedEditingSessionState,
	shouldWarnBeforeLeavingDistributedEditingSessionState,
} from '../distributed-editing';
import {
	resetDistributedEditingSessionState,
	setDistributedEditingSessionState,
	updateDistributedEditingSessionState,
} from '../actions';
import { distributedEditingSession } from '../reducer';
import {
	canExportDistributedEditingLocalUpdates,
	getDistributedEditingNoticeDescriptors,
	getDistributedEditingSessionDisposition,
	getDistributedEditingSessionReasonCode,
	getDistributedEditingSessionState,
	getDistributedEditingUnloadWarningState,
	hasPendingDistributedEditingChanges,
	hasRemoteDistributedEditingChanges,
	isAwaitingDistributedEditingServerConfirmation,
	isDistributedEditingConnectionDegraded,
	mustOfferDistributedEditingLocalCopy,
	requiresDistributedEditingServerStateAcceptance,
	shouldWarnBeforeLeavingDistributedEditingSession,
} from '../selectors';

describe( 'distributed editing session state', () => {
	it( 'validates the shared reason-code and disposition vocabulary', () => {
		expect(
			isValidDistributedEditingReasonCode(
				DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_RESTORED_FROM_REVISION_CONFLICT
			)
		).toBe( true );
		expect( isValidDistributedEditingReasonCode( 'unknown_reason' ) ).toBe(
			false
		);
		expect(
			isValidDistributedEditingDisposition(
				DISTRIBUTED_EDITING_DISPOSITIONS.CONFLICT_REQUIRES_SERVER_STATE_ACCEPTANCE
			)
		).toBe( true );
		expect(
			isValidDistributedEditingDisposition( 'unknown_disposition' )
		).toBe( false );
		expect(
			isDistributedEditingConflictDisposition(
				DISTRIBUTED_EDITING_DISPOSITIONS.CONFLICT_REQUIRES_SERVER_STATE_ACCEPTANCE
			)
		).toBe( true );
		expect(
			isDistributedEditingConflictDisposition(
				DISTRIBUTED_EDITING_DISPOSITIONS.ACCEPTED_WITH_DEGRADED_LIVE_FEEDBACK
			)
		).toBe( false );
	} );

	it( 'normalizes pending state from runner-compatible conflict terms', () => {
		const normalized = normalizeDistributedEditingSessionState( {
			clientBaseVersion: 'server-v4',
			serverVersion: 'server-v6',
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.CONFLICT_REQUIRES_SERVER_STATE_ACCEPTANCE,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_RESTORED_FROM_REVISION_CONFLICT,
			pendingChangeCount: 2,
			remoteChangeCount: 1,
		} );

		expect( normalized ).toEqual( {
			clientBaseVersion: 'server-v4',
			serverVersion: 'server-v6',
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.CONFLICT_REQUIRES_SERVER_STATE_ACCEPTANCE,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_RESTORED_FROM_REVISION_CONFLICT,
			pendingChangeCount: 2,
			hasPendingChanges: true,
			isAwaitingServerConfirmation: true,
			isConnectionDegraded: false,
			remoteChangeCount: 1,
			hasRemoteChanges: true,
			requiresServerStateAcceptance: true,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
		} );
	} );

	it( 'treats degraded live feedback as connection degradation only', () => {
		const normalized = normalizeDistributedEditingSessionState( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.ACCEPTED_WITH_DEGRADED_LIVE_FEEDBACK,
		} );

		expect( normalized.isConnectionDegraded ).toBe( true );
		expect( normalized.hasPendingChanges ).toBe( false );
		expect(
			shouldWarnBeforeLeavingDistributedEditingSessionState( normalized )
		).toBe( false );
	} );

	it( 'drops unknown reason codes and dispositions', () => {
		const normalized = normalizeDistributedEditingSessionState( {
			disposition: 'not_a_disposition',
			reasonCode: 'not_a_reason',
			pendingChangeCount: -1,
			remoteChangeCount: '2.5',
			clientBaseVersion: 4,
			serverVersion: '',
		} );

		expect( normalized ).toEqual(
			DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE
		);
	} );

	it( 'is immutable-friendly for reducer or selector consumers', () => {
		const normalized = normalizeDistributedEditingSessionState(
			deepFreeze( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REQUIRES_MANUAL_RESOLUTION_NO_SYNC_META,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_UNAVAILABLE_AFTER_REVISION_SCAN,
				hasPendingChanges: true,
			} )
		);

		expect( normalized ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REQUIRES_MANUAL_RESOLUTION_NO_SYNC_META,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_UNAVAILABLE_AFTER_REVISION_SCAN,
			hasPendingChanges: true,
			isAwaitingServerConfirmation: true,
		} );
		expect(
			shouldWarnBeforeLeavingDistributedEditingSessionState( normalized )
		).toBe( true );
	} );

	it( 'builds blocking notice descriptors for server-state acceptance', () => {
		const notices = getDistributedEditingNoticeDescriptorsForSessionState( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.CONFLICT_REQUIRES_SERVER_STATE_ACCEPTANCE,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_RESTORED_FROM_REVISION_CONFLICT,
			pendingChangeCount: 2,
			remoteChangeCount: 1,
		} );

		expect( notices ).toEqual( [
			{
				id: DISTRIBUTED_EDITING_NOTICE_IDS.SERVER_STATE_ACCEPTANCE_REQUIRED,
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.SERVER_STATE_ACCEPTANCE_REQUIRED,
				status: 'warning',
				priority: 'blocking',
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_RESTORED_FROM_REVISION_CONFLICT,
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.CONFLICT_REQUIRES_SERVER_STATE_ACCEPTANCE,
				pendingChangeCount: 2,
				remoteChangeCount: 1,
				actionKeys: [
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.ACCEPT_SERVER_STATE,
				],
				noticeOptions: {
					id: DISTRIBUTED_EDITING_NOTICE_IDS.SERVER_STATE_ACCEPTANCE_REQUIRED,
					type: 'default',
					isDismissible: false,
				},
			},
			{
				id: DISTRIBUTED_EDITING_NOTICE_IDS.REMOTE_CHANGES_RECEIVED,
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.REMOTE_CHANGES_RECEIVED,
				status: 'info',
				priority: 'snackbar',
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_RESTORED_FROM_REVISION_CONFLICT,
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.CONFLICT_REQUIRES_SERVER_STATE_ACCEPTANCE,
				pendingChangeCount: 2,
				remoteChangeCount: 1,
				actionKeys: [
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.REVIEW_REMOTE_CHANGES,
				],
				noticeOptions: {
					id: DISTRIBUTED_EDITING_NOTICE_IDS.REMOTE_CHANGES_RECEIVED,
					type: 'snackbar',
					isDismissible: true,
				},
			},
		] );
	} );

	it( 'builds manual-resolution and status notice descriptors', () => {
		const notices = getDistributedEditingNoticeDescriptorsForSessionState( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REQUIRES_MANUAL_RESOLUTION_NO_SYNC_META,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_UNAVAILABLE_AFTER_REVISION_SCAN,
			canExportLocalUpdates: true,
			isConnectionDegraded: true,
			hasPendingChanges: true,
		} );

		expect( notices.map( ( notice ) => notice.kind ) ).toEqual( [
			DISTRIBUTED_EDITING_NOTICE_KINDS.MANUAL_RESOLUTION_REQUIRED,
			DISTRIBUTED_EDITING_NOTICE_KINDS.CONNECTION_DEGRADED,
			DISTRIBUTED_EDITING_NOTICE_KINDS.PENDING_CHANGES,
		] );
		expect( notices[ 0 ] ).toMatchObject( {
			status: 'error',
			priority: 'blocking',
			actionKeys: [
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
			],
		} );
		expect( notices[ 1 ] ).toMatchObject( {
			status: 'warning',
			priority: 'status',
		} );
		expect( notices[ 2 ] ).toMatchObject( {
			status: 'info',
			priority: 'status',
		} );
	} );

	it( 'builds unload-warning integration state without rendered copy', () => {
		const warningState =
			getDistributedEditingUnloadWarningStateForSessionState( {
				pendingChangeCount: 1,
				canExportLocalUpdates: true,
			} );

		expect( warningState ).toEqual( {
			shouldWarn: true,
			reason: DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS.PENDING_CHANGES,
			reasonCode: null,
			disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
			pendingChangeCount: 1,
			isAwaitingServerConfirmation: true,
			canExportLocalUpdates: true,
			mustOfferLocalCopy: false,
		} );
		expect(
			getDistributedEditingUnloadWarningStateForSessionState( {
				isConnectionDegraded: true,
			} )
		).toMatchObject( {
			shouldWarn: false,
			reason: null,
		} );
	} );
} );

describe( 'distributed editing store actions', () => {
	it( 'creates a replacement session action', () => {
		const sessionState = {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.ACCEPTED_WITH_DEGRADED_LIVE_FEEDBACK,
		};

		expect( setDistributedEditingSessionState( sessionState ) ).toEqual( {
			type: 'SET_DISTRIBUTED_EDITING_SESSION_STATE',
			sessionState,
		} );
	} );

	it( 'creates an update session action', () => {
		const sessionState = {
			pendingChangeCount: 1,
		};

		expect( updateDistributedEditingSessionState( sessionState ) ).toEqual(
			{
				type: 'UPDATE_DISTRIBUTED_EDITING_SESSION_STATE',
				sessionState,
			}
		);
	} );

	it( 'creates a reset session action', () => {
		expect( resetDistributedEditingSessionState() ).toEqual( {
			type: 'RESET_DISTRIBUTED_EDITING_SESSION_STATE',
		} );
	} );
} );

describe( 'distributed editing reducer', () => {
	it( 'defaults to the normalized idle session state', () => {
		expect( distributedEditingSession( undefined, {} ) ).toBe(
			DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE
		);
	} );

	it( 'replaces session state through the shared vocabulary normalizer', () => {
		const state = distributedEditingSession(
			undefined,
			setDistributedEditingSessionState( {
				clientBaseVersion: 'server-v4',
				serverVersion: 'server-v6',
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.CONFLICT_REQUIRES_SERVER_STATE_ACCEPTANCE,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_RESTORED_FROM_REVISION_CONFLICT,
				pendingChangeCount: 2,
				remoteChangeCount: 1,
			} )
		);

		expect( state ).toMatchObject( {
			clientBaseVersion: 'server-v4',
			serverVersion: 'server-v6',
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.CONFLICT_REQUIRES_SERVER_STATE_ACCEPTANCE,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_RESTORED_FROM_REVISION_CONFLICT,
			pendingChangeCount: 2,
			hasPendingChanges: true,
			isAwaitingServerConfirmation: true,
			remoteChangeCount: 1,
			hasRemoteChanges: true,
			requiresServerStateAcceptance: true,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
		} );
	} );

	it( 'updates session state without losing existing normalized flags', () => {
		const original = deepFreeze(
			distributedEditingSession(
				undefined,
				setDistributedEditingSessionState( {
					pendingChangeCount: 1,
				} )
			)
		);
		const state = distributedEditingSession(
			original,
			updateDistributedEditingSessionState( {
				isConnectionDegraded: true,
			} )
		);

		expect( state ).toMatchObject( {
			pendingChangeCount: 1,
			hasPendingChanges: true,
			isAwaitingServerConfirmation: true,
			isConnectionDegraded: true,
		} );
	} );

	it( 'resets session state explicitly and when a new post is edited', () => {
		const conflictState = deepFreeze(
			distributedEditingSession(
				undefined,
				setDistributedEditingSessionState( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REQUIRES_MANUAL_RESOLUTION_NO_SYNC_META,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_UNAVAILABLE_AFTER_REVISION_SCAN,
					hasPendingChanges: true,
				} )
			)
		);

		expect(
			distributedEditingSession(
				conflictState,
				resetDistributedEditingSessionState()
			)
		).toBe( DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE );
		expect(
			distributedEditingSession( conflictState, {
				type: 'SET_EDITED_POST',
				postType: 'post',
				postId: 1,
			} )
		).toBe( DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE );
	} );
} );

describe( 'distributed editing selectors', () => {
	it( 'returns default session state when the store slice is unavailable', () => {
		expect( getDistributedEditingSessionState( {} ) ).toBe(
			DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE
		);
		expect( hasPendingDistributedEditingChanges( {} ) ).toBe( false );
		expect( shouldWarnBeforeLeavingDistributedEditingSession( {} ) ).toBe(
			false
		);
	} );

	it( 'selects conflict and copy/export requirements from session state', () => {
		const state = {
			distributedEditingSession: normalizeDistributedEditingSessionState(
				{
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.CONFLICT_REQUIRES_SERVER_STATE_ACCEPTANCE,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_RESTORED_FROM_REVISION_CONFLICT,
					pendingChangeCount: 2,
					remoteChangeCount: 1,
				}
			),
		};

		expect( getDistributedEditingSessionDisposition( state ) ).toBe(
			DISTRIBUTED_EDITING_DISPOSITIONS.CONFLICT_REQUIRES_SERVER_STATE_ACCEPTANCE
		);
		expect( getDistributedEditingSessionReasonCode( state ) ).toBe(
			DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_RESTORED_FROM_REVISION_CONFLICT
		);
		expect( hasPendingDistributedEditingChanges( state ) ).toBe( true );
		expect( isAwaitingDistributedEditingServerConfirmation( state ) ).toBe(
			true
		);
		expect( hasRemoteDistributedEditingChanges( state ) ).toBe( true );
		expect( requiresDistributedEditingServerStateAcceptance( state ) ).toBe(
			true
		);
		expect( mustOfferDistributedEditingLocalCopy( state ) ).toBe( true );
		expect( canExportDistributedEditingLocalUpdates( state ) ).toBe( true );
		expect(
			shouldWarnBeforeLeavingDistributedEditingSession( state )
		).toBe( true );
		expect(
			getDistributedEditingNoticeDescriptors( state ).map(
				( notice ) => notice.kind
			)
		).toEqual( [
			DISTRIBUTED_EDITING_NOTICE_KINDS.SERVER_STATE_ACCEPTANCE_REQUIRED,
			DISTRIBUTED_EDITING_NOTICE_KINDS.REMOTE_CHANGES_RECEIVED,
		] );
		expect(
			getDistributedEditingUnloadWarningState( state )
		).toMatchObject( {
			shouldWarn: true,
			reason: DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS.PENDING_CHANGES,
			canExportLocalUpdates: true,
			mustOfferLocalCopy: true,
		} );
	} );

	it( 'selects degraded connection state without forcing unload warnings', () => {
		const state = {
			distributedEditingSession: normalizeDistributedEditingSessionState(
				{
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.ACCEPTED_WITH_DEGRADED_LIVE_FEEDBACK,
				}
			),
		};

		expect( isDistributedEditingConnectionDegraded( state ) ).toBe( true );
		expect( hasPendingDistributedEditingChanges( state ) ).toBe( false );
		expect(
			shouldWarnBeforeLeavingDistributedEditingSession( state )
		).toBe( false );
		expect( getDistributedEditingNoticeDescriptors( state ) ).toEqual( [
			expect.objectContaining( {
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.CONNECTION_DEGRADED,
				status: 'warning',
				priority: 'status',
			} ),
		] );
		expect(
			getDistributedEditingUnloadWarningState( state )
		).toMatchObject( {
			shouldWarn: false,
			reason: null,
		} );
	} );
} );
