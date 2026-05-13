/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	DISTRIBUTED_EDITING_DISPOSITIONS,
	DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES,
	DISTRIBUTED_EDITING_NOTICE_ACTIONS,
	DISTRIBUTED_EDITING_NOTICE_IDS,
	DISTRIBUTED_EDITING_NOTICE_KINDS,
	DISTRIBUTED_EDITING_REASON_CODES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_REASONS,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS,
	DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES,
	DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS,
	DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE,
	getDistributedEditingRetrySavePolicyForSessionState,
	getDistributedEditingStaleBaseLocalRebaseResult,
	getDistributedEditingSessionStateForRetrySaveHandoff,
	getDistributedEditingSessionStateForRetrySaveRequest,
	getDistributedEditingSessionStateForRetrySaveResult,
	getDistributedEditingSessionStateForRetrySubmitHandoff,
	getDistributedEditingSessionStateForRetrySubmitProofResult,
	getDistributedEditingSessionStateForRetrySubmitSavePreparation,
	getDistributedEditingSessionStateForRecoveryDryRunResult,
	getDistributedEditingSessionStateForStaleBaseLocalRebasePlan,
	getDistributedEditingSessionStateForStaleBaseRejectionResult,
	getDistributedEditingSessionStateForStaleBaseServerStateRefetchResult,
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
		expect(
			isValidDistributedEditingReasonCode(
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED
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
			isValidDistributedEditingDisposition(
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED
			)
		).toBe( true );
		expect(
			isValidDistributedEditingDisposition(
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION
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
			clientBaseContent: null,
			refetchedServerContent: null,
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
			requiresServerStateRefetch: false,
			refetchedServerState: false,
			canAttemptLocalRebase: false,
			localRebasePlanStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.NONE,
			localRebaseResultStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.NONE,
			localRebaseResultReason: null,
			readyToRetrySubmit: false,
			retrySubmitHandoffStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.NONE,
			retrySubmitHandoffReason: null,
			retrySubmitPrepared: false,
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.NONE,
			retrySubmitProofReason: null,
			retrySubmitAccepted: false,
			retrySubmitSavePathRequired: false,
			retrySubmitSavesPost: false,
			retrySubmitMutatesPostContent: false,
			retrySubmitCreatesRevision: false,
			retrySubmitClaimsSaved: false,
			retrySubmitSaveStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.NONE,
			retrySubmitSaveReason: null,
			retrySubmitSavePrepared: false,
			retrySubmitSaveReady: false,
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
			retrySaveReason: null,
			retrySaveHandoffStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.NONE,
			retrySaveHandoffReason: null,
			retrySaveHandoffAllowsNormalSaveFallback: false,
			retrySaveHandoffBlocksNormalSave: false,
			retrySaveAccepted: false,
			retrySaveServerVersion: null,
			retrySavePreviousServerVersion: null,
			retrySaveSavesPost: false,
			retrySaveMutatesPostContent: false,
			retrySaveCreatesRevision: false,
			retrySaveClaimsSaved: false,
			retrySaveRevisionCreated: false,
			retrySaveCreatedRevisionIds: [],
			requiresManualConflictResolution: false,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
		} );
	} );

	it( 'normalizes stale-base rejection state without retry side effects', () => {
		const normalized =
			getDistributedEditingSessionStateForStaleBaseRejectionResult( {
				reason_code:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				client_base_version: 'server-v4',
				server_version: 'server-v6',
				client_base_content:
					'<!-- wp:paragraph --><p>Base.</p><!-- /wp:paragraph -->',
				pending_change_count: 2,
				remote_change_count: 1,
			} );

		expect( normalized ).toMatchObject( {
			clientBaseVersion: 'server-v4',
			serverVersion: 'server-v6',
			clientBaseContent:
				'<!-- wp:paragraph --><p>Base.</p><!-- /wp:paragraph -->',
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
			pendingChangeCount: 2,
			hasPendingChanges: true,
			isAwaitingServerConfirmation: true,
			remoteChangeCount: 1,
			hasRemoteChanges: true,
			requiresServerStateRefetch: true,
			refetchedServerState: false,
			canAttemptLocalRebase: false,
			requiresManualConflictResolution: false,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
		} );
	} );

	it( 'normalizes stale-base rejection data from REST error payloads', () => {
		const normalized =
			getDistributedEditingSessionStateForStaleBaseRejectionResult( {
				code: DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				data: {
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					client_base_version: 'server-v4',
					server_version: 'server-v6',
					pending_change_count: 2,
					remote_change_count: 3,
					can_attempt_local_rebase: false,
				},
			} );

		expect( normalized ).toMatchObject( {
			clientBaseVersion: 'server-v4',
			serverVersion: 'server-v6',
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
			pendingChangeCount: 2,
			remoteChangeCount: 3,
			requiresServerStateRefetch: true,
			refetchedServerState: false,
			canAttemptLocalRebase: false,
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

	it( 'marks stale-base server state as refetched without applying server content', () => {
		const normalized =
			getDistributedEditingSessionStateForStaleBaseServerStateRefetchResult(
				{
					distributed_editing: {
						server_version: 'server-v7',
					},
					content: {
						raw: '<!-- wp:paragraph --><p>Server state.</p><!-- /wp:paragraph -->',
					},
				},
				getDistributedEditingSessionStateForStaleBaseRejectionResult( {
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					client_base_version: 'server-v4',
					server_version: 'server-v6',
					pending_change_count: 2,
					remote_change_count: 3,
				} )
			);

		expect( normalized ).toMatchObject( {
			clientBaseVersion: 'server-v4',
			serverVersion: 'server-v7',
			refetchedServerContent:
				'<!-- wp:paragraph --><p>Server state.</p><!-- /wp:paragraph -->',
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
			pendingChangeCount: 2,
			remoteChangeCount: 3,
			hasPendingChanges: true,
			isAwaitingServerConfirmation: true,
			requiresServerStateRefetch: false,
			refetchedServerState: true,
			canAttemptLocalRebase: true,
			canExportLocalUpdates: true,
		} );
	} );

	it( 'plans stale-base local rebase without preparing a retry submit', () => {
		const refetchedState =
			getDistributedEditingSessionStateForStaleBaseServerStateRefetchResult(
				{
					distributed_editing: {
						server_version: 'server-v7',
					},
				},
				getDistributedEditingSessionStateForStaleBaseRejectionResult( {
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					client_base_version: 'server-v4',
					server_version: 'server-v6',
					pending_change_count: 2,
					remote_change_count: 3,
				} )
			);
		const planned =
			getDistributedEditingSessionStateForStaleBaseLocalRebasePlan(
				refetchedState
			);

		expect( planned ).toMatchObject( {
			clientBaseVersion: 'server-v4',
			serverVersion: 'server-v7',
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
			pendingChangeCount: 2,
			requiresServerStateRefetch: false,
			refetchedServerState: true,
			canAttemptLocalRebase: true,
			canExportLocalUpdates: true,
			localRebasePlanStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
			readyToRetrySubmit: false,
		} );
	} );

	it( 'blocks stale-base local rebase planning until server state is refetched', () => {
		const planned =
			getDistributedEditingSessionStateForStaleBaseLocalRebasePlan(
				getDistributedEditingSessionStateForStaleBaseRejectionResult( {
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					client_base_version: 'server-v4',
					server_version: 'server-v6',
					pending_change_count: 2,
				} )
			);

		expect( planned ).toMatchObject( {
			requiresServerStateRefetch: true,
			refetchedServerState: false,
			canAttemptLocalRebase: false,
			localRebasePlanStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.NEEDS_SERVER_STATE,
			readyToRetrySubmit: false,
		} );
	} );

	it( 'blocks stale-base local rebase planning when no local changes remain', () => {
		const planned =
			getDistributedEditingSessionStateForStaleBaseLocalRebasePlan( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				refetchedServerState: true,
				pendingChangeCount: 0,
			} );

		expect( planned ).toMatchObject( {
			pendingChangeCount: 0,
			hasPendingChanges: false,
			isAwaitingServerConfirmation: false,
			refetchedServerState: true,
			canAttemptLocalRebase: false,
			localRebasePlanStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.NO_PENDING_CHANGES,
			readyToRetrySubmit: false,
		} );
	} );

	const getReadyStaleBaseLocalRebaseSessionState = () =>
		getDistributedEditingSessionStateForStaleBaseLocalRebasePlan( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
			refetchedServerState: true,
			pendingChangeCount: 1,
			canAttemptLocalRebase: true,
		} );

	it( 'rebases stale-base local changes over remote serialized block changes', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
		const serverContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote beta</p><!-- /wp:paragraph -->';
		const localContent =
			'<!-- wp:paragraph --><p>Local alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState:
				getDistributedEditingSessionStateForStaleBaseLocalRebasePlan(
					getDistributedEditingSessionStateForStaleBaseServerStateRefetchResult(
						{
							distributed_editing: {
								server_version: 'server-v7',
							},
						},
						getDistributedEditingSessionStateForStaleBaseRejectionResult(
							{
								reason_code:
									DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
								client_base_version: 'server-v4',
								server_version: 'server-v6',
								pending_change_count: 2,
								remote_change_count: 1,
							}
						)
					)
				),
			clientBaseContent: baseContent,
			serverContent,
			localContent,
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
			reason: null,
			hasCandidatePostContent: true,
			mergedBlockCount: 2,
			readyToRetrySubmit: true,
			requiresManualConflictResolution: false,
			sessionState: {
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
				canAttemptLocalRebase: false,
				readyToRetrySubmit: true,
				requiresManualConflictResolution: false,
			},
		} );
		expect( result.candidatePostContent ).toBe(
			'<!-- wp:paragraph --><p>Local alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote beta</p><!-- /wp:paragraph -->'
		);
	} );

	it( 'rebases one-sided insertion into an empty serialized post', () => {
		const localContent =
			'<!-- wp:paragraph --><p>Local draft</p><!-- /wp:paragraph -->';
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState: getReadyStaleBaseLocalRebaseSessionState(),
			clientBaseContent: '',
			serverContent: '',
			localContent,
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
			reason: null,
			hasCandidatePostContent: true,
			mergedBlockCount: 1,
			readyToRetrySubmit: true,
			requiresManualConflictResolution: false,
		} );
		expect( result.candidatePostContent ).toBe( localContent );
	} );

	it( 'rebases one-sided serialized block deletion', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
		const localContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph -->';
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState: getReadyStaleBaseLocalRebaseSessionState(),
			clientBaseContent: baseContent,
			serverContent: baseContent,
			localContent,
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
			reason: null,
			hasCandidatePostContent: true,
			mergedBlockCount: 1,
			readyToRetrySubmit: true,
			requiresManualConflictResolution: false,
		} );
		expect( result.candidatePostContent ).toBe( localContent );
	} );

	it( 'requires manual conflict for concurrent serialized block insertions', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph -->';
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState: getReadyStaleBaseLocalRebaseSessionState(),
			clientBaseContent: baseContent,
			serverContent:
				'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote beta</p><!-- /wp:paragraph -->',
			localContent:
				'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Local gamma</p><!-- /wp:paragraph -->',
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
			reason: 'block_inserted',
			hasCandidatePostContent: false,
			readyToRetrySubmit: false,
			requiresManualConflictResolution: true,
			sessionState: {
				localRebaseResultReason: 'block_inserted',
			},
		} );
	} );

	it( 'requires manual conflict for concurrent serialized block deletions', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Gamma</p><!-- /wp:paragraph -->';
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState: getReadyStaleBaseLocalRebaseSessionState(),
			clientBaseContent: baseContent,
			serverContent:
				'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->',
			localContent:
				'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph -->',
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
			reason: 'block_deleted',
			hasCandidatePostContent: false,
			readyToRetrySubmit: false,
			requiresManualConflictResolution: true,
		} );
	} );

	it( 'requires manual conflict for serialized block reorder against local edits', () => {
		const alphaBlock =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph -->';
		const betaBlock =
			'<!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
		const localAlphaBlock =
			'<!-- wp:paragraph --><p>Local alpha</p><!-- /wp:paragraph -->';
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState: getReadyStaleBaseLocalRebaseSessionState(),
			clientBaseContent: alphaBlock + betaBlock,
			serverContent: betaBlock + alphaBlock,
			localContent: localAlphaBlock + betaBlock,
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
			reason: 'block_reordered',
			hasCandidatePostContent: false,
			readyToRetrySubmit: false,
			requiresManualConflictResolution: true,
		} );
	} );

	it( 'rejects freeform HTML local rebase content as unsafe', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph -->';
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState: getReadyStaleBaseLocalRebaseSessionState(),
			clientBaseContent: baseContent,
			serverContent: baseContent,
			localContent: '<p>Freeform alpha</p>',
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.UNSAFE_CONTENT_BOUNDARY,
			reason: 'freeform_html',
			hasCandidatePostContent: false,
			readyToRetrySubmit: false,
			requiresManualConflictResolution: true,
			sessionState: {
				localRebaseResultReason: 'freeform_html',
			},
		} );
	} );

	it( 'prepares a no-save retry handoff after a successful local rebase', () => {
		const prepared = getDistributedEditingSessionStateForRetrySubmitHandoff(
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				pendingChangeCount: 1,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
				readyToRetrySubmit: true,
			}
		);

		expect( prepared ).toMatchObject( {
			localRebaseResultStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
			readyToRetrySubmit: false,
			retrySubmitHandoffStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
			retrySubmitHandoffReason: null,
			retrySubmitPrepared: true,
			requiresManualConflictResolution: false,
		} );
	} );

	it( 'blocks no-save retry handoff before a successful local rebase', () => {
		const blocked = getDistributedEditingSessionStateForRetrySubmitHandoff(
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				pendingChangeCount: 1,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				localRebaseResultReason: 'block_reordered',
				requiresManualConflictResolution: true,
				readyToRetrySubmit: true,
			}
		);

		expect( blocked ).toMatchObject( {
			localRebaseResultStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
			localRebaseResultReason: 'block_reordered',
			readyToRetrySubmit: false,
			retrySubmitHandoffStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.BLOCKED,
			retrySubmitHandoffReason:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_REASONS.MANUAL_CONFLICT_REQUIRED,
			retrySubmitPrepared: false,
			requiresManualConflictResolution: true,
		} );
	} );

	it( 'normalizes accepted retry-submit proof without claiming a save', () => {
		const normalized =
			getDistributedEditingSessionStateForRetrySubmitProofResult(
				{
					result: 'retry_submit_accepted_for_future_save',
					retry_submit_accepted: true,
					save_path_required: true,
					saves_post: false,
					mutates_post_content: false,
					creates_revision: false,
					claims_saved: false,
				},
				{
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					clientBaseVersion: '4',
					serverVersion: '7',
					pendingChangeCount: 2,
					localRebaseResultStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
					retrySubmitHandoffStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
					retrySubmitPrepared: true,
				}
			);

		expect( normalized ).toMatchObject( {
			disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
			reasonCode: null,
			pendingChangeCount: 2,
			hasPendingChanges: true,
			isAwaitingServerConfirmation: true,
			remoteChangeCount: 0,
			hasRemoteChanges: false,
			retrySubmitHandoffStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
			retrySubmitPrepared: true,
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
			retrySubmitAccepted: true,
			retrySubmitSavePathRequired: true,
			retrySubmitSavesPost: false,
			retrySubmitMutatesPostContent: false,
			retrySubmitCreatesRevision: false,
			retrySubmitClaimsSaved: false,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
		} );
	} );

	it( 'normalizes stale retry-submit proof after handoff as a new stale-base rejection', () => {
		const normalized =
			getDistributedEditingSessionStateForRetrySubmitProofResult(
				{
					code: DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					data: {
						reason_code:
							DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
						client_base_version: '7',
						server_version: '8',
						pending_change_count: 1,
						remote_change_count: 1,
					},
				},
				{
					clientBaseVersion: '4',
					serverVersion: '7',
					clientBaseContent:
						'<!-- wp:paragraph --><p>Base.</p><!-- /wp:paragraph -->',
					refetchedServerContent:
						'<!-- wp:paragraph --><p>Server.</p><!-- /wp:paragraph -->',
					pendingChangeCount: 1,
					refetchedServerState: true,
					localRebasePlanStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
					localRebaseResultStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
					retrySubmitHandoffStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
					retrySubmitPrepared: true,
					canExportLocalUpdates: true,
				}
			);

		expect( normalized ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
			clientBaseVersion: '7',
			serverVersion: '8',
			clientBaseContent:
				'<!-- wp:paragraph --><p>Base.</p><!-- /wp:paragraph -->',
			refetchedServerState: false,
			requiresServerStateRefetch: true,
			localRebasePlanStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.NONE,
			localRebaseResultStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.NONE,
			readyToRetrySubmit: false,
			retrySubmitHandoffStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.NONE,
			retrySubmitPrepared: false,
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.STALE_BASE_REJECTED,
			retrySubmitProofReason:
				DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
			canExportLocalUpdates: true,
		} );
	} );

	it( 'normalizes retry-submit proof permission errors without losing local copy protection', () => {
		const normalized =
			getDistributedEditingSessionStateForRetrySubmitProofResult(
				{
					code: DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
				},
				{
					pendingChangeCount: 1,
					canExportLocalUpdates: true,
				}
			);

		expect( normalized ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
			reasonCode: DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.REJECTED_PERMISSION_DENIED,
			retrySubmitAccepted: false,
			retrySubmitSavePathRequired: false,
			hasPendingChanges: true,
			isAwaitingServerConfirmation: true,
			canExportLocalUpdates: true,
		} );
	} );

	it( 'prepares accepted retry-submit proof for a future save path without claiming a save', () => {
		const prepared =
			getDistributedEditingSessionStateForRetrySubmitSavePreparation( {
				pendingChangeCount: 2,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
				retrySubmitAccepted: true,
				retrySubmitSavePathRequired: true,
				retrySubmitSavesPost: false,
				retrySubmitMutatesPostContent: false,
				retrySubmitCreatesRevision: false,
				retrySubmitClaimsSaved: false,
				canExportLocalUpdates: true,
			} );

		expect( prepared ).toMatchObject( {
			pendingChangeCount: 2,
			hasPendingChanges: true,
			isAwaitingServerConfirmation: true,
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
			retrySubmitAccepted: true,
			retrySubmitSavePathRequired: true,
			retrySubmitSaveStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
			retrySubmitSaveReason: null,
			retrySubmitSavePrepared: true,
			retrySubmitSaveReady: true,
			retrySubmitSavesPost: false,
			retrySubmitMutatesPostContent: false,
			retrySubmitCreatesRevision: false,
			retrySubmitClaimsSaved: false,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
		} );
	} );

	it( 'blocks retry-submit save preparation when proof was rejected', () => {
		const blocked =
			getDistributedEditingSessionStateForRetrySubmitSavePreparation( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
				reasonCode: DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
				pendingChangeCount: 1,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.REJECTED_PERMISSION_DENIED,
				retrySubmitProofReason:
					DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
				canExportLocalUpdates: true,
			} );

		expect( blocked ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
			retrySubmitSaveStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.BLOCKED,
			retrySubmitSaveReason:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS.PERMISSION_DENIED,
			retrySubmitSavePrepared: false,
			retrySubmitSaveReady: false,
			hasPendingChanges: true,
			canExportLocalUpdates: true,
		} );
	} );

	it( 'blocks retry-submit save preparation when proof claims persistence', () => {
		const blocked =
			getDistributedEditingSessionStateForRetrySubmitSavePreparation( {
				pendingChangeCount: 1,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
				retrySubmitAccepted: true,
				retrySubmitSavePathRequired: true,
				retrySubmitClaimsSaved: true,
				canExportLocalUpdates: true,
			} );

		expect( blocked ).toMatchObject( {
			retrySubmitSaveStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.BLOCKED,
			retrySubmitSaveReason:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS.RETRY_SUBMIT_PROOF_CLAIMED_SAVE,
			retrySubmitSaveReady: false,
			canExportLocalUpdates: true,
		} );
	} );

	it( 'marks guarded retry-save requests as pending and exportable', () => {
		const saving = getDistributedEditingSessionStateForRetrySaveRequest(
			{
				serverVersion: '7',
				pendingChangeCount: 2,
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				retrySubmitSaveReady: true,
				canExportLocalUpdates: true,
			},
			{ pendingChangeCount: 2 }
		);

		expect( saving ).toMatchObject( {
			serverVersion: '7',
			pendingChangeCount: 2,
			hasPendingChanges: true,
			isAwaitingServerConfirmation: true,
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
			retrySaveReason: null,
			retrySaveAccepted: false,
			retrySavePreviousServerVersion: '7',
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
		} );
	} );

	it( 'normalizes confirmed retry-save responses as saved and clears pending changes', () => {
		const normalized = getDistributedEditingSessionStateForRetrySaveResult(
			{
				result: 'retry_save_applied',
				retry_save_accepted: true,
				previous_server_version: '7',
				server_version: '8',
				pending_change_count: 2,
				save_path_required: false,
				saves_post: true,
				mutates_post_content: true,
				creates_revision: true,
				claims_saved: true,
				revision_created: true,
				created_revision_ids: [ 7002 ],
			},
			{
				serverVersion: '7',
				pendingChangeCount: 2,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
				retrySubmitAccepted: true,
				retrySubmitSavePathRequired: true,
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				retrySubmitSaveReady: true,
				canExportLocalUpdates: true,
			}
		);

		expect( normalized ).toMatchObject( {
			disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
			reasonCode: null,
			pendingChangeCount: 0,
			hasPendingChanges: false,
			isAwaitingServerConfirmation: false,
			retrySubmitAccepted: false,
			retrySubmitSavePathRequired: false,
			retrySubmitSaveStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.NONE,
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
			retrySaveAccepted: true,
			retrySaveServerVersion: '8',
			retrySavePreviousServerVersion: '7',
			retrySaveSavesPost: true,
			retrySaveMutatesPostContent: true,
			retrySaveCreatesRevision: true,
			retrySaveClaimsSaved: true,
			retrySaveRevisionCreated: true,
			retrySaveCreatedRevisionIds: [ 7002 ],
			mustOfferLocalCopy: false,
			canExportLocalUpdates: false,
		} );
	} );

	it( 'normalizes retry-save stale and tampered rejections without dropping local copy protection', () => {
		const stale = getDistributedEditingSessionStateForRetrySaveResult(
			{
				code: DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				data: {
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					client_base_version: '7',
					server_version: '8',
					pending_change_count: 1,
				},
			},
			{
				serverVersion: '7',
				pendingChangeCount: 1,
			}
		);
		const tampered = getDistributedEditingSessionStateForRetrySaveResult(
			{
				code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
				data: {
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
					pending_change_count: 1,
				},
			},
			{
				serverVersion: '7',
				pendingChangeCount: 1,
			}
		);

		expect( stale ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
			requiresServerStateRefetch: true,
			retrySaveStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED,
			retrySaveReason:
				DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
			hasPendingChanges: true,
			isAwaitingServerConfirmation: true,
			canExportLocalUpdates: true,
		} );
		expect( tampered ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_SYNC_META_TAMPERED,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
			retrySaveStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED,
			retrySaveReason:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
			hasPendingChanges: true,
			isAwaitingServerConfirmation: true,
			canExportLocalUpdates: true,
		} );
	} );

	it( 'marks guarded retry-save policy ready only after accepted proof and save preparation', () => {
		const policy = getDistributedEditingRetrySavePolicyForSessionState(
			{
				clientBaseVersion: '4',
				serverVersion: '7',
				pendingChangeCount: 2,
				hasPendingChanges: true,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
				retrySubmitAccepted: true,
				retrySubmitSavePathRequired: true,
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				retrySubmitSaveReady: true,
				canExportLocalUpdates: true,
			},
			{
				postId: 44,
				restBase: 'posts',
				proposedPostContent:
					'<!-- wp:paragraph --><p>Rebased save.</p><!-- /wp:paragraph -->',
			}
		);

		expect( policy ).toEqual( {
			status: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_STATUSES.READY,
			reason: null,
			canRetrySave: true,
			shouldCallRetrySaveEndpoint: true,
			shouldCallNormalSavePost: false,
			changesPostLock: false,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			claimsSaved: false,
			protectsLocalChanges: true,
			canExportLocalUpdates: true,
			requiresServerStateRefetch: false,
			hasAcceptedProof: true,
			hasPreparedSavePath: true,
			hasPostRoute: true,
			hasProposedPostContent: true,
			hasVersionProof: true,
			request: {
				postId: 44,
				restBase: 'posts',
				clientBaseVersion: '7',
				acceptedProofServerVersion: '7',
				rebasedFromVersion: '4',
				pendingChangeCount: 2,
			},
		} );
	} );

	it( 'blocks guarded retry-save policy without side effects for unsafe save states', () => {
		const readySessionState = {
			clientBaseVersion: '4',
			serverVersion: '7',
			pendingChangeCount: 1,
			hasPendingChanges: true,
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
			retrySubmitAccepted: true,
			retrySubmitSavePathRequired: true,
			retrySubmitSaveStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
			retrySubmitSaveReady: true,
			canExportLocalUpdates: true,
		};
		const readyContext = {
			postId: 44,
			restBase: 'posts',
			proposedPostContent:
				'<!-- wp:paragraph --><p>Rebased save.</p><!-- /wp:paragraph -->',
		};
		const cases = [
			[
				{
					...readySessionState,
					pendingChangeCount: 0,
					hasPendingChanges: false,
					canExportLocalUpdates: false,
				},
				readyContext,
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.NO_PENDING_CHANGES,
				false,
			],
			[
				{
					...readySessionState,
					retrySubmitAccepted: false,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.NONE,
				},
				readyContext,
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_PROOF_NOT_ACCEPTED,
				false,
			],
			[
				{
					...readySessionState,
					retrySubmitSaveStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.BLOCKED,
					retrySubmitSaveReady: false,
				},
				readyContext,
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_SAVE_NOT_READY,
				false,
			],
			[
				{
					...readySessionState,
					retrySubmitClaimsSaved: true,
				},
				readyContext,
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_PROOF_CLAIMED_SAVE,
				false,
			],
			[
				{
					...readySessionState,
					requiresServerStateRefetch: true,
				},
				readyContext,
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
				true,
			],
			[
				{
					...readySessionState,
					requiresManualConflictResolution: true,
				},
				readyContext,
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.MANUAL_CONFLICT_REQUIRED,
				false,
			],
			[
				{
					...readySessionState,
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
				},
				readyContext,
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS,
				false,
			],
			[
				readySessionState,
				{ ...readyContext, postId: null },
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.MISSING_POST_ROUTE,
				false,
			],
			[
				readySessionState,
				{ ...readyContext, proposedPostContent: null },
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.MISSING_PROPOSED_CONTENT,
				false,
			],
			[
				{
					...readySessionState,
					clientBaseVersion: null,
					serverVersion: null,
				},
				readyContext,
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.MISSING_VERSION_PROOF,
				false,
			],
		];

		for ( const [
			sessionState,
			context,
			expectedReason,
			expectedRefetch,
		] of cases ) {
			expect(
				getDistributedEditingRetrySavePolicyForSessionState(
					sessionState,
					context
				)
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_STATUSES.BLOCKED,
				reason: expectedReason,
				canRetrySave: false,
				shouldCallRetrySaveEndpoint: false,
				shouldCallNormalSavePost: false,
				changesPostLock: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				claimsSaved: false,
				protectsLocalChanges:
					expectedReason !==
					DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.NO_PENDING_CHANGES,
				canExportLocalUpdates:
					expectedReason !==
					DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.NO_PENDING_CHANGES,
				requiresServerStateRefetch: expectedRefetch,
				request: null,
			} );
		}
	} );

	it( 'records blocked retry-save handoff state with export and refetch protection', () => {
		const sessionState =
			getDistributedEditingSessionStateForRetrySaveHandoff(
				{
					clientBaseVersion: '4',
					serverVersion: '7',
					pendingChangeCount: 1,
					hasPendingChanges: true,
				},
				{
					status: DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
					reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
					policy: {
						protectsLocalChanges: true,
						requiresServerStateRefetch: true,
					},
				}
			);
		const notices =
			getDistributedEditingNoticeDescriptorsForSessionState(
				sessionState
			);

		expect( sessionState ).toMatchObject( {
			hasPendingChanges: true,
			isAwaitingServerConfirmation: true,
			requiresServerStateRefetch: true,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
			retrySaveHandoffStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
			retrySaveHandoffReason:
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
			retrySaveHandoffAllowsNormalSaveFallback: false,
			retrySaveHandoffBlocksNormalSave: true,
		} );
		expect( notices ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					kind: DISTRIBUTED_EDITING_NOTICE_KINDS.RETRY_SAVE,
					status: 'warning',
					priority: 'blocking',
					retrySaveHandoffStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
					retrySaveHandoffReason:
						DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
					actionKeys: [
						DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
						DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
					],
				} ),
			] )
		);
	} );

	it( 'rebases stale-base local changes from remembered base and refetched server content', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
		const serverContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote beta</p><!-- /wp:paragraph -->';
		const localContent =
			'<!-- wp:paragraph --><p>Local alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState:
				getDistributedEditingSessionStateForStaleBaseLocalRebasePlan(
					getDistributedEditingSessionStateForStaleBaseServerStateRefetchResult(
						{
							distributed_editing: {
								server_version: 'server-v7',
							},
							content: {
								raw: serverContent,
							},
						},
						getDistributedEditingSessionStateForStaleBaseRejectionResult(
							{
								reason_code:
									DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
								client_base_version: 'server-v4',
								server_version: 'server-v6',
								clientBaseContent: baseContent,
								pending_change_count: 2,
								remote_change_count: 1,
							}
						)
					)
				),
			localContent,
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
			hasCandidatePostContent: true,
			readyToRetrySubmit: true,
			sessionState: {
				clientBaseContent: baseContent,
				refetchedServerContent: serverContent,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
			},
		} );
		expect( result.candidatePostContent ).toBe(
			'<!-- wp:paragraph --><p>Local alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote beta</p><!-- /wp:paragraph -->'
		);
	} );

	it( 'requires manual conflict when local and remote edit the same serialized block', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph -->';
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState:
				getDistributedEditingSessionStateForStaleBaseLocalRebasePlan( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					refetchedServerState: true,
					pendingChangeCount: 1,
					canAttemptLocalRebase: true,
				} ),
			clientBaseContent: baseContent,
			serverContent:
				'<!-- wp:paragraph --><p>Remote alpha</p><!-- /wp:paragraph -->',
			localContent:
				'<!-- wp:paragraph --><p>Local alpha</p><!-- /wp:paragraph -->',
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
			reason: 'same_block_changed',
			hasCandidatePostContent: false,
			readyToRetrySubmit: false,
			requiresManualConflictResolution: true,
			sessionState: {
				canAttemptLocalRebase: false,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				readyToRetrySubmit: false,
				requiresManualConflictResolution: true,
				canExportLocalUpdates: true,
			},
		} );
	} );

	it( 'rejects non-canonical serialized block content as unsafe', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph -->';
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState:
				getDistributedEditingSessionStateForStaleBaseLocalRebasePlan( {
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					refetchedServerState: true,
					pendingChangeCount: 1,
					canAttemptLocalRebase: true,
				} ),
			clientBaseContent: baseContent,
			serverContent: baseContent,
			localContent:
				'<!-- wp:paragraph {"bad": } --><p>Alpha</p><!-- /wp:paragraph -->',
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.UNSAFE_CONTENT_BOUNDARY,
			reason: 'block_comment_json_invalid',
			hasCandidatePostContent: false,
			readyToRetrySubmit: false,
			requiresManualConflictResolution: true,
		} );
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

	it( 'normalizes recovery dry-run REST results into inert session state', () => {
		expect(
			getDistributedEditingSessionStateForRecoveryDryRunResult( {
				mode: 'dry_run',
				result: 'candidate_update_valid',
			} )
		).toBe( DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE );

		expect(
			getDistributedEditingSessionStateForRecoveryDryRunResult( {
				code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED,
			} )
		).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_FEATURE_DISABLED,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED,
			hasPendingChanges: false,
			isAwaitingServerConfirmation: false,
		} );

		expect(
			getDistributedEditingSessionStateForRecoveryDryRunResult( {
				code: DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
			} )
		).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
			reasonCode: DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
			hasPendingChanges: false,
			isAwaitingServerConfirmation: false,
		} );

		expect(
			getDistributedEditingSessionStateForRecoveryDryRunResult( {
				code: DISTRIBUTED_EDITING_REASON_CODES.REST_POST_INVALID_ID,
			} )
		).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_ROUTE_MISMATCH,
			reasonCode: DISTRIBUTED_EDITING_REASON_CODES.REST_POST_INVALID_ID,
			hasPendingChanges: false,
			isAwaitingServerConfirmation: false,
		} );

		expect(
			getDistributedEditingSessionStateForRecoveryDryRunResult( {
				result: 'manual_resolution_required',
				reason_code:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_UNRECOVERABLE,
			} )
		).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REQUIRES_MANUAL_RESOLUTION_NO_SYNC_META,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_UNRECOVERABLE,
			canExportLocalUpdates: true,
			hasPendingChanges: false,
			isAwaitingServerConfirmation: false,
		} );
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

	it( 'builds stale-base rejection notice descriptors', () => {
		const notices = getDistributedEditingNoticeDescriptorsForSessionState(
			getDistributedEditingSessionStateForStaleBaseRejectionResult( {
				clientBaseVersion: 'server-v4',
				serverVersion: 'server-v6',
				pendingChangeCount: 1,
			} )
		);

		expect( notices ).toEqual( [
			expect.objectContaining( {
				id: DISTRIBUTED_EDITING_NOTICE_IDS.STALE_BASE_REJECTED,
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.STALE_BASE_REJECTED,
				status: 'warning',
				priority: 'blocking',
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				pendingChangeCount: 1,
				remoteChangeCount: 1,
				actionKeys: [
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
				],
			} ),
			expect.objectContaining( {
				id: DISTRIBUTED_EDITING_NOTICE_IDS.REMOTE_CHANGES_RECEIVED,
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.REMOTE_CHANGES_RECEIVED,
			} ),
		] );
	} );

	it( 'adds local rebase readiness to stale-base notice descriptors without raw content', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>Base</p><!-- /wp:paragraph -->';
		const serverContent =
			'<!-- wp:paragraph --><p>Server</p><!-- /wp:paragraph -->';
		const notices = getDistributedEditingNoticeDescriptorsForSessionState( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
			pendingChangeCount: 1,
			remoteChangeCount: 1,
			requiresServerStateRefetch: false,
			refetchedServerState: true,
			canAttemptLocalRebase: true,
			canExportLocalUpdates: true,
			localRebasePlanStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
			clientBaseContent: baseContent,
			refetchedServerContent: serverContent,
		} );

		expect( notices[ 0 ] ).toMatchObject( {
			kind: DISTRIBUTED_EDITING_NOTICE_KINDS.STALE_BASE_REJECTED,
			canAttemptLocalRebase: true,
			localRebasePlanStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
			localRebaseResultStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.NONE,
			localRebaseResultReason: null,
			readyToRetrySubmit: false,
			retrySubmitHandoffStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.NONE,
			retrySubmitPrepared: false,
			hasClientBaseContent: true,
			hasRefetchedServerContent: true,
			hasLocalRebaseInputs: true,
			actionKeys: [
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.REBASE_LOCAL_UPDATES,
			],
		} );
		expect( JSON.stringify( notices[ 0 ] ) ).not.toContain( baseContent );
		expect( JSON.stringify( notices[ 0 ] ) ).not.toContain( serverContent );
	} );

	it( 'withholds local rebase notice actions when remembered inputs are missing', () => {
		const notices = getDistributedEditingNoticeDescriptorsForSessionState( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
			pendingChangeCount: 1,
			remoteChangeCount: 1,
			requiresServerStateRefetch: false,
			refetchedServerState: true,
			canAttemptLocalRebase: true,
			canExportLocalUpdates: true,
			localRebasePlanStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
			refetchedServerContent: '',
		} );

		expect( notices[ 0 ] ).toMatchObject( {
			kind: DISTRIBUTED_EDITING_NOTICE_KINDS.STALE_BASE_REJECTED,
			canAttemptLocalRebase: true,
			localRebasePlanStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
			hasClientBaseContent: false,
			hasRefetchedServerContent: true,
			hasLocalRebaseInputs: false,
			actionKeys: [
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
			],
		} );
	} );

	it( 'adds retry-submit proof refresh action after prepared handoff', () => {
		const notices = getDistributedEditingNoticeDescriptorsForSessionState( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
			pendingChangeCount: 1,
			remoteChangeCount: 1,
			requiresServerStateRefetch: false,
			refetchedServerState: true,
			canExportLocalUpdates: true,
			localRebasePlanStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
			localRebaseResultStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
			retrySubmitHandoffStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
			retrySubmitPrepared: true,
			clientBaseContent: '',
			refetchedServerContent: '',
		} );

		expect( notices[ 0 ] ).toMatchObject( {
			kind: DISTRIBUTED_EDITING_NOTICE_KINDS.STALE_BASE_REJECTED,
			retrySubmitHandoffStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
			retrySubmitPrepared: true,
			actionKeys: [
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFRESH_RETRY_SUBMIT_PROOF,
			],
		} );
	} );

	it( 'adds guarded retry-save preparation action after accepted proof', () => {
		const notices = getDistributedEditingNoticeDescriptorsForSessionState( {
			pendingChangeCount: 1,
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
			retrySubmitAccepted: true,
			retrySubmitSavePathRequired: true,
			canExportLocalUpdates: true,
		} );

		expect( notices[ 0 ] ).toMatchObject( {
			kind: DISTRIBUTED_EDITING_NOTICE_KINDS.PENDING_CHANGES,
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
			retrySubmitAccepted: true,
			retrySubmitSavePathRequired: true,
			retrySubmitSavePrepared: false,
			actionKeys: [
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.PREPARE_RETRY_SUBMIT_SAVE,
			],
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
