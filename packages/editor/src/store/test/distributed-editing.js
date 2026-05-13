/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	DISTRIBUTED_EDITING_DISPOSITIONS,
	DISTRIBUTED_EDITING_REASON_CODES,
	DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE,
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
	getDistributedEditingSessionDisposition,
	getDistributedEditingSessionReasonCode,
	getDistributedEditingSessionState,
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
	} );
} );
