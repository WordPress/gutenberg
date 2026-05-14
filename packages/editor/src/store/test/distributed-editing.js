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
	DISTRIBUTED_EDITING_LOCAL_UPDATES_EXPORT_FORMAT,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES,
	DISTRIBUTED_EDITING_NOTICE_ACTIONS,
	DISTRIBUTED_EDITING_NOTICE_IDS,
	DISTRIBUTED_EDITING_NOTICE_KINDS,
	DISTRIBUTED_EDITING_REASON_CODES,
	DISTRIBUTED_EDITING_REVIEW_APPROVAL_PROOF_ENVELOPE_TYPE,
	DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES,
	DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES,
	DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS,
	DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_REASONS,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS,
	DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES,
	DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS,
	DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE,
	getDistributedEditingLocalUpdatesExportPayload,
	getDistributedEditingLocalUpdatesImportResult,
	getDistributedEditingAcceptedReviewApprovalProofForRetrySaveRequest,
	getDistributedEditingReviewedBlockItemsForRetrySaveReviewApprovalProof,
	getDistributedEditingRetrySaveFlowStateForSessionState,
	getDistributedEditingRetrySavePolicyForSessionState,
	getDistributedEditingRiskyBlockReviewStateForSessionState,
	getDistributedEditingSavePolicyStateForSessionState,
	getDistributedEditingStaleBaseLocalRebaseResult,
	getDistributedEditingSessionStateForKsesRiskyBlockReviewClassificationResult,
	getDistributedEditingSessionStateForRiskyBlockReviewItemResolution,
	getDistributedEditingSessionStateForStaleRiskyBlockReview,
	getDistributedEditingSessionStateForRetrySaveHandoff,
	getDistributedEditingSessionStateForRetrySaveRequest,
	getDistributedEditingSessionStateForRetrySaveReviewApprovalProofResult,
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
	hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState,
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
	getDistributedEditingRiskyBlockReviewState,
	getDistributedEditingRetrySaveFlowState,
	getDistributedEditingSavePolicyState,
	getDistributedEditingSessionDisposition,
	getDistributedEditingSessionReasonCode,
	getDistributedEditingSessionState,
	getDistributedEditingUnloadWarningState,
	hasPendingDistributedEditingChanges,
	hasDistributedEditingRetrySaveSavedStateEvidence,
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
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED
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
			retrySaveReviewStatus: null,
			retrySaveReviewAction: null,
			retrySaveReviewRequiredCapability: null,
			retrySaveReviewerCapability: null,
			retrySaveReviewScope: null,
			retrySaveEscalationReason: null,
			retrySaveRawContentIncluded: false,
			retrySaveReviewContractType: null,
			retrySaveRequiresReviewerEscalation: false,
			retrySaveReviewEscalationRequired: false,
			retrySaveReviewEscalationReason: null,
			retrySaveReviewRequiresUnfilteredHtml: false,
			retrySaveRequiresUnfilteredHtmlSaver: false,
			retrySaveReviewUnfilteredHtmlAllowed: false,
			retrySaveReviewAuthorshipRequired: false,
			retrySaveReviewContentCapabilityRequired: false,
			retrySaveReviewContentFilter: null,
			retrySaveReviewContentFilterContext: null,
			retrySaveReviewContentWouldChangeByKses: false,
			retrySaveReviewProposedContentWouldChangeByKses: false,
			retrySaveReviewCandidateContentWouldChangeByKses: false,
			retrySaveReviewProposedContentHash: null,
			retrySaveReviewFilteredProposedContentHash: null,
			retrySaveReviewCandidateContentHash: null,
			retrySaveReviewFilteredCandidateContentHash: null,
			retrySaveReviewRawContentIncluded: false,
			retrySaveReviewRecoveryActions: [],
			retrySaveReviewApprovalProofStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.NONE,
			retrySaveReviewApprovalProofReason: null,
			retrySaveReviewApprovalAccepted: false,
			retrySaveReviewApprovalPostId: null,
			retrySaveReviewApprovalPostType: null,
			retrySaveReviewApprovalReviewerUserId: null,
			retrySaveReviewApprovalLowPrivilegedSaverUserId: null,
			retrySaveReviewApprovalServerVersion: null,
			retrySaveReviewApprovalPreviousServerVersion: null,
			retrySaveReviewApprovalRebasedFromVersion: null,
			retrySaveReviewApprovalReviewStatus: null,
			retrySaveReviewApprovalApprovalStatus: null,
			retrySaveReviewApprovalReviewAction: null,
			retrySaveReviewApprovalApprovalAction: null,
			retrySaveReviewApprovalAction: null,
			retrySaveReviewApprovalRequiredCapability: null,
			retrySaveReviewApprovalReviewerCapability: null,
			retrySaveReviewApprovalScope: null,
			retrySaveReviewApprovalProposedContentHash: null,
			retrySaveReviewApprovalCandidateContentHash: null,
			retrySaveReviewApprovalCandidateContentHashScope: null,
			retrySaveReviewApprovalRequiresUnfilteredHtmlSaver: false,
			retrySaveReviewApprovalExpectedProposedContentHash: null,
			retrySaveReviewApprovalExpectedCandidateContentHash: null,
			retrySaveReviewApprovalHashMismatch: false,
			retrySaveReviewApprovalReviewedBlockItems: [],
			retrySaveReviewApprovalReviewedBlockItemCount: 0,
			retrySaveReviewApprovalBlockReviewStatus: null,
			retrySaveReviewApprovalUnapprovedBlockItemIds: [],
			retrySaveReviewApprovalMismatchedBlockItemFields: [],
			retrySaveReviewApprovalRawContentIncluded: false,
			retrySaveReviewApprovalProofSignature: null,
			retrySaveReviewApprovalIssuedAt: null,
			retrySaveReviewApprovalExpiresAt: null,
			retrySaveReviewApprovalSiteId: null,
			retrySaveReviewApprovalSiteUrl: null,
			retrySaveReviewApprovalSiteUuid: null,
			retrySaveReviewApprovalSavesPost: false,
			retrySaveReviewApprovalMutatesPostContent: false,
			retrySaveReviewApprovalCreatesRevision: false,
			retrySaveReviewApprovalClaimsSaved: false,
			localUpdatesImportStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.NONE,
			localUpdatesImportReason: null,
			localUpdatesImportPostId: null,
			localUpdatesImportPostType: null,
			localUpdatesImportHasPostContent: false,
			localUpdatesImportHasAcceptedReviewApprovalProof: false,
			localUpdatesImportVerifiedPostContentHash: null,
			riskyBlockReviewStatus:
				DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.NONE,
			riskyBlockReviewReasonCode: null,
			riskyBlockReviewItems: [],
			riskyBlockReviewItemCount: 0,
			riskyBlockReviewPendingCount: 0,
			riskyBlockReviewApprovedCount: 0,
			riskyBlockReviewRejectedCount: 0,
			riskyBlockReviewHasPendingItems: false,
			riskyBlockReviewPrePublishPanelRequired: false,
			riskyBlockReviewSaveButtonLabel: 'Update',
			riskyBlockReviewSaveClickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_SAVE,
			riskyBlockReviewCanExportLocalUpdates: false,
			riskyBlockReviewRequiresServerStateRefetch: false,
			riskyBlockReviewReviewedServerVersion: null,
			riskyBlockReviewCurrentServerVersion: null,
			riskyBlockReviewRawContentIncluded: false,
			riskyBlockReviewExposesRawContent: false,
			riskyBlockReviewDispatchesNotice: false,
			riskyBlockReviewMutatesEditorContent: false,
			riskyBlockReviewCallsNormalSavePost: false,
			riskyBlockReviewCallsRetrySaveEndpoint: false,
			riskyBlockReviewChangesPostLock: false,
			riskyBlockReviewClaimsSaved: false,
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

	it( 'strips refetched sync metadata and keeps its server version for local rebase', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
		const serverContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote beta</p><!-- /wp:paragraph -->';
		const localContent =
			'<!-- wp:paragraph --><p>Local alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
		const syncMeta =
			'<script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"server-v7","previous_version":"server-v6"}</script>';
		const refetchedState =
			getDistributedEditingSessionStateForStaleBaseServerStateRefetchResult(
				{
					modified_gmt: '2026-05-13T00:00:00',
					content: {
						raw: serverContent + syncMeta,
					},
				},
				getDistributedEditingSessionStateForStaleBaseRejectionResult( {
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					client_base_version: 'server-v4',
					server_version: 'server-v6',
					client_base_content: baseContent,
					pending_change_count: 2,
					remote_change_count: 1,
				} )
			);
		const planned =
			getDistributedEditingSessionStateForStaleBaseLocalRebasePlan(
				refetchedState
			);
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState: planned,
			localContent,
		} );

		expect( refetchedState ).toMatchObject( {
			serverVersion: 'server-v7',
			refetchedServerContent: serverContent,
			refetchedServerState: true,
			requiresServerStateRefetch: false,
			canAttemptLocalRebase: true,
		} );
		expect( planned.localRebasePlanStatus ).toBe(
			DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY
		);
		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
			readyToRetrySubmit: true,
			sessionState: {
				serverVersion: 'server-v7',
				refetchedServerContent: serverContent,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
			},
		} );
		expect( result.candidatePostContent ).toBe(
			'<!-- wp:paragraph --><p>Local alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote beta</p><!-- /wp:paragraph -->'
		);
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
				retrySaveReviewApprovalProofStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
				retrySaveReviewApprovalAccepted: true,
				retrySaveReviewApprovalProofSignature:
					'8888888888888888888888888888888888888888888888888888888888888888',
				retrySaveReviewApprovalIssuedAt: '1893456000',
				retrySaveReviewApprovalExpiresAt: '1893456300',
				retrySaveReviewApprovalSiteId: '1',
				retrySaveReviewApprovalSiteUrl: 'http://example.test',
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
			retrySaveReviewApprovalProofStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
			retrySaveReviewApprovalProofSignature:
				'8888888888888888888888888888888888888888888888888888888888888888',
			retrySaveReviewApprovalIssuedAt: '1893456000',
			retrySaveReviewApprovalExpiresAt: '1893456300',
			retrySaveReviewApprovalSiteUrl: 'http://example.test',
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
		} );
	} );

	it( 'captures explicit accepted review proof on guarded retry-save request state', () => {
		const saving = getDistributedEditingSessionStateForRetrySaveRequest(
			{
				serverVersion: '7',
				pendingChangeCount: 1,
				canExportLocalUpdates: true,
			},
			{
				pendingChangeCount: 1,
				acceptedReviewApprovalProof: {
					post_id: '44',
					post_type: 'post',
					proof_signature:
						'8888888888888888888888888888888888888888888888888888888888888888',
					issued_at: '1893456000',
					expires_at: '1893456300',
					site_id: '1',
					site_url: 'http://example.test',
				},
			}
		);

		expect( saving ).toMatchObject( {
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
			retrySaveReviewApprovalProofStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
			retrySaveReviewApprovalAccepted: true,
			retrySaveReviewApprovalPostId: '44',
			retrySaveReviewApprovalPostType: 'post',
			retrySaveReviewApprovalProofSignature:
				'8888888888888888888888888888888888888888888888888888888888888888',
			retrySaveReviewApprovalIssuedAt: '1893456000',
			retrySaveReviewApprovalExpiresAt: '1893456300',
			retrySaveReviewApprovalSiteId: '1',
			retrySaveReviewApprovalSiteUrl: 'http://example.test',
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

	it( 'keeps retry-save local changes protected when applied responses lack saved-state evidence', () => {
		const normalized = getDistributedEditingSessionStateForRetrySaveResult(
			{
				result: 'retry_save_applied',
				retry_save_accepted: true,
				previous_server_version: '7',
				server_version: '8',
				pending_change_count: 0,
				saves_post: true,
				mutates_post_content: true,
				creates_revision: true,
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
		const state = { distributedEditingSession: normalized };

		expect( normalized ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_MALFORMED_SYNC_PAYLOAD,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD,
			pendingChangeCount: 2,
			hasPendingChanges: true,
			isAwaitingServerConfirmation: true,
			retrySaveStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD,
			retrySaveReason:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD,
			retrySaveAccepted: false,
			retrySaveServerVersion: '8',
			retrySaveSavesPost: true,
			retrySaveMutatesPostContent: true,
			retrySaveClaimsSaved: false,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
		} );
		expect(
			hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState(
				normalized
			)
		).toBe( false );
		expect(
			hasDistributedEditingRetrySaveSavedStateEvidence( state )
		).toBe( false );
		expect(
			shouldWarnBeforeLeavingDistributedEditingSession( state )
		).toBe( true );
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

	it( 'normalizes retry-save unfiltered HTML review rejections as exportable manual review', () => {
		const rawContentToken = 'raw-review-content-must-not-leak';
		const proposedContentHash =
			'1111111111111111111111111111111111111111111111111111111111111111';
		const filteredProposedContentHash =
			'2222222222222222222222222222222222222222222222222222222222222222';
		const candidateContentHash =
			'3333333333333333333333333333333333333333333333333333333333333333';
		const filteredCandidateContentHash =
			'4444444444444444444444444444444444444444444444444444444444444444';
		const normalized = getDistributedEditingSessionStateForRetrySaveResult(
			{
				code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
				raw_content: rawContentToken,
				data: {
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
					detail: 'collaborative_unfiltered_html_review_required',
					pending_change_count: 2,
					server_version: '7',
					requires_unfiltered_html: true,
					unfiltered_html_allowed: false,
					authorship_review_required: true,
					content_capability_review_required: true,
					requires_reviewer_escalation: true,
					review_status: 'requires_reviewer_escalation',
					review_action: 'request_unfiltered_html_reviewer',
					review_required_capability: 'unfiltered_html',
					review_scope: 'collaborative_post_content',
					reviewer_capability: 'unfiltered_html',
					escalation_required: true,
					escalation_reason:
						'proposed_content_and_retry_save_candidate_would_change_by_kses',
					content_filter: 'wp_filter_post_kses',
					content_filter_context: 'content_save_pre',
					content_would_change_by_kses: true,
					proposed_content_hash: proposedContentHash,
					kses_filtered_proposed_content_hash:
						filteredProposedContentHash,
					candidate_content_hash: candidateContentHash,
					kses_filtered_candidate_content_hash:
						filteredCandidateContentHash,
					raw_content: rawContentToken,
					raw_content_included: false,
					review_contract: {
						status: 'requires_reviewer_escalation',
						type: 'unfiltered_html_content_capability_review',
						reviewer_capability: 'unfiltered_html',
						escalation_required: true,
						escalation_reason:
							'proposed_content_and_retry_save_candidate_would_change_by_kses',
						content_filter: 'wp_filter_post_kses',
						content_filter_context: 'content_save_pre',
						content_would_change_by_kses: true,
						proposed_content_would_change_by_kses: true,
						candidate_content_would_change_by_kses: true,
						proposed_content_hash: proposedContentHash,
						kses_filtered_proposed_content_hash:
							filteredProposedContentHash,
						candidate_content_hash: candidateContentHash,
						kses_filtered_candidate_content_hash:
							filteredCandidateContentHash,
						raw_content: rawContentToken,
						raw_content_included: false,
					},
					recovery_actions: [
						'export_local_updates',
						'request_unfiltered_html_reviewer',
						'refetch_server_state',
					],
					permission_contract: {
						unfiltered_html_allowed: false,
						unfiltered_html_review_required: true,
						authorship_review_required: true,
						content_capability_review_required: true,
						unfiltered_html_rejection_code:
							DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
						unfiltered_html_review_action:
							'request_unfiltered_html_reviewer',
						unfiltered_html_review_capability: 'unfiltered_html',
						unfiltered_html_review_scope:
							'collaborative_post_content',
					},
					saves_post: false,
					mutates_post_content: false,
					creates_revision: false,
					claims_saved: false,
				},
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
		const notices =
			getDistributedEditingNoticeDescriptorsForSessionState( normalized );
		const retrySaveDescriptor = notices.find(
			( descriptor ) =>
				descriptor.kind === DISTRIBUTED_EDITING_NOTICE_KINDS.RETRY_SAVE
		);
		const flow =
			getDistributedEditingRetrySaveFlowStateForSessionState(
				normalized
			);

		expect( normalized ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
			pendingChangeCount: 2,
			hasPendingChanges: true,
			isAwaitingServerConfirmation: true,
			requiresServerStateRefetch: true,
			requiresManualConflictResolution: true,
			retrySaveStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
			retrySaveReason:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
			retrySaveAccepted: false,
			retrySaveServerVersion: '7',
			retrySaveSavesPost: false,
			retrySaveMutatesPostContent: false,
			retrySaveClaimsSaved: false,
			retrySaveReviewStatus: 'requires_reviewer_escalation',
			retrySaveReviewAction: 'request_unfiltered_html_reviewer',
			retrySaveReviewRequiredCapability: 'unfiltered_html',
			retrySaveReviewerCapability: 'unfiltered_html',
			retrySaveReviewScope: 'collaborative_post_content',
			retrySaveEscalationReason:
				'proposed_content_and_retry_save_candidate_would_change_by_kses',
			retrySaveRawContentIncluded: false,
			retrySaveReviewContractType:
				'unfiltered_html_content_capability_review',
			retrySaveRequiresReviewerEscalation: true,
			retrySaveReviewEscalationRequired: true,
			retrySaveReviewEscalationReason:
				'proposed_content_and_retry_save_candidate_would_change_by_kses',
			retrySaveReviewRequiresUnfilteredHtml: true,
			retrySaveReviewUnfilteredHtmlAllowed: false,
			retrySaveReviewAuthorshipRequired: true,
			retrySaveReviewContentCapabilityRequired: true,
			retrySaveReviewContentFilter: 'wp_filter_post_kses',
			retrySaveReviewContentFilterContext: 'content_save_pre',
			retrySaveReviewContentWouldChangeByKses: true,
			retrySaveReviewProposedContentWouldChangeByKses: true,
			retrySaveReviewCandidateContentWouldChangeByKses: true,
			retrySaveReviewProposedContentHash: proposedContentHash,
			retrySaveReviewFilteredProposedContentHash:
				filteredProposedContentHash,
			retrySaveReviewCandidateContentHash: candidateContentHash,
			retrySaveReviewFilteredCandidateContentHash:
				filteredCandidateContentHash,
			retrySaveReviewRawContentIncluded: false,
			retrySaveReviewRecoveryActions: [
				'export_local_updates',
				'request_unfiltered_html_reviewer',
				'refetch_server_state',
			],
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
		} );
		expect( normalized ).not.toHaveProperty( 'raw_content' );
		expect( JSON.stringify( normalized ) ).not.toContain( rawContentToken );
		expect( retrySaveDescriptor ).toMatchObject( {
			retrySaveReviewStatus: 'requires_reviewer_escalation',
			retrySaveReviewAction: 'request_unfiltered_html_reviewer',
			retrySaveReviewRequiredCapability: 'unfiltered_html',
			retrySaveReviewerCapability: 'unfiltered_html',
			retrySaveReviewScope: 'collaborative_post_content',
			retrySaveReviewContractType:
				'unfiltered_html_content_capability_review',
			retrySaveRequiresReviewerEscalation: true,
			retrySaveReviewEscalationReason:
				'proposed_content_and_retry_save_candidate_would_change_by_kses',
			retrySaveReviewProposedContentHash: proposedContentHash,
			retrySaveReviewFilteredCandidateContentHash:
				filteredCandidateContentHash,
			retrySaveReviewRawContentIncluded: false,
			retrySaveReviewRecoveryActions: [
				'export_local_updates',
				'request_unfiltered_html_reviewer',
				'refetch_server_state',
			],
		} );
		expect( JSON.stringify( retrySaveDescriptor ) ).not.toContain(
			rawContentToken
		);
		expect( flow ).toMatchObject( {
			hasProtectedLocalChanges: true,
			requiresServerStateRefetch: true,
			requiresManualConflictResolution: true,
			canExportLocalUpdates: true,
			retrySaveStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
			retrySaveReason:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
			retrySaveReviewAction: 'request_unfiltered_html_reviewer',
			retrySaveReviewRequiredCapability: 'unfiltered_html',
			retrySaveReviewerCapability: 'unfiltered_html',
			retrySaveReviewEscalationReason:
				'proposed_content_and_retry_save_candidate_would_change_by_kses',
			retrySaveReviewRawContentIncluded: false,
		} );
		expect( JSON.stringify( flow ) ).not.toContain( rawContentToken );
		expect( notices ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					kind: DISTRIBUTED_EDITING_NOTICE_KINDS.RETRY_SAVE,
					status: 'warning',
					priority: 'blocking',
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
					retrySaveReason:
						DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
					retrySaveReviewRequired: true,
					retrySaveRequiresReviewerEscalation: true,
					retrySaveReviewStatus: 'requires_reviewer_escalation',
					retrySaveReviewAction: 'request_unfiltered_html_reviewer',
					retrySaveReviewRequiredCapability: 'unfiltered_html',
					retrySaveReviewerCapability: 'unfiltered_html',
					retrySaveReviewScope: 'collaborative_post_content',
					retrySaveEscalationReason:
						'proposed_content_and_retry_save_candidate_would_change_by_kses',
					retrySaveRawContentIncluded: false,
					actionKeys: [
						DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
						DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
					],
				} ),
			] )
		);
	} );

	it( 'normalizes accepted review proof that still needs an unfiltered HTML saver', () => {
		const proposedContentHash =
			'5555555555555555555555555555555555555555555555555555555555555555';
		const candidateContentHash =
			'6666666666666666666666666666666666666666666666666666666666666666';
		const reviewedBlockHash =
			'7777777777777777777777777777777777777777777777777777777777777777';
		const normalized = getDistributedEditingSessionStateForRetrySaveResult(
			{
				code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML,
				data: {
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML,
					detail: 'retry_save_review_approval_requires_unfiltered_html_saver',
					pending_change_count: 1,
					server_version: '12',
					review_approval_proof_accepted: true,
					review_approval_proof_consumed: false,
					accepted_review_approval_proof_available: true,
					reviewed_block_item_count: 1,
					requires_unfiltered_html: true,
					requires_unfiltered_html_saver: true,
					unfiltered_html_allowed: false,
					review_status: 'approved_by_unfiltered_html_reviewer',
					approval_status: 'approved_for_retry_save',
					review_action: 'request_unfiltered_html_reviewer',
					approval_action: 'retry_save_with_unfiltered_html_saver',
					review_required_capability: 'unfiltered_html',
					reviewer_capability: 'unfiltered_html',
					review_scope: 'collaborative_post_content',
					raw_content_included: false,
					can_export_local_updates: true,
					saves_post: false,
					mutates_post_content: false,
					creates_revision: false,
					claims_saved: false,
					accepted_review_approval_proof: {
						type: 'unfiltered_html_retry_save_review_approval',
						status: 'approved_by_unfiltered_html_reviewer',
						post_id: '43',
						post_type: 'post',
						reviewer_user_id: '1',
						low_privileged_saver_user_id: '7',
						reviewer_capability: 'unfiltered_html',
						review_scope: 'collaborative_post_content',
						review_status: 'approved_by_unfiltered_html_reviewer',
						approval_status: 'approved_for_retry_save',
						review_action: 'request_unfiltered_html_reviewer',
						approval_action:
							'retry_save_with_unfiltered_html_saver',
						review_required_capability: 'unfiltered_html',
						server_version: '12',
						rebased_from_version: '10',
						proposed_post_content_hash: proposedContentHash,
						reviewed_proposed_content_hash: proposedContentHash,
						candidate_post_content_hash: candidateContentHash,
						reviewed_candidate_content_hash: candidateContentHash,
						candidate_post_content_hash_scope:
							'low_privileged_saver_candidate',
						requires_unfiltered_html_saver: true,
						reviewed_block_items: [
							{
								id: 'risk-html-approved',
								block_name: 'core/html',
								change_kind: 'added_block',
								risk_reason: 'kses_would_remove_script',
								proposed_content_hash: reviewedBlockHash,
								reviewed_proposed_content_hash:
									reviewedBlockHash,
								review_status: 'approved_for_retry_save',
								review_evidence_type:
									'kses_block_hash_only_change',
								content_review_policy: 'kses',
								raw_content_included: false,
							},
						],
						reviewed_block_item_count: 1,
						block_review_status: 'approved_for_retry_save',
						proof_signature:
							'8888888888888888888888888888888888888888888888888888888888888888',
						issued_at: '1893456000',
						expires_at: '1893456300',
						site_id: '1',
						site_url: 'http://example.test',
						raw_content_included: false,
						saves_post: false,
						mutates_post_content: false,
						creates_revision: false,
						claims_saved: false,
					},
				},
			},
			{
				serverVersion: '12',
				pendingChangeCount: 1,
				hasPendingChanges: true,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
				retrySubmitAccepted: true,
				retrySubmitSavePathRequired: true,
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				retrySubmitSavePrepared: true,
				retrySubmitSaveReady: true,
			}
		);
		const notices =
			getDistributedEditingNoticeDescriptorsForSessionState( normalized );
		const retrySaveDescriptor = notices.find(
			( descriptor ) =>
				descriptor.kind === DISTRIBUTED_EDITING_NOTICE_KINDS.RETRY_SAVE
		);

		expect( normalized ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML,
			pendingChangeCount: 1,
			hasPendingChanges: true,
			isAwaitingServerConfirmation: true,
			requiresServerStateRefetch: false,
			requiresManualConflictResolution: false,
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
			retrySubmitAccepted: true,
			retrySubmitSavePathRequired: true,
			retrySubmitSaveStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
			retrySubmitSavePrepared: true,
			retrySubmitSaveReady: true,
			retrySaveStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_PERMISSION_DENIED,
			retrySaveReason:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML,
			retrySaveAccepted: false,
			retrySaveSavesPost: false,
			retrySaveMutatesPostContent: false,
			retrySaveClaimsSaved: false,
			retrySaveReviewStatus: 'approved_by_unfiltered_html_reviewer',
			retrySaveReviewAction: 'request_unfiltered_html_reviewer',
			retrySaveReviewRequiredCapability: 'unfiltered_html',
			retrySaveReviewerCapability: 'unfiltered_html',
			retrySaveReviewScope: 'collaborative_post_content',
			retrySaveReviewRequiresUnfilteredHtml: true,
			retrySaveRequiresUnfilteredHtmlSaver: true,
			retrySaveReviewUnfilteredHtmlAllowed: false,
			retrySaveReviewApprovalProofStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
			retrySaveReviewApprovalAccepted: true,
			retrySaveReviewApprovalPostId: '43',
			retrySaveReviewApprovalPostType: 'post',
			retrySaveReviewApprovalReviewerUserId: '1',
			retrySaveReviewApprovalLowPrivilegedSaverUserId: '7',
			retrySaveReviewApprovalRebasedFromVersion: '10',
			retrySaveReviewApprovalAction:
				'retry_save_with_unfiltered_html_saver',
			retrySaveReviewApprovalRequiredCapability: 'unfiltered_html',
			retrySaveReviewApprovalReviewerCapability: 'unfiltered_html',
			retrySaveReviewApprovalScope: 'collaborative_post_content',
			retrySaveReviewApprovalProposedContentHash: proposedContentHash,
			retrySaveReviewApprovalCandidateContentHash: candidateContentHash,
			retrySaveReviewApprovalCandidateContentHashScope:
				'low_privileged_saver_candidate',
			retrySaveReviewApprovalRequiresUnfilteredHtmlSaver: true,
			retrySaveReviewApprovalReviewedBlockItemCount: 1,
			retrySaveReviewApprovalBlockReviewStatus: 'approved_for_retry_save',
			retrySaveReviewApprovalRawContentIncluded: false,
			retrySaveReviewApprovalProofSignature:
				'8888888888888888888888888888888888888888888888888888888888888888',
			retrySaveReviewApprovalIssuedAt: '1893456000',
			retrySaveReviewApprovalExpiresAt: '1893456300',
			retrySaveReviewApprovalSiteId: '1',
			retrySaveReviewApprovalSiteUrl: 'http://example.test',
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
		} );
		expect( retrySaveDescriptor ).toMatchObject( {
			retrySaveStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_PERMISSION_DENIED,
			retrySaveRequiresUnfilteredHtmlSaver: true,
			retrySaveReviewApprovalAccepted: true,
			retrySaveReviewApprovalIssuedAt: '1893456000',
			retrySaveReviewApprovalExpiresAt: '1893456300',
			retrySaveReviewApprovalSiteId: '1',
			retrySaveReviewApprovalSiteUrl: 'http://example.test',
			retrySaveReviewApprovalReviewedBlockItemCount: 1,
			retrySaveReviewApprovalRequiresUnfilteredHtmlSaver: true,
			actionKeys: [
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
			],
		} );
		expect( JSON.stringify( normalized ) ).not.toContain( '<iframe' );
	} );

	it( 'preserves signed review proof lifetime fields when a continuation response omits them', () => {
		const normalized = getDistributedEditingSessionStateForRetrySaveResult(
			{
				code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML,
				data: {
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML,
					pending_change_count: 1,
					server_version: '12',
					review_approval_proof_accepted: true,
					accepted_review_approval_proof_available: true,
					accepted_review_approval_proof: {
						post_id: '43',
						post_type: 'post',
						proof_signature:
							'8888888888888888888888888888888888888888888888888888888888888888',
					},
				},
			},
			{
				serverVersion: '12',
				pendingChangeCount: 1,
				hasPendingChanges: true,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
				retrySubmitAccepted: true,
				retrySubmitSavePathRequired: true,
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				retrySubmitSavePrepared: true,
				retrySubmitSaveReady: true,
				retrySaveReviewApprovalProofStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
				retrySaveReviewApprovalAccepted: true,
				retrySaveReviewApprovalProofSignature:
					'8888888888888888888888888888888888888888888888888888888888888888',
				retrySaveReviewApprovalIssuedAt: '1893456000',
				retrySaveReviewApprovalExpiresAt: '1893456300',
				retrySaveReviewApprovalSiteId: '1',
				retrySaveReviewApprovalSiteUrl: 'http://example.test',
			}
		);

		expect( normalized ).toMatchObject( {
			retrySaveReviewApprovalProofStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
			retrySaveReviewApprovalProofSignature:
				'8888888888888888888888888888888888888888888888888888888888888888',
			retrySaveReviewApprovalIssuedAt: '1893456000',
			retrySaveReviewApprovalExpiresAt: '1893456300',
			retrySaveReviewApprovalSiteId: '1',
			retrySaveReviewApprovalSiteUrl: 'http://example.test',
		} );
	} );

	it( 'preserves explicit proof lifetime fields through retry-save saving state', () => {
		const proofSignature =
			'8888888888888888888888888888888888888888888888888888888888888888';
		const saving = getDistributedEditingSessionStateForRetrySaveRequest(
			{
				serverVersion: '12',
				clientBaseVersion: '10',
				pendingChangeCount: 1,
				hasPendingChanges: true,
			},
			{
				pendingChangeCount: 1,
				acceptedReviewApprovalProof: {
					post_id: '43',
					post_type: 'post',
					proof_signature: proofSignature,
					issued_at: 1893456000,
					expires_at: 1893456300,
					site_id: '1',
					site_url: 'http://example.test',
				},
			}
		);
		const normalized = getDistributedEditingSessionStateForRetrySaveResult(
			{
				code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML,
				data: {
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML,
					pending_change_count: 1,
					server_version: '12',
					review_approval_proof_accepted: true,
					accepted_review_approval_proof_available: true,
					accepted_review_approval_proof: {
						post_id: '43',
						post_type: 'post',
						proof_signature: proofSignature,
					},
				},
			},
			saving
		);

		expect( normalized ).toMatchObject( {
			retrySaveReviewApprovalProofStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
			retrySaveReviewApprovalProofSignature: proofSignature,
			retrySaveReviewApprovalIssuedAt: '1893456000',
			retrySaveReviewApprovalExpiresAt: '1893456300',
			retrySaveReviewApprovalSiteId: '1',
			retrySaveReviewApprovalSiteUrl: 'http://example.test',
		} );
	} );

	it( 'normalizes accepted retry-save review approval proof without saving', () => {
		const proposedContentHash = 'sha256:review-approval-proposed';
		const candidateContentHash = 'sha256:review-approval-candidate';
		const reviewedBlockHash = 'sha256:review-approval-risky-block';
		const normalized =
			getDistributedEditingSessionStateForRetrySaveReviewApprovalProofResult(
				{
					result: 'review_approval_accepted_for_retry_save',
					review_approval_accepted: true,
					server_version: '12',
					pending_change_count: 2,
					approval_action: 'retry_save_with_reviewer_approval',
					review_action: 'request_unfiltered_html_reviewer',
					review_required_capability: 'unfiltered_html',
					reviewer_capability: 'unfiltered_html',
					review_scope: 'collaborative_post_content',
					proposed_post_content_hash: proposedContentHash,
					candidate_post_content_hash: candidateContentHash,
					reviewed_block_item_count: 1,
					block_review_status: 'approved_for_retry_save',
					reviewed_block_items: [
						{
							id: 'risk-html-approve',
							block_client_id: 'server-block-0',
							block_name: 'core/html',
							block_label: 'HTML',
							block_path: [ 0 ],
							change_kind: 'added_block',
							risk_reason: 'kses_would_remove_script',
							proposed_content_hash: reviewedBlockHash,
							reviewed_proposed_content_hash: reviewedBlockHash,
							kses_filtered_content_hash:
								'sha256:review-approval-risky-block-filtered',
							review_status: 'approved_for_retry_save',
							review_evidence_type: 'kses_block_hash_only_change',
							content_review_policy: 'kses',
							raw_content_included: true,
						},
					],
					raw_content_included: false,
					saves_post: false,
					mutates_post_content: false,
					creates_revision: false,
					claims_saved: false,
				},
				{
					serverVersion: '12',
					pendingChangeCount: 2,
					hasPendingChanges: true,
					retrySaveReviewAction: 'request_unfiltered_html_reviewer',
					retrySaveReviewRequiredCapability: 'unfiltered_html',
					retrySaveReviewerCapability: 'unfiltered_html',
					retrySaveReviewScope: 'collaborative_post_content',
				}
			);

		expect( normalized ).toMatchObject( {
			disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
			reasonCode: null,
			pendingChangeCount: 2,
			hasPendingChanges: true,
			isAwaitingServerConfirmation: true,
			retrySaveReviewApprovalProofStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
			retrySaveReviewApprovalAccepted: true,
			retrySaveReviewApprovalServerVersion: '12',
			retrySaveReviewApprovalAction: 'retry_save_with_reviewer_approval',
			retrySaveReviewApprovalRequiredCapability: 'unfiltered_html',
			retrySaveReviewApprovalReviewerCapability: 'unfiltered_html',
			retrySaveReviewApprovalScope: 'collaborative_post_content',
			retrySaveReviewApprovalProposedContentHash: proposedContentHash,
			retrySaveReviewApprovalCandidateContentHash: candidateContentHash,
			retrySaveReviewApprovalReviewedBlockItemCount: 1,
			retrySaveReviewApprovalBlockReviewStatus: 'approved_for_retry_save',
			retrySaveReviewApprovalReviewedBlockItems: [
				expect.objectContaining( {
					id: 'risk-html-approve',
					blockClientId: 'server-block-0',
					proposedContentHash: reviewedBlockHash,
					reviewedProposedContentHash: reviewedBlockHash,
					reviewStatus: 'approved_for_retry_save',
					reviewEvidenceType: 'kses_block_hash_only_change',
					contentReviewPolicy: 'kses',
					rawContentIncluded: false,
					exposesRawContent: false,
				} ),
			],
			retrySaveReviewApprovalRawContentIncluded: false,
			retrySaveReviewApprovalSavesPost: false,
			retrySaveReviewApprovalMutatesPostContent: false,
			retrySaveReviewApprovalCreatesRevision: false,
			retrySaveReviewApprovalClaimsSaved: false,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
		} );
		expect( normalized.retrySaveStatus ).toBe(
			DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE
		);
		expect( JSON.stringify( normalized ) ).not.toContain(
			'raw-review-approval-content'
		);
	} );

	it( 'builds hash-only accepted review approval proof for retry-save requests', () => {
		const proposedContentHash =
			'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
		const candidateContentHash =
			'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
		const reviewedBlockHash =
			'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
		const proof =
			getDistributedEditingAcceptedReviewApprovalProofForRetrySaveRequest(
				{
					serverVersion: '12',
					retrySaveReviewApprovalProofStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
					retrySaveReviewApprovalAccepted: true,
					retrySaveReviewApprovalServerVersion: '12',
					retrySaveReviewApprovalPreviousServerVersion: '11',
					retrySaveReviewApprovalReviewerCapability:
						'unfiltered_html',
					retrySaveReviewApprovalScope: 'collaborative_post_content',
					retrySaveReviewApprovalIssuedAt: '1893456000',
					retrySaveReviewApprovalExpiresAt: '1893456300',
					retrySaveReviewApprovalSiteId: '1',
					retrySaveReviewApprovalSiteUrl: 'http://example.test',
					retrySaveReviewApprovalSiteUuid: 'de-rtc-site-uuid-example',
					retrySaveReviewApprovalProposedContentHash:
						proposedContentHash,
					retrySaveReviewApprovalCandidateContentHash:
						candidateContentHash,
					retrySaveReviewApprovalReviewedBlockItems: [
						{
							id: 'risk-html-approved',
							blockClientId: 'block-1',
							blockName: 'core/html',
							proposedContentHash: reviewedBlockHash,
							reviewedProposedContentHash: reviewedBlockHash,
							reviewStatus: 'approved_for_retry_save',
							rawContent: '<script>must not leave JS</script>',
							rawContentIncluded: true,
						},
						{
							id: 'risk-html-rejected',
							proposedContentHash:
								'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
							reviewStatus: 'rejected',
						},
					],
				}
			);

		expect( proof ).toMatchObject( {
			type: 'unfiltered_html_retry_save_review_approval',
			status: 'approved_by_unfiltered_html_reviewer',
			reviewerCapability: 'unfiltered_html',
			reviewScope: 'collaborative_post_content',
			serverVersion: '12',
			previousServerVersion: '11',
			clientBaseVersion: '12',
			acceptedProofServerVersion: '12',
			proposedPostContentHash: proposedContentHash,
			reviewedProposedContentHash: proposedContentHash,
			candidatePostContentHash: candidateContentHash,
			reviewedCandidateContentHash: candidateContentHash,
			reviewedBlockItemCount: 1,
			issuedAt: '1893456000',
			expiresAt: '1893456300',
			siteId: '1',
			siteUrl: 'http://example.test',
			siteUuid: 'de-rtc-site-uuid-example',
			rawContentIncluded: false,
			exposesRawContent: false,
			savesPost: false,
			mutatesPostContent: false,
			createsRevision: false,
			claimsSaved: false,
		} );
		expect( proof.reviewedBlockItems ).toEqual( [
			expect.objectContaining( {
				id: 'risk-html-approved',
				reviewStatus: 'approved_for_retry_save',
				rawContentIncluded: false,
				exposesRawContent: false,
			} ),
		] );
		expect( JSON.stringify( proof ) ).not.toContain( 'must not leave JS' );
	} );

	it( 'normalizes retry-save review approval rejections while preserving local changes', () => {
		const stale =
			getDistributedEditingSessionStateForRetrySaveReviewApprovalProofResult(
				{
					code: DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					data: {
						reason_code:
							DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
						server_version: '13',
						pending_change_count: 2,
						raw_content_included: false,
					},
				},
				{
					serverVersion: '12',
					pendingChangeCount: 2,
					hasPendingChanges: true,
				}
			);
		const permissionDenied =
			getDistributedEditingSessionStateForRetrySaveReviewApprovalProofResult(
				{
					code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML,
					data: {
						reason_code:
							DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML,
						pending_change_count: 2,
						raw_content_included: false,
					},
				},
				{
					serverVersion: '12',
					pendingChangeCount: 2,
					hasPendingChanges: true,
				}
			);
		const malformed =
			getDistributedEditingSessionStateForRetrySaveReviewApprovalProofResult(
				{
					code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD,
					data: {
						result: 'malformed_approval_payload',
						reason_code:
							DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD,
						pending_change_count: 2,
						unapproved_review_item_ids: [ 'risk-html-approve' ],
						raw_content_included: false,
					},
				},
				{
					serverVersion: '12',
					pendingChangeCount: 2,
					hasPendingChanges: true,
				}
			);

		expect( stale ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
			retrySaveReviewApprovalProofStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.STALE_BASE_REJECTED,
			requiresServerStateRefetch: true,
			canExportLocalUpdates: true,
			retrySaveReviewApprovalSavesPost: false,
			retrySaveReviewApprovalRawContentIncluded: false,
		} );
		expect( permissionDenied ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML,
			retrySaveReviewApprovalProofStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.REJECTED_PERMISSION_DENIED,
			canExportLocalUpdates: true,
			retrySaveReviewApprovalSavesPost: false,
			retrySaveReviewApprovalRawContentIncluded: false,
		} );
		expect( malformed ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_MALFORMED_SYNC_PAYLOAD,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD,
			retrySaveReviewApprovalProofStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD,
			retrySaveReviewApprovalUnapprovedBlockItemIds: [
				'risk-html-approve',
			],
			canExportLocalUpdates: true,
			retrySaveReviewApprovalSavesPost: false,
			retrySaveReviewApprovalRawContentIncluded: false,
		} );
	} );

	it( 'normalizes WordPress KSES risky block review classification into inert editor state', () => {
		const rawContentToken = 'turn-0061-raw-risky-html';
		const normalized =
			getDistributedEditingSessionStateForKsesRiskyBlockReviewClassificationResult(
				{
					result: 'block_review_required',
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
					post_id: 44,
					rest_base: 'posts',
					server_version: '21',
					client_base_version: '21',
					review_item_count: 1,
					pending_review_item_count: 1,
					pre_publish_review_required: true,
					save_action: 'open_pre_publish_review',
					raw_content: rawContentToken,
					raw_content_included: false,
					exposes_raw_content: false,
					saves_post: false,
					mutates_post_content: false,
					creates_revision: false,
					claims_saved: false,
					review_items: [
						{
							id: 'kses-review-turn-0061',
							block_client_id: 'server-block-0',
							block_name: 'core/html',
							block_label: 'HTML',
							block_path: [ 0 ],
							change_kind: 'modified_block',
							risk_reason: 'kses_would_remove_script',
							author_id: 17,
							base_version: '21',
							server_version: '21',
							base_content_hash:
								'1111111111111111111111111111111111111111111111111111111111111111',
							proposed_content_hash:
								'2222222222222222222222222222222222222222222222222222222222222222',
							kses_filtered_content_hash:
								'3333333333333333333333333333333333333333333333333333333333333333',
							review_status: 'pending_review',
							review_evidence_type: 'kses_block_hash_only_change',
							content_review_policy: 'kses',
							raw_content: rawContentToken,
							raw_content_included: false,
							exposes_raw_content: false,
						},
					],
				}
			);
		const selectorState = { distributedEditingSession: normalized };
		const reviewState =
			getDistributedEditingRiskyBlockReviewStateForSessionState(
				normalized
			);
		const savePolicy =
			getDistributedEditingSavePolicyStateForSessionState( normalized );

		expect( normalized ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
			clientBaseVersion: '21',
			serverVersion: '21',
			pendingChangeCount: 1,
			hasPendingChanges: true,
			isAwaitingServerConfirmation: true,
			requiresManualConflictResolution: true,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
			riskyBlockReviewStatus:
				DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
			riskyBlockReviewItemCount: 1,
			riskyBlockReviewPendingCount: 1,
			riskyBlockReviewPrePublishPanelRequired: true,
			riskyBlockReviewSaveButtonLabel: 'Review changes',
			riskyBlockReviewSaveClickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW,
			riskyBlockReviewRawContentIncluded: false,
			riskyBlockReviewExposesRawContent: false,
			riskyBlockReviewDispatchesNotice: false,
			riskyBlockReviewMutatesEditorContent: false,
			riskyBlockReviewCallsNormalSavePost: false,
			riskyBlockReviewCallsRetrySaveEndpoint: false,
			riskyBlockReviewChangesPostLock: false,
			riskyBlockReviewClaimsSaved: false,
		} );
		expect( reviewState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
			pendingReviewItemCount: 1,
			hasPendingReviewItems: true,
			prePublishPanelRequired: true,
			saveButtonLabel: 'Review changes',
			saveClickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW,
			canExportLocalUpdates: true,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			callsNormalSavePost: false,
			callsRetrySaveEndpoint: false,
			changesPostLock: false,
			claimsSaved: false,
			reviewItems: [
				expect.objectContaining( {
					id: 'kses-review-turn-0061',
					blockClientId: 'server-block-0',
					blockName: 'core/html',
					blockLabel: 'HTML',
					blockPath: [ 0 ],
					changeKind: 'modified_block',
					riskReason: 'kses_would_remove_script',
					authorId: 17,
					baseVersion: '21',
					serverVersion: '21',
					reviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW,
					reviewEvidenceType: 'kses_block_hash_only_change',
					contentReviewPolicy: 'kses',
					rawContentIncluded: false,
					exposesRawContent: false,
					annotation: {
						visualTreatment: 'blue_warning_marker_with_focus_wash',
						hasWarningMarker: true,
						hasSubtleBlueWash: true,
						washActivation:
							'selected_focused_hovered_or_review_target',
						hasAccessibleLabel: true,
						hasListViewParity: true,
						reliesOnColorAlone: false,
					},
				} ),
			],
		} );
		expect( savePolicy ).toEqual( {
			status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.REVIEW_REQUIRED,
			reason: 'risky_block_review_required',
			saveButtonLabel: 'Review changes',
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW,
			blocksNormalSavePost: true,
			opensPrePublishReview: true,
			requiresServerStateRefetch: false,
			reviewItemCount: 1,
			pendingReviewItemCount: 1,
			approvedReviewItemCount: 0,
			rejectedReviewItemCount: 0,
			savesPost: false,
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect(
			getDistributedEditingRiskyBlockReviewState( selectorState )
		).toEqual( reviewState );
		expect( getDistributedEditingSavePolicyState( selectorState ) ).toEqual(
			savePolicy
		);
		expect( JSON.stringify( normalized ) ).not.toContain( rawContentToken );
		expect( JSON.stringify( reviewState ) ).not.toContain(
			rawContentToken
		);
		expect( JSON.stringify( savePolicy ) ).not.toContain( rawContentToken );
	} );

	it( 'keeps privileged KSES block classifications on the normal save policy', () => {
		const normalized =
			getDistributedEditingSessionStateForKsesRiskyBlockReviewClassificationResult(
				{
					result: 'no_review_required',
					reason_code: null,
					user_can_unfiltered_html: true,
					server_version: '22',
					client_base_version: '22',
					review_items: [],
					review_item_count: 0,
					pending_review_item_count: 0,
					pre_publish_review_required: false,
					save_action: 'continue_save',
					raw_content_included: false,
				}
			);
		const reviewState =
			getDistributedEditingRiskyBlockReviewStateForSessionState(
				normalized
			);
		const savePolicy =
			getDistributedEditingSavePolicyStateForSessionState( normalized );

		expect( normalized ).toMatchObject( {
			disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
			reasonCode: null,
			hasPendingChanges: false,
			isAwaitingServerConfirmation: false,
			riskyBlockReviewStatus:
				DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.NO_REVIEW_REQUIRED,
			riskyBlockReviewItemCount: 0,
			riskyBlockReviewPendingCount: 0,
			riskyBlockReviewPrePublishPanelRequired: false,
			riskyBlockReviewCanExportLocalUpdates: false,
		} );
		expect( reviewState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.NO_REVIEW_REQUIRED,
			reviewItems: [],
			hasPendingReviewItems: false,
			prePublishPanelRequired: false,
		} );
		expect( savePolicy ).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.UPDATE_READY,
			clickAction: DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_SAVE,
			blocksNormalSavePost: false,
			opensPrePublishReview: false,
		} );
	} );

	it( 'records risky block review resolution and stale-after-review without save side effects', () => {
		const initial =
			getDistributedEditingSessionStateForKsesRiskyBlockReviewClassificationResult(
				{
					result: 'block_review_required',
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
					server_version: '30',
					client_base_version: '30',
					review_item_count: 2,
					pending_review_item_count: 2,
					pre_publish_review_required: true,
					review_items: [
						{
							id: 'risk-added',
							block_client_id: 'server-block-0',
							block_name: 'core/html',
							block_label: 'HTML',
							block_path: [ 0 ],
							change_kind: 'added_block',
							risk_reason: 'kses_would_remove_script',
							base_content_hash:
								'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
							proposed_content_hash:
								'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
							kses_filtered_content_hash:
								'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
							review_status: 'pending_review',
						},
						{
							id: 'risk-deleted',
							block_client_id: 'server-block-1',
							block_name: 'core/html',
							block_label: 'HTML',
							block_path: [ 1 ],
							change_kind: 'deleted_block',
							risk_reason: 'unfiltered_html_block_deleted',
							base_content_hash:
								'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
							proposed_content_hash:
								'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
							kses_filtered_content_hash:
								'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
							review_status: 'pending_review',
						},
					],
				}
			);
		const approved =
			getDistributedEditingSessionStateForRiskyBlockReviewItemResolution(
				initial,
				{
					reviewItemId: 'risk-added',
					decision: 'approved',
					reviewerId: 1,
					approvalProofHash: 'sha256:risk-added:approval-proof',
				}
			);
		const resolved =
			getDistributedEditingSessionStateForRiskyBlockReviewItemResolution(
				approved,
				{
					reviewItemId: 'risk-deleted',
					decision: 'rejected',
					reviewerId: 1,
					rejectionReason: 'reviewer_rejected',
				}
			);
		const stale = getDistributedEditingSessionStateForStaleRiskyBlockReview(
			resolved,
			{
				reviewedServerVersion: '30',
				currentServerVersion: '31',
			}
		);
		const resolvedReviewState =
			getDistributedEditingRiskyBlockReviewStateForSessionState(
				resolved
			);
		const resolvedSavePolicy =
			getDistributedEditingSavePolicyStateForSessionState( resolved );
		const staleReviewState =
			getDistributedEditingRiskyBlockReviewStateForSessionState( stale );
		const staleSavePolicy =
			getDistributedEditingSavePolicyStateForSessionState( stale );
		const reviewedBlockItems =
			getDistributedEditingReviewedBlockItemsForRetrySaveReviewApprovalProof(
				resolved
			);

		expect( resolvedReviewState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_RESOLVED,
			pendingReviewItemCount: 0,
			approvedReviewItemCount: 1,
			rejectedReviewItemCount: 1,
			hasPendingReviewItems: false,
			prePublishPanelRequired: false,
			saveClickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
			canExportLocalUpdates: true,
			reviewItems: [
				expect.objectContaining( {
					id: 'risk-added',
					reviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE,
					reviewerId: 1,
					approvalProofHash: 'sha256:risk-added:approval-proof',
					rawContentIncluded: false,
				} ),
				expect.objectContaining( {
					id: 'risk-deleted',
					reviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED,
					reviewerId: 1,
					rejectionReason: 'reviewer_rejected',
					rawContentIncluded: false,
				} ),
			],
		} );
		expect( resolvedSavePolicy ).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.READY_FOR_REVIEWED_RETRY_SAVE,
			saveButtonLabel: 'Submit reviewed changes',
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
			blocksNormalSavePost: true,
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
			claimsSaved: false,
		} );
		expect( reviewedBlockItems ).toEqual( [
			expect.objectContaining( {
				id: 'risk-added',
				blockClientId: 'server-block-0',
				proposedContentHash:
					'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
				reviewedProposedContentHash:
					'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
				ksesFilteredContentHash:
					'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
				reviewStatus:
					DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE,
				reviewEvidenceType: 'kses_block_hash_only_change',
				contentReviewPolicy: 'kses',
				rawContentIncluded: false,
				exposesRawContent: false,
			} ),
		] );
		expect( JSON.stringify( reviewedBlockItems ) ).not.toContain(
			'raw-risky-html'
		);
		expect( staleReviewState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.STALE_AFTER_REVIEW,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
			pendingReviewItemCount: 0,
			requiresServerStateRefetch: true,
			reviewedServerVersion: '30',
			currentServerVersion: '31',
			saveClickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.REFETCH_SERVER_STATE,
			canExportLocalUpdates: true,
		} );
		expect( staleReviewState.reviewItems ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					reviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.STALE_AFTER_REVIEW,
				} ),
			] )
		);
		expect( staleSavePolicy ).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.REFETCH_REQUIRED,
			reason: 'risky_block_review_stale',
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.REFETCH_SERVER_STATE,
			blocksNormalSavePost: true,
			requiresServerStateRefetch: true,
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
			claimsSaved: false,
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
			hasRetrySaveSavedStateEvidence: false,
			hasPostRoute: true,
			hasProposedPostContent: true,
			hasVersionProof: true,
			hasAcceptedReviewApprovalProof: false,
			acceptedReviewApprovalReviewedBlockItemCount: 0,
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

	it( 'keeps stale-again proof blocked for server refetch during human save policy', () => {
		const staleAgainState =
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
					pendingChangeCount: 1,
					retrySubmitHandoffStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
					retrySubmitPrepared: true,
					canExportLocalUpdates: true,
				}
			);
		const policy = getDistributedEditingRetrySavePolicyForSessionState(
			staleAgainState,
			{
				postId: 44,
				restBase: 'posts',
				proposedPostContent:
					'<!-- wp:paragraph --><p>Locally rebased.</p><!-- /wp:paragraph -->',
			}
		);
		const handoffState =
			getDistributedEditingSessionStateForRetrySaveHandoff(
				staleAgainState,
				{
					status: DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
					reason: policy.reason,
					policy,
				}
			);
		const state = { distributedEditingSession: handoffState };

		expect( staleAgainState ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
			requiresServerStateRefetch: true,
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.STALE_BASE_REJECTED,
			retrySubmitAccepted: false,
			retrySubmitSavePathRequired: false,
			canExportLocalUpdates: true,
		} );
		expect( policy ).toMatchObject( {
			status: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_STATUSES.BLOCKED,
			reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
			canRetrySave: false,
			shouldCallRetrySaveEndpoint: false,
			shouldCallNormalSavePost: false,
			protectsLocalChanges: true,
			canExportLocalUpdates: true,
			requiresServerStateRefetch: true,
			hasAcceptedProof: false,
			hasPreparedSavePath: false,
			request: null,
		} );
		expect( requiresDistributedEditingServerStateAcceptance( state ) ).toBe(
			false
		);
		expect( hasPendingDistributedEditingChanges( state ) ).toBe( true );
		expect( canExportDistributedEditingLocalUpdates( state ) ).toBe( true );
		expect( getDistributedEditingNoticeDescriptors( state ) ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					kind: DISTRIBUTED_EDITING_NOTICE_KINDS.STALE_BASE_REJECTED,
					actionKeys: expect.arrayContaining( [
						DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
						DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
					] ),
				} ),
				expect.objectContaining( {
					kind: DISTRIBUTED_EDITING_NOTICE_KINDS.RETRY_SAVE,
					retrySaveHandoffStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
					retrySaveHandoffReason:
						DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
					actionKeys: expect.arrayContaining( [
						DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
						DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
					] ),
				} ),
			] )
		);
	} );

	it( 'keeps retry-save-in-progress blocked and exportable during human save policy', () => {
		const savingState =
			getDistributedEditingSessionStateForRetrySaveRequest(
				{
					clientBaseVersion: '4',
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
				},
				{ pendingChangeCount: 2 }
			);
		const policy = getDistributedEditingRetrySavePolicyForSessionState(
			savingState,
			{
				postId: 44,
				restBase: 'posts',
				proposedPostContent:
					'<!-- wp:paragraph --><p>Rebased save.</p><!-- /wp:paragraph -->',
			}
		);
		const handoffState =
			getDistributedEditingSessionStateForRetrySaveHandoff( savingState, {
				status: DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
				reason: policy.reason,
				policy,
			} );
		const state = { distributedEditingSession: handoffState };

		expect( policy ).toMatchObject( {
			status: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_STATUSES.BLOCKED,
			reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS,
			canRetrySave: false,
			shouldCallRetrySaveEndpoint: false,
			shouldCallNormalSavePost: false,
			protectsLocalChanges: true,
			canExportLocalUpdates: true,
			requiresServerStateRefetch: false,
			request: null,
		} );
		expect( hasPendingDistributedEditingChanges( state ) ).toBe( true );
		expect( isAwaitingDistributedEditingServerConfirmation( state ) ).toBe(
			true
		);
		expect( canExportDistributedEditingLocalUpdates( state ) ).toBe( true );
		expect(
			shouldWarnBeforeLeavingDistributedEditingSession( state )
		).toBe( true );
		expect( getDistributedEditingNoticeDescriptors( state ) ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					kind: DISTRIBUTED_EDITING_NOTICE_KINDS.RETRY_SAVE,
					status: 'warning',
					priority: 'blocking',
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
					retrySaveHandoffReason:
						DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS,
					actionKeys: [
						DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
					],
				} ),
			] )
		);
	} );

	it( 'classifies already-confirmed retry-save before no-pending human save policy fallback', () => {
		const savedState = getDistributedEditingSessionStateForRetrySaveResult(
			{
				result: 'retry_save_applied',
				retry_save_accepted: true,
				previous_server_version: '7',
				server_version: '8',
				pending_change_count: 1,
				saves_post: true,
				mutates_post_content: true,
				creates_revision: true,
				claims_saved: true,
			},
			{
				clientBaseVersion: '4',
				serverVersion: '7',
				pendingChangeCount: 1,
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
		const policy = getDistributedEditingRetrySavePolicyForSessionState(
			savedState,
			{
				postId: 44,
				restBase: 'posts',
				proposedPostContent:
					'<!-- wp:paragraph --><p>Already saved.</p><!-- /wp:paragraph -->',
			}
		);
		const state = { distributedEditingSession: savedState };

		expect( savedState ).toMatchObject( {
			disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
			pendingChangeCount: 0,
			hasPendingChanges: false,
			isAwaitingServerConfirmation: false,
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
			retrySaveAccepted: true,
			retrySaveServerVersion: '8',
			retrySavePreviousServerVersion: '7',
			canExportLocalUpdates: false,
		} );
		expect( policy ).toMatchObject( {
			status: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_STATUSES.BLOCKED,
			reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_ALREADY_CONFIRMED,
			canRetrySave: false,
			shouldCallRetrySaveEndpoint: false,
			shouldCallNormalSavePost: false,
			claimsSaved: true,
			protectsLocalChanges: false,
			canExportLocalUpdates: false,
			requiresServerStateRefetch: false,
			hasRetrySaveSavedStateEvidence: true,
			request: null,
		} );
		expect( hasPendingDistributedEditingChanges( state ) ).toBe( false );
		expect( canExportDistributedEditingLocalUpdates( state ) ).toBe(
			false
		);
		expect(
			shouldWarnBeforeLeavingDistributedEditingSession( state )
		).toBe( false );
		expect( getDistributedEditingNoticeDescriptors( state ) ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					kind: DISTRIBUTED_EDITING_NOTICE_KINDS.RETRY_SAVE,
					status: 'success',
					priority: 'status',
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
					retrySaveAccepted: true,
					actionKeys: [],
				} ),
			] )
		);
	} );

	it( 'summarizes board-demo retry-save flow progress without exposing raw content', () => {
		const baseRawToken = 'alpha-raw-turn-0051';
		const serverRawToken = 'bravo-raw-turn-0051';
		const localRawToken = 'charlie-raw-turn-0051';
		const baseContent = `<!-- wp:paragraph --><p>${ baseRawToken }</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>unchanged second</p><!-- /wp:paragraph -->`;
		const serverContent = `<!-- wp:paragraph --><p>${ baseRawToken }</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>${ serverRawToken }</p><!-- /wp:paragraph -->`;
		const localContent = `<!-- wp:paragraph --><p>${ localRawToken }</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>unchanged second</p><!-- /wp:paragraph -->`;
		const refetchedState =
			getDistributedEditingSessionStateForStaleBaseServerStateRefetchResult(
				{
					distributed_editing: {
						server_version: '8',
					},
					content: {
						raw: serverContent,
					},
				},
				getDistributedEditingSessionStateForStaleBaseRejectionResult( {
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					client_base_version: '4',
					server_version: '7',
					client_base_content: baseContent,
					pending_change_count: 1,
					remote_change_count: 1,
				} )
			);
		const rebaseResult = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState:
				getDistributedEditingSessionStateForStaleBaseLocalRebasePlan(
					refetchedState
				),
			localContent,
		} );
		const retrySubmitHandoffState =
			getDistributedEditingSessionStateForRetrySubmitHandoff(
				rebaseResult.sessionState
			);
		const acceptedProofState =
			getDistributedEditingSessionStateForRetrySubmitProofResult(
				{
					result: 'retry_submit_accepted_for_future_save',
					retry_submit_accepted: true,
					pending_change_count: 1,
					saves_post: false,
					mutates_post_content: false,
					creates_revision: false,
					claims_saved: false,
				},
				retrySubmitHandoffState
			);
		const preparedState =
			getDistributedEditingSessionStateForRetrySubmitSavePreparation(
				acceptedProofState
			);
		const preparedFlow =
			getDistributedEditingRetrySaveFlowStateForSessionState(
				preparedState
			);
		const savedState = getDistributedEditingSessionStateForRetrySaveResult(
			{
				result: 'retry_save_applied',
				retry_save_accepted: true,
				previous_server_version: '8',
				server_version: '9',
				pending_change_count: 1,
				saves_post: true,
				mutates_post_content: true,
				creates_revision: true,
				claims_saved: true,
				revision_created: true,
				created_revision_ids: [ 9001 ],
			},
			preparedState
		);
		const savedFlow =
			getDistributedEditingRetrySaveFlowStateForSessionState(
				savedState
			);
		const savedSelectorState = { distributedEditingSession: savedState };

		expect( preparedFlow ).toMatchObject( {
			hasProtectedLocalChanges: true,
			hasServerRefetchEvidence: true,
			hasLocalRebaseEvidence: true,
			hasRetrySubmitHandoff: true,
			hasAcceptedRetrySubmitProof: true,
			hasRetrySavePreparation: true,
			hasRetrySaveSavedStateEvidence: false,
			canClaimSaved: false,
			claimsSaved: false,
			requiresServerStateRefetch: false,
			requiresManualConflictResolution: false,
			canExportLocalUpdates: true,
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
		} );
		expect( preparedFlow ).not.toHaveProperty( 'clientBaseContent' );
		expect( preparedFlow ).not.toHaveProperty( 'refetchedServerContent' );
		expect( JSON.stringify( preparedFlow ) ).not.toContain( baseRawToken );
		expect( JSON.stringify( preparedFlow ) ).not.toContain(
			serverRawToken
		);
		expect( JSON.stringify( preparedFlow ) ).not.toContain( localRawToken );
		expect(
			hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState(
				preparedState
			)
		).toBe( false );
		expect( savedFlow ).toMatchObject( {
			hasProtectedLocalChanges: false,
			hasRetrySaveSavedStateEvidence: true,
			canClaimSaved: true,
			claimsSaved: true,
			canExportLocalUpdates: false,
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
			retrySaveServerVersion: '9',
			retrySavePreviousServerVersion: '8',
			retrySaveRevisionCreated: true,
			retrySaveCreatedRevisionIds: [ 9001 ],
		} );
		expect(
			getDistributedEditingRetrySaveFlowState( savedSelectorState )
		).toEqual( savedFlow );
		expect(
			hasDistributedEditingRetrySaveSavedStateEvidence(
				savedSelectorState
			)
		).toBe( true );
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
				{
					...readySessionState,
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				},
				readyContext,
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_MISSING_SAVED_STATE_EVIDENCE,
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

	it( 'builds a local-updates export payload from blocked retry-save refetch state', () => {
		const clientBaseContent =
			'<!-- wp:paragraph --><p>Base</p><!-- /wp:paragraph -->';
		const refetchedServerContent =
			'<!-- wp:paragraph --><p>Server</p><!-- /wp:paragraph -->';
		const editedPostContent =
			'<!-- wp:paragraph --><p>Local</p><!-- /wp:paragraph -->';
		const blockedState =
			getDistributedEditingSessionStateForRetrySaveHandoff(
				getDistributedEditingSessionStateForStaleBaseRejectionResult( {
					reason_code:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					client_base_version: 'server-v4',
					server_version: 'server-v7',
					client_base_content: clientBaseContent,
					pending_change_count: 2,
					remote_change_count: 1,
				} ),
				{
					status: DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
					reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
					policy: {
						protectsLocalChanges: true,
						requiresServerStateRefetch: true,
					},
				}
			);
		const refetchedState =
			getDistributedEditingSessionStateForStaleBaseServerStateRefetchResult(
				{
					distributed_editing: {
						server_version: 'server-v8',
					},
					content: {
						raw: refetchedServerContent,
					},
				},
				blockedState
			);
		const payload = getDistributedEditingLocalUpdatesExportPayload( {
			currentPost: {
				id: 44,
				type: 'post',
				title: 'Ignored outside export payload',
			},
			editedPostContent,
			sessionState: refetchedState,
		} );

		expect( Object.keys( payload ) ).toEqual( [
			'version',
			'format',
			'post',
			'postContent',
			'pendingChangeCount',
			'acceptedReviewApprovalProof',
		] );
		expect( payload ).toMatchObject( {
			version: 1,
			format: DISTRIBUTED_EDITING_LOCAL_UPDATES_EXPORT_FORMAT,
			post: {
				id: 44,
				type: 'post',
			},
			postContent: editedPostContent,
			pendingChangeCount: 2,
			acceptedReviewApprovalProof: null,
		} );
		expect( Object.keys( payload.post ) ).toEqual( [ 'id', 'type' ] );
		expect( payload.distributedEditingSessionState ).toBeUndefined();
		expect( JSON.stringify( payload ) ).not.toContain( clientBaseContent );
		expect( JSON.stringify( payload ) ).not.toContain(
			refetchedServerContent
		);
	} );

	it( 'imports a signed local-updates payload into retry-save-ready state', () => {
		const postContent =
			'<!-- wp:html --><script>approved</script><!-- /wp:html -->';
		const proposedPostContentHash =
			'7e479a6c51c9e8167f1542af0c730ae0009236c4936876ebbf85bcd7c3ab7dd0';
		const candidatePostContentHash =
			'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
		const proofSignature =
			'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
		const payload = getDistributedEditingLocalUpdatesExportPayload( {
			currentPost: {
				id: 44,
				type: 'post',
			},
			editedPostContent: postContent,
			sessionState: {
				serverVersion: '12',
				clientBaseVersion: '7',
				pendingChangeCount: 1,
				retrySaveReviewApprovalProofStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
				retrySaveReviewApprovalAccepted: true,
				retrySaveReviewApprovalPostId: '44',
				retrySaveReviewApprovalPostType: 'post',
				retrySaveReviewApprovalReviewerUserId: '1',
				retrySaveReviewApprovalLowPrivilegedSaverUserId: '2',
				retrySaveReviewApprovalServerVersion: '12',
				retrySaveReviewApprovalPreviousServerVersion: '11',
				retrySaveReviewApprovalRebasedFromVersion: '7',
				retrySaveReviewApprovalReviewerCapability: 'unfiltered_html',
				retrySaveReviewApprovalScope: 'collaborative_post_content',
				retrySaveReviewApprovalProposedContentHash:
					proposedPostContentHash,
				retrySaveReviewApprovalCandidateContentHash:
					candidatePostContentHash,
				retrySaveReviewApprovalCandidateContentHashScope:
					'low_privileged_saver_candidate',
				retrySaveReviewApprovalRequiresUnfilteredHtmlSaver: true,
				retrySaveReviewApprovalProofSignature: proofSignature,
				retrySaveReviewApprovalIssuedAt: '1893456000',
				retrySaveReviewApprovalExpiresAt: '1893456300',
				retrySaveReviewApprovalSiteUrl: 'http://example.test',
				retrySaveReviewApprovalReviewedBlockItems: [
					{
						id: 'risk-html-approved',
						proposedContentHash: proposedPostContentHash,
						reviewedProposedContentHash: proposedPostContentHash,
						reviewStatus: 'approved_for_retry_save',
						rawContent: '<script>not exported in proof</script>',
						rawContentIncluded: true,
					},
				],
			},
		} );
		expect( payload.distributedEditingSessionState ).toBeUndefined();
		expect( payload.pendingChangeCount ).toBe( 1 );
		expect( payload.acceptedReviewApprovalProof ).toMatchObject( {
			proof_envelope_type:
				DISTRIBUTED_EDITING_REVIEW_APPROVAL_PROOF_ENVELOPE_TYPE,
			proof: {
				postId: '44',
				postType: 'post',
				serverVersion: '12',
				rebasedFromVersion: '7',
				proofSignature,
				rawContentIncluded: false,
				exposesRawContent: false,
			},
		} );
		expect(
			JSON.stringify( payload.acceptedReviewApprovalProof )
		).not.toContain( '<script>' );
		const result = getDistributedEditingLocalUpdatesImportResult( {
			payload,
			currentPost: {
				id: 44,
				type: 'post',
			},
			computedPostContentHash: proposedPostContentHash,
			now: 1893456100,
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.IMPORTED_FOR_RETRY_SAVE,
			reason: null,
			postContent,
			hasPostContent: true,
			hasAcceptedReviewApprovalProof: true,
			computedPostContentHash: proposedPostContentHash,
			mutatesEditorContent: true,
			callsRetrySaveEndpoint: false,
			callsNormalSavePost: false,
			dispatchesNotice: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( result.acceptedReviewApprovalProof ).toMatchObject( {
			postId: '44',
			postType: 'post',
			serverVersion: '12',
			rebasedFromVersion: '7',
			proofSignature,
			issuedAt: '1893456000',
			expiresAt: '1893456300',
			siteUrl: 'http://example.test',
			rawContentIncluded: false,
			savesPost: false,
			mutatesPostContent: false,
			createsRevision: false,
			claimsSaved: false,
		} );
		expect(
			JSON.stringify( result.acceptedReviewApprovalProof )
		).not.toContain( '<script>' );
		expect( result.sessionState ).toMatchObject( {
			localUpdatesImportStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.IMPORTED_FOR_RETRY_SAVE,
			localUpdatesImportReason: null,
			localUpdatesImportHasPostContent: true,
			localUpdatesImportHasAcceptedReviewApprovalProof: true,
			localUpdatesImportVerifiedPostContentHash: proposedPostContentHash,
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
			retrySubmitAccepted: true,
			retrySubmitSavePathRequired: true,
			retrySubmitSaveStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
			retrySubmitSaveReady: true,
			retrySubmitSavesPost: false,
			retrySubmitMutatesPostContent: false,
			retrySubmitCreatesRevision: false,
			retrySubmitClaimsSaved: false,
			serverVersion: '12',
			clientBaseVersion: '7',
			hasPendingChanges: true,
			canExportLocalUpdates: true,
			mustOfferLocalCopy: true,
		} );

		expect(
			getDistributedEditingRetrySavePolicyForSessionState(
				result.sessionState,
				{
					postId: 44,
					restBase: 'posts',
					proposedPostContent: postContent,
				}
			)
		).toMatchObject( {
			status: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_STATUSES.READY,
			canRetrySave: true,
			hasAcceptedReviewApprovalProof: true,
			request: {
				postId: 44,
				restBase: 'posts',
				clientBaseVersion: '12',
				acceptedProofServerVersion: '12',
				rebasedFromVersion: '7',
			},
		} );

		expect(
			getDistributedEditingLocalUpdatesImportResult( {
				payload: {
					...payload,
					acceptedReviewApprovalProof:
						payload.acceptedReviewApprovalProof.proof,
				},
				currentPost: {
					id: 44,
					type: 'post',
				},
				computedPostContentHash: proposedPostContentHash,
				now: 1893456100,
			} )
		).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.IMPORTED_FOR_RETRY_SAVE,
			hasAcceptedReviewApprovalProof: true,
			acceptedReviewApprovalProof: {
				postId: '44',
				postType: 'post',
				proofSignature,
			},
		} );
	} );

	it( 'blocks local-updates import for route, proof, hash, and expiry failures', () => {
		const postContent =
			'<!-- wp:html --><script>approved</script><!-- /wp:html -->';
		const proposedPostContentHash =
			'7e479a6c51c9e8167f1542af0c730ae0009236c4936876ebbf85bcd7c3ab7dd0';
		const validPayload = getDistributedEditingLocalUpdatesExportPayload( {
			currentPost: {
				id: 44,
				type: 'post',
			},
			editedPostContent: postContent,
			sessionState: {
				serverVersion: '12',
				clientBaseVersion: '7',
				retrySaveReviewApprovalProofStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
				retrySaveReviewApprovalAccepted: true,
				retrySaveReviewApprovalPostId: '44',
				retrySaveReviewApprovalPostType: 'post',
				retrySaveReviewApprovalServerVersion: '12',
				retrySaveReviewApprovalRebasedFromVersion: '7',
				retrySaveReviewApprovalProposedContentHash:
					proposedPostContentHash,
				retrySaveReviewApprovalCandidateContentHash:
					'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
				retrySaveReviewApprovalProofSignature:
					'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
			},
		} );

		expect(
			getDistributedEditingLocalUpdatesImportResult( {
				payload: validPayload,
				currentPost: {
					id: 45,
					type: 'post',
				},
				computedPostContentHash: proposedPostContentHash,
			} )
		).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			reason: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.POST_ROUTE_MISMATCH,
			hasPostContent: false,
			mutatesEditorContent: false,
		} );

		expect(
			getDistributedEditingLocalUpdatesImportResult( {
				payload: getDistributedEditingLocalUpdatesExportPayload( {
					currentPost: {
						id: 44,
						type: 'post',
					},
					editedPostContent: postContent,
					sessionState: {
						serverVersion: '12',
					},
				} ),
				currentPost: {
					id: 44,
					type: 'post',
				},
				computedPostContentHash: proposedPostContentHash,
			} )
		).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			reason: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.MISSING_REVIEW_APPROVAL_PROOF,
			hasPostContent: false,
			mutatesEditorContent: false,
		} );

		expect(
			getDistributedEditingLocalUpdatesImportResult( {
				payload: validPayload,
				currentPost: {
					id: 44,
					type: 'post',
				},
				computedPostContentHash:
					'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
			} )
		).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			reason: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.POST_CONTENT_HASH_MISMATCH,
			hasPostContent: false,
			mutatesEditorContent: false,
		} );

		expect(
			getDistributedEditingLocalUpdatesImportResult( {
				payload: {
					...validPayload,
					distributedEditingSessionState: {
						serverVersion: '12',
					},
				},
				currentPost: {
					id: 44,
					type: 'post',
				},
				computedPostContentHash: proposedPostContentHash,
			} )
		).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			reason: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.EXTRA_SESSION_STATE_OVEREXPOSED,
			hasPostContent: false,
			mutatesEditorContent: false,
		} );

		expect(
			getDistributedEditingLocalUpdatesImportResult( {
				payload: {
					...validPayload,
					acceptedReviewApprovalProof: {
						...validPayload.acceptedReviewApprovalProof,
						proof: {
							...validPayload.acceptedReviewApprovalProof.proof,
							expiresAt: '1893456000',
						},
					},
				},
				currentPost: {
					id: 44,
					type: 'post',
				},
				computedPostContentHash: proposedPostContentHash,
				now: 1893456001,
			} )
		).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			reason: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.EXPIRED_REVIEW_APPROVAL_PROOF,
			hasPostContent: false,
			mutatesEditorContent: false,
		} );

		expect(
			getDistributedEditingLocalUpdatesImportResult( {
				payload: {
					...validPayload,
					acceptedReviewApprovalProof: {
						proof_envelope_type: 'unsupported_proof_envelope',
						proof: validPayload.acceptedReviewApprovalProof.proof,
					},
				},
				currentPost: {
					id: 44,
					type: 'post',
				},
				computedPostContentHash: proposedPostContentHash,
			} )
		).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			reason: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.MISSING_REVIEW_APPROVAL_PROOF,
			hasPostContent: false,
			mutatesEditorContent: false,
		} );
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
