/**
 * External dependencies
 */
import { webcrypto } from 'crypto';
import { TextEncoder as NodeTextEncoder } from 'util';
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES,
	DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES,
	DISTRIBUTED_EDITING_DISPOSITIONS,
	DISTRIBUTED_EDITING_FRESH_REVIEW_AUTHORITY_STATUSES,
	DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES,
	DISTRIBUTED_EDITING_FRESH_REVIEW_LIFECYCLE_RETRIEVAL_STATUSES,
	DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS,
	DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES,
	DISTRIBUTED_EDITING_FRESH_REVIEW_REVIEW_LIST_STATUSES,
	DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS,
	DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_EXPORT_FORMAT,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES,
	DISTRIBUTED_EDITING_NOTICE_ACTIONS,
	DISTRIBUTED_EDITING_NOTICE_IDS,
	DISTRIBUTED_EDITING_NOTICE_KINDS,
	DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_ENVELOPE_TYPE,
	DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES,
	DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES,
	DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES,
	DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES,
	DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES,
	DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES,
	DISTRIBUTED_EDITING_REASON_CODES,
	DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_REASONS,
	DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_STATUSES,
	DISTRIBUTED_EDITING_REVIEW_APPROVAL_PROOF_ENVELOPE_TYPE,
	DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES,
	DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES,
	DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES,
	DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES,
	DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES,
	DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS,
	DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES,
	DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS,
	DISTRIBUTED_EDITING_SELECTION_PRESENCE_SCHEMA,
	DISTRIBUTED_EDITING_SELECTION_DEGRADATION_REASONS,
	DISTRIBUTED_EDITING_SELECTION_RESOLVED_MAPPING_STATUSES,
	DISTRIBUTED_EDITING_SELECTION_SOURCE_STATUSES,
	DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES,
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
	DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES,
	DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES,
	DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS,
	DEFAULT_DISTRIBUTED_EDITING_SESSION_STATE,
	getDistributedEditingActionTranscriptStateForSessionState,
	getDistributedEditingActionTranscriptSupportReportForSessionState,
	getDistributedEditingActionTranscriptSupportSummaryForSessionState,
	getDistributedEditingLocalUpdatesExportPayload,
	getDistributedEditingFreshReviewDecisionStateForSessionState,
	getDistributedEditingFreshReviewComparisonRendererCapabilityResolution,
	getDistributedEditingFreshReviewComparisonRendererCapabilitySupportSummary,
	getDistributedEditingFreshReviewLifecycleStateForSessionState,
	getDistributedEditingFreshReviewPreSaveStateForSessionState,
	getDistributedEditingFreshReviewPrePublishStateForSessionState,
	getDistributedEditingFreshReviewRetrySaveHandoffStateForSessionState,
	getDistributedEditingHumanLoopStepStateForSessionState,
	getDistributedEditingSaveJourneyStateForSessionState,
	getDistributedEditingLocalUpdatesImportResult,
	getDistributedEditingComparablePostContent,
	getDistributedEditingLocalUpdatesImportReviewRequestStateForSessionState,
	getDistributedEditingAcceptedFreshReviewConsumeValidationForRetrySaveRequest,
	getDistributedEditingAcceptedReviewApprovalProofForRetrySaveRequest,
	getDistributedEditingBlockIdentityDistinctGapInsertionDescriptor,
	getDistributedEditingBlockIdentityRetainedEditsServerMergeDescriptor,
	getDistributedEditingBlockIdentityRequestProofDescriptor,
	getDistributedEditingPostContentWithAutomergeSyncMeta,
	getDistributedEditingSyncMetaFromPostContent,
	getDistributedEditingAutomergeClientUpdateDescriptor,
	getDistributedEditingAutomergeLocalMergeCandidate,
	getDistributedEditingReviewedBlockItemsForRetrySaveReviewApprovalProof,
	getDistributedEditingReviewedBlockItemsForFreshReviewDecision,
	getDistributedEditingPostContentSha256Hash,
	getDistributedEditingRetrySaveFlowStateForSessionState,
	getDistributedEditingRetrySavePolicyForSessionState,
	getDistributedEditingRiskyBlockReviewStateForSessionState,
	getDistributedEditingSaveButtonStateForSessionState,
	getDistributedEditingSavePolicyStateForSessionState,
	getDistributedEditingStaleBaseLocalRebaseResult,
	getDistributedEditingSessionStateForKsesRiskyBlockReviewClassificationResult,
	getDistributedEditingSessionStateForPresenceHeartbeatResult,
	getDistributedEditingSessionStateForPresenceRepeatedRefreshRuntimeConfig,
	getDistributedEditingSessionStateForPresenceStartupPolicyConfig,
	getDistributedEditingSessionStateForPresenceSnapshotRefreshResult,
	getDistributedEditingSessionStateForRiskyBlockReviewItemResolution,
	getDistributedEditingSessionStateForFreshReviewDecisionItemResolution,
	getDistributedEditingSessionStateForFreshReviewDecisionItems,
	getDistributedEditingSessionStateForFreshReviewDecisionResult,
	getDistributedEditingSessionStateForFreshReviewLifecycleRetrievalResult,
	getDistributedEditingSessionStateForFreshReviewRetrySaveHandoffValidation,
	getDistributedEditingSessionStateForFreshReviewRetrySaveHandoffValidationResult,
	getDistributedEditingSessionStateForStaleRiskyBlockReview,
	getDistributedEditingSessionStateForPendingLocalHistoryChange,
	getDistributedEditingSessionStateForRetrySaveHandoff,
	getDistributedEditingSessionStateForRetrySaveRequest,
	getDistributedEditingSessionStateForRetrySaveReviewApprovalProofResult,
	getDistributedEditingSessionStateForRetrySaveResult,
	getDistributedEditingSessionStateWithActionTranscriptEvent,
	getDistributedEditingSessionStateForRetrySubmitHandoff,
	getDistributedEditingSessionStateForRetrySubmitProofResult,
	getDistributedEditingSessionStateForRetrySubmitSavePreparation,
	getDistributedEditingSessionStateForFreshReviewRequestResult,
	getDistributedEditingSessionStateForRecoveryDryRunResult,
	getDistributedEditingSessionStateForStaleBaseLocalRebasePlan,
	getDistributedEditingSessionStateForStaleBaseRejectionResult,
	getDistributedEditingSessionStateForStaleBaseServerStateRefetchResult,
	getDistributedEditingNoticeDescriptorsForSessionState,
	getDistributedEditingPresenceRepeatedRefreshRuntimeStateForSessionState,
	getDistributedEditingPresenceRosterStateForSessionState,
	getDistributedEditingPresenceStartupPolicyStateForSessionState,
	getDistributedEditingRepeatedVisibleSaveProofStateForSessionState,
	getDistributedEditingReviewTokenRecoveryStateForSessionState,
	getDistributedEditingUnloadWarningStateForSessionState,
	hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState,
	isDistributedEditingConflictDisposition,
	isValidDistributedEditingDisposition,
	isValidDistributedEditingReasonCode,
	normalizeDistributedEditingSessionState,
	getDistributedEditingSelectionPresenceMapping,
	normalizeDistributedEditingPresenceSelectionState,
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
	getDistributedEditingActionTranscriptState,
	getDistributedEditingFreshReviewDecisionState,
	getDistributedEditingFreshReviewLifecycleState,
	getDistributedEditingFreshReviewPreSaveState,
	getDistributedEditingFreshReviewPrePublishState,
	getDistributedEditingLocalUpdatesImportReviewRequestState,
	getDistributedEditingNoticeDescriptors,
	getDistributedEditingPresenceRepeatedRefreshRuntimeState,
	getDistributedEditingPresenceRosterState,
	getDistributedEditingPresenceStartupPolicyState,
	getDistributedEditingRepeatedVisibleSaveProofState,
	getDistributedEditingReviewTokenRecoveryState,
	getDistributedEditingRiskyBlockReviewState,
	getDistributedEditingRetrySaveFlowState,
	getDistributedEditingSaveButtonState,
	getDistributedEditingSaveJourneyState,
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

	it( 'parses top pseudo-block Automerge sync metadata without exposing it as post content', () => {
		const postContent =
			'<!-- wp:sync-meta {"format":"automerge"} -->\n' +
			'<script type="application/json" data-wp-sync-meta="distributed-editing" data-sync-meta-format="automerge">{"version":"12","schema":"de-rtc-automerge-v1","automerge_encoding":"native-automerge-php-v1"}</script>\n' +
			'<!-- /wp:sync-meta --><!-- wp:paragraph --><p>Visible editor content.</p><!-- /wp:paragraph -->';

		expect(
			getDistributedEditingSyncMetaFromPostContent( postContent )
		).toMatchObject( {
			version: '12',
			schema: 'de-rtc-automerge-v1',
			automerge_encoding: 'native-automerge-php-v1',
		} );
	} );

	it( 'builds raw post content with a pending Automerge update in the sync-meta block', async () => {
		const clientBaseContent =
			'<!-- wp:paragraph --><p>Automerge base content.</p><!-- /wp:paragraph -->';
		const proposedPostContent =
			'<!-- wp:paragraph --><p>Automerge edited content.</p><!-- /wp:paragraph -->';

		const result =
			await getDistributedEditingPostContentWithAutomergeSyncMeta( {
				clientBaseContent,
				proposedPostContent,
				existingSyncMeta: {
					version: '12',
					schema: 'de-rtc-automerge-v1',
				},
				actor: 'editor-42',
			} );

		expect( result.status ).toBe( 'ready' );
		expect( result.postContent ).toContain(
			'<!-- wp:sync-meta {"format":"automerge"} -->'
		);
		expect( result.postContent ).toContain(
			'data-wp-sync-meta="distributed-editing"'
		);
		expect(
			getDistributedEditingSyncMetaFromPostContent( result.postContent )
		).toMatchObject( {
			version: '12',
			client_base_version: '12',
			schema: 'de-rtc-automerge-v1',
			pending_automerge_encoding: 'native-automerge-blocks-v1',
		} );
		expect( result.postContent ).toContain( proposedPostContent );
		expect( result.postContent ).not.toContain( 'automerge_client_update' );
	} );

	it( 'canonicalizes explicit core block comments before comparing post content', () => {
		const postContent =
			'<!-- wp:core/sync-meta {"format":"automerge"} -->\n' +
			'<script type="application/json" data-wp-sync-meta="distributed-editing" data-sync-meta-format="automerge">{"version":"12","schema":"de-rtc-automerge-v1"}</script>\n' +
			'<!-- /wp:core/sync-meta -->' +
			'<!-- wp:core/paragraph --><p>Visible editor content.</p><!-- /wp:core/paragraph -->';

		expect(
			getDistributedEditingComparablePostContent( postContent )
		).toBe(
			'<!-- wp:paragraph --><p>Visible editor content.</p><!-- /wp:paragraph -->'
		);
	} );

	it( 'builds native Automerge retry-save update evidence from a normal editor edit', async () => {
		ensureDistributedEditingTestCrypto();

		const clientBaseContent =
			'<!-- wp:paragraph --><p>Automerge base content.</p><!-- /wp:paragraph -->';
		const proposedPostContent =
			'<!-- wp:paragraph --><p>Automerge edited content.</p><!-- /wp:paragraph -->';

		await expect(
			getDistributedEditingAutomergeClientUpdateDescriptor( {
				clientBaseContent,
				proposedPostContent,
				actor: 'editor-42',
			} )
		).resolves.toMatchObject( {
			status: 'ready',
			update: {
				format: 'native-automerge-blocks-v1',
				schema: 'de-rtc-automerge-v1',
				operations: [
					{
						type: 'block.rich_text_content',
						automergePrimitive: 'Automerge.Text.splice',
						path: [ 0 ],
						blockName: 'core/paragraph',
						actor: 'editor-42',
						textSplice: {
							changed: true,
							start: 10,
							deleteCount: 4,
							insertText: 'edited',
							insertCount: 6,
							end: 14,
							delta: 2,
						},
					},
				],
				stateVector: {
					'editor-42': 1,
				},
				baseBlockCount: 1,
				proposedBlockCount: 1,
				interop: {
					jsPackage: '@automerge/automerge',
					jsPackageVersion: '3.2.6',
					serverEncoding: 'native-automerge-blocks-v1',
				},
			},
			changeRange: {
				changed: true,
			},
		} );
	} );

	it( 'maps paragraph formatting changes to block-native Automerge.Text operations', async () => {
		ensureDistributedEditingTestCrypto();

		const clientBaseContent =
			'<!-- wp:paragraph --><p>This is bold and italicized.</p><!-- /wp:paragraph -->';
		const proposedPostContent =
			'<!-- wp:paragraph --><p>This is <strong>bold</strong> and italicized.</p><!-- /wp:paragraph -->';

		await expect(
			getDistributedEditingAutomergeClientUpdateDescriptor( {
				clientBaseContent,
				proposedPostContent,
				actor: 'editor-42',
			} )
		).resolves.toMatchObject( {
			status: 'ready',
			update: {
				format: 'native-automerge-blocks-v1',
				operations: [
					{
						type: 'block.rich_text_format',
						automergePrimitive: 'Automerge.Text.mark',
						field: 'innerHTML',
						path: [ 0 ],
						blockName: 'core/paragraph',
						changedTextIndexes: [ 8, 9, 10, 11 ],
					},
				],
			},
		} );
	} );

	it( 'builds a Automerge local merge candidate for non-overlapping same-block stale edits', () => {
		const clientBaseContent =
			'<!-- wp:paragraph --><p>WordPress saves calmly.</p><!-- /wp:paragraph -->';
		const serverContent =
			'<!-- wp:paragraph --><p>WordPress saves safely.</p><!-- /wp:paragraph -->';
		const localContent =
			'<!-- wp:paragraph --><p>Reliable WordPress saves calmly.</p><!-- /wp:paragraph -->';

		expect(
			getDistributedEditingAutomergeLocalMergeCandidate( {
				clientBaseContent,
				serverContent,
				localContent,
			} )
		).toMatchObject( {
			status: 'merged',
			hasCandidatePostContent: true,
			candidatePostContent:
				'<!-- wp:paragraph --><p>Reliable WordPress saves safely.</p><!-- /wp:paragraph -->',
			mergeStrategy: 'native_automerge_php_v1',
			serverChangeRange: {
				changed: true,
			},
			localChangeRange: {
				changed: true,
			},
		} );
	} );

	it( 'builds a Automerge local merge candidate for non-overlapping word edits in one paragraph', () => {
		const clientBaseContent =
			'<!-- wp:paragraph --><p>The blue river meets the quiet forest.</p><!-- /wp:paragraph -->';
		const serverContent =
			'<!-- wp:paragraph --><p>The silver river meets the quiet forest.</p><!-- /wp:paragraph -->';
		const localContent =
			'<!-- wp:paragraph --><p>The blue river meets the green forest.</p><!-- /wp:paragraph -->';

		expect(
			getDistributedEditingAutomergeLocalMergeCandidate( {
				clientBaseContent,
				serverContent,
				localContent,
			} )
		).toMatchObject( {
			status: 'merged',
			hasCandidatePostContent: true,
			candidatePostContent:
				'<!-- wp:paragraph --><p>The silver river meets the green forest.</p><!-- /wp:paragraph -->',
			mergeStrategy: 'native_automerge_php_v1',
			serverChangeRange: {
				changed: true,
			},
			localChangeRange: {
				changed: true,
			},
		} );
	} );

	it( 'builds a Automerge local merge candidate for distinct inline formatting in the same paragraph', () => {
		const clientBaseContent =
			'<!-- wp:paragraph --><p>This is bold and italicized.</p><!-- /wp:paragraph -->';
		const serverContent =
			'<!-- wp:paragraph --><p>This is <strong>bold</strong> and italicized.</p><!-- /wp:paragraph -->';
		const localContent =
			'<!-- wp:paragraph --><p>This is bold and <em>italicized</em>.</p><!-- /wp:paragraph -->';

		expect(
			getDistributedEditingAutomergeLocalMergeCandidate( {
				clientBaseContent,
				serverContent,
				localContent,
			} )
		).toMatchObject( {
			status: 'merged',
			hasCandidatePostContent: true,
			candidatePostContent:
				'<!-- wp:paragraph --><p>This is <strong>bold</strong> and <em>italicized</em>.</p><!-- /wp:paragraph -->',
			mergeStrategy: 'native_automerge_php_v1',
			serverChangeRange: {
				changed: true,
			},
			localChangeRange: {
				changed: true,
			},
		} );
	} );

	it( 'builds a Automerge local merge candidate for paragraph text plus remote formatting', () => {
		const clientBaseContent =
			'<!-- wp:paragraph --><p>Some pretext to a post.</p><!-- /wp:paragraph -->';
		const serverContent =
			'<!-- wp:paragraph --><p>Some <em>pretext</em> to a post.</p><!-- /wp:paragraph -->';
		const localContent =
			'<!-- wp:paragraph --><p>Some pretext to a WordPress post.</p><!-- /wp:paragraph -->';

		expect(
			getDistributedEditingAutomergeLocalMergeCandidate( {
				clientBaseContent,
				serverContent,
				localContent,
			} )
		).toMatchObject( {
			status: 'merged',
			hasCandidatePostContent: true,
			candidatePostContent:
				'<!-- wp:paragraph --><p>Some <em>pretext</em> to a WordPress post.</p><!-- /wp:paragraph -->',
			mergeStrategy: 'native_automerge_php_v1',
		} );
	} );

	it( 'blocks a Automerge local merge candidate for overlapping same-block stale edits', () => {
		const clientBaseContent =
			'<!-- wp:paragraph --><p>WordPress saves calmly.</p><!-- /wp:paragraph -->';
		const serverContent =
			'<!-- wp:paragraph --><p>WordPress saves safely.</p><!-- /wp:paragraph -->';
		const localContent =
			'<!-- wp:paragraph --><p>WordPress saves quickly.</p><!-- /wp:paragraph -->';

		expect(
			getDistributedEditingAutomergeLocalMergeCandidate( {
				clientBaseContent,
				serverContent,
				localContent,
			} )
		).toMatchObject( {
			status: 'manual_conflict_required',
			reason: 'automerge_overlapping_change_ranges',
			hasCandidatePostContent: false,
			mergeStrategy: 'native_automerge_php_v1',
		} );
	} );

	it( 'normalizes content-free action transcript items without retaining unsafe payloads', () => {
		const normalized = normalizeDistributedEditingSessionState( {
			actionTranscriptItems: [
				{
					eventType:
						DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_EDITOR_ACTION,
					rawContent:
						'<!-- wp:paragraph --><p>Do not expose me</p><!-- /wp:paragraph -->',
				},
				{
					eventType:
						DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_EDITOR_ACTION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				},
				{
					eventType:
						DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REMOTE_CHANGE_RECEIVED,
					reviewerId: 7,
				},
				{
					eventType:
						DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REMOTE_CHANGE_RECEIVED,
				},
			],
		} );

		expect( normalized ).toMatchObject( {
			actionTranscriptItemCount: 2,
			actionTranscriptDroppedItemCount: 2,
			actionTranscriptLatestEventType:
				DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REMOTE_CHANGE_RECEIVED,
			actionTranscriptLatestEventSource: 'remote',
			actionTranscriptHasLocalEvents: true,
			actionTranscriptHasRemoteEvents: true,
			actionTranscriptEntriesRedacted: true,
			actionTranscriptExposesRawContent: false,
			actionTranscriptExposesProofInternals: false,
			actionTranscriptExposesActorIds: false,
			actionTranscriptCallsRest: false,
			actionTranscriptCallsSave: false,
			actionTranscriptMutatesEditorContent: false,
			actionTranscriptChangesPostLock: false,
			actionTranscriptClaimsSaved: false,
		} );
		expect(
			JSON.stringify( normalized.actionTranscriptItems )
		).not.toMatch( /Do not expose me|reviewerId|reviewer_id|rawContent/ );
	} );

	it( 'normalizes session-owned history stacks for Distributed Editing undo and redo', () => {
		const undoItems = Array.from( { length: 22 }, ( _, index ) => ( {
			beforeContent: `<!-- wp:paragraph --><p>Before ${ index }</p><!-- /wp:paragraph -->`,
			afterContent: `<!-- wp:paragraph --><p>After ${ index }</p><!-- /wp:paragraph -->`,
			label: `History ${ index }`,
			source: 'history_restore',
		} ) );
		const normalized = normalizeDistributedEditingSessionState( {
			historyUndoStack: [
				{ beforeContent: 'missing after content' },
				...undoItems,
			],
			historyRedoStack: [
				{
					beforeContent:
						'<!-- wp:paragraph --><p>Base.</p><!-- /wp:paragraph -->',
					afterContent:
						'<!-- wp:paragraph --><p>Redo.</p><!-- /wp:paragraph -->',
					label: 'Redo history',
					source: 'redo',
				},
				{ afterContent: 'missing before content' },
			],
			historyLastAction: 'history_restore',
		} );

		expect( normalized.historyUndoStack ).toHaveLength( 20 );
		expect( normalized.historyUndoStack[ 0 ].beforeContent ).toBe(
			'<!-- wp:paragraph --><p>Before 2</p><!-- /wp:paragraph -->'
		);
		expect( normalized.historyUndoStack[ 19 ] ).toMatchObject( {
			beforeContent:
				'<!-- wp:paragraph --><p>Before 21</p><!-- /wp:paragraph -->',
			afterContent:
				'<!-- wp:paragraph --><p>After 21</p><!-- /wp:paragraph -->',
			label: 'History 21',
			source: 'history_restore',
		} );
		expect( normalized.historyRedoStack ).toEqual( [
			{
				beforeContent:
					'<!-- wp:paragraph --><p>Base.</p><!-- /wp:paragraph -->',
				afterContent:
					'<!-- wp:paragraph --><p>Redo.</p><!-- /wp:paragraph -->',
				label: 'Redo history',
				source: 'redo',
			},
		] );
		expect( normalized.historyLastAction ).toBe( 'history_restore' );
	} );

	it( 'describes action transcript state and notice descriptors without side effects', () => {
		const sessionState = normalizeDistributedEditingSessionState( {
			actionTranscriptItems: [
				{
					eventType:
						DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SERVER_STATE_REFETCHED,
				},
			],
		} );
		const transcriptState =
			getDistributedEditingActionTranscriptStateForSessionState(
				sessionState
			);
		const descriptor =
			getDistributedEditingNoticeDescriptorsForSessionState(
				sessionState
			).find(
				( item ) =>
					item.kind ===
					DISTRIBUTED_EDITING_NOTICE_KINDS.ACTION_TRANSCRIPT
			);

		expect( transcriptState ).toMatchObject( {
			status: 'available',
			itemCount: 1,
			latestEventType:
				DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SERVER_STATE_REFETCHED,
			latestEventSource: 'server',
			entriesRedacted: true,
			exposesRawContent: false,
			exposesProofInternals: false,
			exposesActorIds: false,
			callsRest: false,
			callsSave: false,
			mutatesEditorContent: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( descriptor ).toEqual(
			expect.objectContaining( {
				id: DISTRIBUTED_EDITING_NOTICE_IDS.ACTION_TRANSCRIPT,
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.ACTION_TRANSCRIPT,
				status: 'info',
				priority: 'status',
				actionTranscriptItemCount: 1,
				actionTranscriptLatestEventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SERVER_STATE_REFETCHED,
				actionTranscriptEntriesRedacted: true,
				actionTranscriptCallsSave: false,
				actionTranscriptClaimsSaved: false,
			} )
		);
	} );

	it( 'summarizes action transcripts for support exports without unsafe payloads', () => {
		const summary =
			getDistributedEditingActionTranscriptSupportSummaryForSessionState(
				{
					actionTranscriptItems: [
						{
							eventType:
								DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED,
						},
						{
							eventType:
								DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED,
							reviewerId: 7,
						},
						{
							eventType:
								DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED,
						},
						{
							eventType:
								DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_CONSUME_VALIDATED,
							reasonCode:
								DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD,
						},
						{
							eventType:
								DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED,
							proofSignature: 'hidden-proof',
						},
						{
							eventType:
								DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED,
						},
						{
							eventType:
								DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_EDITOR_ACTION,
							rawContent:
								'<!-- wp:paragraph --><p>Do not expose support content</p><!-- /wp:paragraph -->',
						},
					],
				}
			);

		expect( summary ).toMatchObject( {
			status: 'available',
			available: true,
			itemCount: 4,
			droppedItemCount: 3,
			latestEventType:
				DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED,
			latestEventSource: 'server',
			eventTypes: [
				DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED,
				DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED,
				DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_CONSUME_VALIDATED,
				DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED,
			],
			eventSources: [ 'review', 'review', 'review', 'server' ],
			hasFreshReviewRequest: true,
			hasFreshReviewDecision: true,
			hasFreshReviewConsumeValidation: true,
			hasFreshReviewRetrySaveConfirmation: true,
			entriesRedacted: true,
			exposesRawContent: false,
			exposesProofInternals: false,
			exposesActorIds: false,
			callsRest: false,
			callsSave: false,
			mutatesEditorContent: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( JSON.stringify( summary ) ).not.toMatch(
			/Do not expose support content|hidden-proof|reviewerId|"7"/
		);
	} );

	it( 'formats action transcript support reports without exposing unsafe payloads or save authority', () => {
		const report =
			getDistributedEditingActionTranscriptSupportReportForSessionState( {
				actionTranscriptItems: [
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_CONSUME_VALIDATED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED,
						proofSignature: 'turn0145-hidden-proof',
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_EDITOR_ACTION,
						rawContent:
							'<!-- wp:paragraph --><p>Do not expose support report content</p><!-- /wp:paragraph -->',
					},
				],
			} );

		expect( report ).toMatchObject( {
			status: 'available',
			available: true,
			headline: 'Distributed Editing activity transcript report',
			summaryText:
				'Recorded 4 redacted transcript events; 2 unsafe entries were dropped.',
			chronologyStatus: 'fresh_review_guarded_save_confirmed',
			chronologyText:
				'Fresh-review Save confirmation was recorded; use WordPress Save evidence to confirm persistence.',
			latestEventLabel: 'Fresh-review Save confirmed',
			timelineItemCount: 4,
			droppedItemCount: 2,
			canShareWithSupport: true,
			requiresSaveAuthorityForPersistence: true,
			entriesRedacted: true,
			exposesRawContent: false,
			exposesProofInternals: false,
			exposesTokenMaterial: false,
			exposesActorIds: false,
			dispatchesNotice: false,
			callsRest: false,
			callsSave: false,
			callsRetrySaveEndpoint: false,
			callsNormalSavePost: false,
			savesPost: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			createsRevision: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( report.timelineItems ).toEqual( [
			expect.objectContaining( {
				eventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED,
				label: 'Fresh review requested',
				redacted: true,
			} ),
			expect.objectContaining( {
				eventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED,
				label: 'Fresh-review decision submitted',
				redacted: true,
			} ),
			expect.objectContaining( {
				eventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_CONSUME_VALIDATED,
				label: 'Fresh-review handoff validated',
				redacted: true,
			} ),
			expect.objectContaining( {
				eventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED,
				label: 'Fresh-review Save confirmed',
				redacted: true,
			} ),
		] );
		expect( JSON.stringify( report ) ).not.toMatch(
			/Do not expose support report content|turn0145-hidden-proof|rawContent|proofSignature/
		);
	} );

	it( 'formats board-demo action transcript chronology without content or authority claims', () => {
		const report =
			getDistributedEditingActionTranscriptSupportReportForSessionState( {
				actionTranscriptItems: [
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SERVER_STATE_REFETCHED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_CHANGES_APPLIED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_CHANGES_STAGED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.RETRY_SUBMIT_PROOF_REFRESHED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_PREPARED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_STATE_CHANGED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_CONFIRMED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_EDITOR_ACTION,
						rawContent:
							'<!-- wp:paragraph --><p>Hidden local edit</p><!-- /wp:paragraph -->',
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_CONFIRMED,
						proofSignature: 'turn0212-hidden-proof',
					},
				],
			} );

		expect( report ).toMatchObject( {
			status: 'available',
			available: true,
			chronologyStatus: 'guarded_save_confirmed',
			chronologyText:
				'WordPress Save confirmation was recorded; use WordPress Save evidence to confirm persistence.',
			latestEventLabel: 'Saved by WordPress',
			timelineItemCount: 7,
			droppedItemCount: 2,
			canShareWithSupport: true,
			requiresSaveAuthorityForPersistence: true,
			entriesRedacted: true,
			exposesRawContent: false,
			exposesProofInternals: false,
			callsSave: false,
			claimsSaved: false,
		} );
		expect( report.timelineItems ).toEqual( [
			expect.objectContaining( {
				eventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SERVER_STATE_REFETCHED,
				label: 'Latest post loaded',
				redacted: true,
			} ),
			expect.objectContaining( {
				eventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_CHANGES_APPLIED,
				label: 'Local changes applied',
				redacted: true,
			} ),
			expect.objectContaining( {
				eventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_CHANGES_STAGED,
				label: 'Changes ready to save',
				redacted: true,
			} ),
			expect.objectContaining( {
				eventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.RETRY_SUBMIT_PROOF_REFRESHED,
				label: 'Save verified',
				redacted: true,
			} ),
			expect.objectContaining( {
				eventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_PREPARED,
				label: 'Save prepared',
				redacted: true,
			} ),
			expect.objectContaining( {
				eventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_STATE_CHANGED,
				label: 'Save started',
				redacted: true,
			} ),
			expect.objectContaining( {
				eventType:
					DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_CONFIRMED,
				label: 'Saved by WordPress',
				redacted: true,
			} ),
		] );
		expect( JSON.stringify( report ) ).not.toMatch(
			/Hidden local edit|turn0212-hidden-proof|rawContent|proofSignature/
		);
	} );

	it( 'appends content-free action transcript events without retaining unsafe entries', () => {
		let sessionState =
			getDistributedEditingSessionStateWithActionTranscriptEvent(
				{},
				{
					eventType:
						DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_EDITOR_ACTION,
				}
			);

		sessionState =
			getDistributedEditingSessionStateWithActionTranscriptEvent(
				sessionState,
				{
					eventType:
						DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REMOTE_CHANGE_RECEIVED,
					postContent:
						'<!-- wp:paragraph --><p>Do not retain me</p><!-- /wp:paragraph -->',
				}
			);
		sessionState =
			getDistributedEditingSessionStateWithActionTranscriptEvent(
				sessionState,
				{
					eventType:
						DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SERVER_STATE_REFETCHED,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				}
			);
		sessionState =
			getDistributedEditingSessionStateWithActionTranscriptEvent(
				sessionState,
				{
					eventType:
						DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.RETRY_SUBMIT_PROOF_REFRESHED,
				}
			);

		expect( sessionState ).toMatchObject( {
			actionTranscriptItemCount: 3,
			actionTranscriptDroppedItemCount: 1,
			actionTranscriptLatestEventType:
				DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.RETRY_SUBMIT_PROOF_REFRESHED,
			actionTranscriptHasLocalEvents: true,
			actionTranscriptHasServerEvents: true,
			actionTranscriptEntriesRedacted: true,
			actionTranscriptExposesRawContent: false,
			actionTranscriptCallsSave: false,
			actionTranscriptClaimsSaved: false,
		} );
		expect( sessionState.actionTranscriptItems[ 1 ].reasonCode ).toBe(
			DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED
		);
		expect(
			JSON.stringify( sessionState.actionTranscriptItems )
		).not.toMatch( /Do not retain me|postContent/ );
	} );

	it( 'summarizes editor presence without false absence or side effects', () => {
		const emptyRoster =
			getDistributedEditingPresenceRosterStateForSessionState( {} );
		const activeRoster =
			getDistributedEditingPresenceRosterStateForSessionState( {
				presenceRosterEntries: [
					{
						key: 'presence-mira',
						displayName: 'Mira',
						avatarUrl: 'https://example.test/mira.png',
						freshness: 'current',
					},
					{
						key: 'presence-anonymous',
						identityVisibility: 'anonymous',
						freshness: 'current',
						userId: 42,
						selection: { anchor: 4 },
					},
				],
				presenceRosterTotalKnownCount: 3,
				presenceRosterHiddenCount: 1,
			} );
		const staleRoster =
			getDistributedEditingPresenceRosterStateForSessionState( {
				presenceRosterEntries: [
					{
						key: 'presence-sam',
						displayName: 'Sam',
						freshness: 'recent',
					},
				],
			} );
		const expiredOnlyRoster =
			getDistributedEditingPresenceRosterStateForSessionState( {
				presenceRosterStatus:
					DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.RECENT,
				presenceRosterEntries: [],
				presenceRosterExpiredCount: 2,
				presenceRosterTotalKnownCount: 2,
			} );
		const mixedRoster =
			getDistributedEditingPresenceRosterStateForSessionState( {
				presenceRosterEntries: [
					{
						key: 'presence-mira',
						displayName: 'Mira',
						freshness: 'current',
					},
					{
						key: 'presence-anonymous',
						identityVisibility: 'anonymous',
						freshness: 'current',
					},
					{
						key: 'presence-sam',
						displayName: 'Sam',
						freshness: 'recent',
					},
				],
				presenceRosterHiddenCount: 1,
				presenceRosterExpiredCount: 1,
				presenceRosterTotalKnownCount: 5,
			} );
		const storageRoster =
			getDistributedEditingPresenceRosterStateForSessionState( {
				presenceRosterEntries: [
					{
						key: 'presence-storage-mira',
						displayName: 'Mira',
						freshness: 'active',
					},
				],
			} );

		expect( emptyRoster ).toMatchObject( {
			status: DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.HIDDEN,
			visibleCount: 0,
			currentVisibleCount: 0,
			delayedVisibleCount: 0,
			claimsAbsence: false,
			callsRestEndpoint: false,
			callsSave: false,
			mutatesEditorContent: false,
			changesPostLock: false,
			claimsSaved: false,
			copy: {
				label: 'Editing now',
				summary: 'No other editors shown.',
				countSummary: 'Editor activity has not been shown yet.',
				refreshHint: 'Use Refresh editing list to check again.',
				otherEditorActivityCue: '',
				otherEditorActivityCueTone: 'none',
			},
		} );
		expect( activeRoster ).toMatchObject( {
			status: DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.ACTIVE,
			freshness: 'current',
			visibleCount: 2,
			currentVisibleCount: 2,
			delayedVisibleCount: 0,
			totalKnownCount: 3,
			hiddenCount: 1,
			exposesRawContent: false,
			exposesSelection: false,
			exposesCursorOffset: false,
			exposesUserIds: false,
			blocksPublish: false,
			copy: {
				summary: 'Mira and Another editor are also editing this post.',
				countSummary:
					'2 editors are active now. Some editor activity is hidden by roster limits or privacy settings.',
				otherEditorActivityCue: '2 other editors are active now.',
				otherEditorActivityCueTone: 'current',
			},
		} );
		expect( activeRoster.entries[ 0 ] ).toMatchObject( {
			displayName: 'Mira',
			avatarUrl: 'https://example.test/mira.png',
		} );
		expect( activeRoster.entries[ 1 ] ).toMatchObject( {
			exposesSelection: false,
			exposesSelectionPresence: false,
			selectionState: {
				available: false,
			},
		} );
		expect( mixedRoster ).toMatchObject( {
			currentVisibleCount: 2,
			delayedVisibleCount: 1,
			hiddenCount: 1,
			expiredCount: 1,
			totalKnownCount: 5,
			copy: {
				countSummary:
					'2 editors are active now; 1 editor may be delayed. Some editor activity is hidden by roster limits or privacy settings. Some editor activity expired before this refresh.',
			},
			claimsAbsence: false,
			callsSave: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( activeRoster.entries[ 1 ] ).toMatchObject( {
			identityVisibility: 'anonymous',
			exposesUserId: false,
			exposesSelection: false,
			exposesCursorOffset: false,
		} );
		expect( JSON.stringify( activeRoster ) ).not.toContain( 'userId' );
		expect( JSON.stringify( activeRoster ) ).not.toMatch(
			/rawSelection|selectedText|"clientId"|cursor_offset/
		);
		expect( staleRoster.copy.summary ).toBe(
			'Sam was here recently. Presence may be delayed.'
		);
		expect( staleRoster.copy.countSummary ).toBe(
			'1 editor may be delayed.'
		);
		expect( staleRoster.copy.otherEditorActivityCue ).toBe(
			'1 other editor may be delayed.'
		);
		expect( staleRoster.copy.otherEditorActivityCueTone ).toBe( 'delayed' );
		expect( expiredOnlyRoster ).toMatchObject( {
			status: DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.RECENT,
			visibleCount: 0,
			currentVisibleCount: 0,
			delayedVisibleCount: 0,
			totalKnownCount: 2,
			expiredCount: 2,
			copy: {
				summary:
					'Editor activity was seen before this refresh. Presence may be delayed.',
				countSummary:
					'Some editor activity expired before this refresh.',
				assistiveSummary:
					'Editor activity was seen before this refresh. Presence may be delayed.',
			},
			claimsAbsence: false,
			callsSave: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( storageRoster ).toMatchObject( {
			status: DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.ACTIVE,
			currentVisibleCount: 1,
			delayedVisibleCount: 0,
			copy: {
				countSummary: '1 editor is active now.',
				otherEditorActivityCue: '1 other editor is active now.',
				otherEditorActivityCueTone: 'current',
			},
		} );
		expect( storageRoster.entries[ 0 ].freshness ).toBe( 'current' );
	} );

	it( 'normalizes content-free selection presence without raw editor authority', () => {
		const selectionState =
			normalizeDistributedEditingPresenceSelectionState( {
				available: true,
				schema: DISTRIBUTED_EDITING_SELECTION_PRESENCE_SCHEMA,
				kind: DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS.CARET,
				isCollapsed: true,
				baseVersion: '12',
				baseStateHash:
					'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
				selectionSourceStatus:
					DISTRIBUTED_EDITING_SELECTION_SOURCE_STATUSES.BASE_ALIGNED,
				anchor: {
					blockPath: [ 1 ],
					blockUid: 'de-rtc-block-1',
					attributeKey: 'content',
					offset: 4,
					clientId: 'must-not-survive',
				},
				focus: {
					blockPath: [ 1 ],
					attributeKey: 'content',
					offset: 4,
				},
				rawContent: '<p>Do not retain me</p>',
			} );
		const rosterState =
			getDistributedEditingPresenceRosterStateForSessionState( {
				presenceRosterEntries: [
					{
						key: 'presence-mira',
						displayName: 'Mira',
						freshness: 'current',
						selectionState,
					},
				],
			} );

		expect( selectionState ).toMatchObject( {
			available: true,
			kind: DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS.CARET,
			baseVersion: '12',
			baseStateHash:
				'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
			selectionSourceStatus:
				DISTRIBUTED_EDITING_SELECTION_SOURCE_STATUSES.BASE_ALIGNED,
			anchor: {
				blockPath: [ 1 ],
				blockUid: 'de-rtc-block-1',
				attributeKey: 'content',
				offset: 4,
			},
			exposesRawContent: false,
			exposesRawSelectedText: false,
			exposesClientId: false,
		} );
		expect( selectionState.anchor ).not.toHaveProperty( 'clientId' );
		expect( rosterState ).toMatchObject( {
			exposesSelection: false,
			exposesSelectionPresence: true,
			exposesRawSelectedText: false,
			exposesCursorOffset: false,
		} );
		expect( JSON.stringify( rosterState ) ).not.toMatch(
			/must-not-survive|Do not retain me|rawContent/
		);

		expect(
			normalizeDistributedEditingPresenceSelectionState( {
				available: true,
				schema: DISTRIBUTED_EDITING_SELECTION_PRESENCE_SCHEMA,
				kind: DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS.BLOCK,
				baseVersion: '12',
				baseStateHash:
					'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
				mappingStatus: 'local_pending_only',
				anchor: {
					blockPath: [ 1 ],
				},
			} )
		).toMatchObject( {
			selectionSourceStatus:
				DISTRIBUTED_EDITING_SELECTION_SOURCE_STATUSES.UNKNOWN,
		} );

		expect(
			normalizeDistributedEditingPresenceSelectionState( {
				available: true,
				schema: DISTRIBUTED_EDITING_SELECTION_PRESENCE_SCHEMA,
				kind: DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS.BLOCK,
				baseVersion: '12',
				baseStateHash:
					'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
				updatedAt: '2026-05-20T12:03:00.000Z',
				anchor: {
					blockPath: [ 1 ],
				},
			} )
		).toMatchObject( {
			reportedAtGmt: '2026-05-20T12:03:00.000Z',
		} );
	} );

	it( 'resolves selection presence rendering only from receiver-owned mapping evidence', () => {
		const selectionState =
			normalizeDistributedEditingPresenceSelectionState( {
				available: true,
				schema: DISTRIBUTED_EDITING_SELECTION_PRESENCE_SCHEMA,
				kind: DISTRIBUTED_EDITING_SELECTION_PRESENCE_KINDS.RICH_TEXT,
				isCollapsed: false,
				baseVersion: '12',
				baseStateHash:
					'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
				selectionSourceStatus:
					DISTRIBUTED_EDITING_SELECTION_SOURCE_STATUSES.BASE_ALIGNED,
				mappingStatus: 'exact',
				anchor: {
					blockPath: [ 0, 1 ],
					attributeKey: 'content',
					offset: 3,
				},
				focus: {
					blockPath: [ 0, 1 ],
					attributeKey: 'content',
					offset: 8,
				},
			} );
		const resolveBlockPath = ( blockPath ) =>
			blockPath.join( '.' ) === '0.1' ? 'local-client-id' : null;

		expect(
			getDistributedEditingSelectionPresenceMapping( selectionState, {
				localBaseVersion: '12',
				localBaseStateHash:
					'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
				localHasPendingChanges: false,
				resolveBlockPath,
				hasRepeatedBlockAmbiguity: true,
			} )
		).toMatchObject( {
			resolvedMappingStatus:
				DISTRIBUTED_EDITING_SELECTION_RESOLVED_MAPPING_STATUSES.WITHHELD,
			resolvedDegradationReason:
				DISTRIBUTED_EDITING_SELECTION_DEGRADATION_REASONS.REPEATED_BLOCK_AMBIGUITY,
			renderable: false,
		} );

		expect(
			getDistributedEditingSelectionPresenceMapping( selectionState, {
				localBaseVersion: '12',
				localBaseStateHash:
					'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
				localHasPendingChanges: false,
				resolveBlockPath,
			} )
		).toMatchObject( {
			resolvedMappingStatus:
				DISTRIBUTED_EDITING_SELECTION_RESOLVED_MAPPING_STATUSES.EXACT,
			resolvedDegradationReason:
				DISTRIBUTED_EDITING_SELECTION_DEGRADATION_REASONS.NONE,
			anchorClientId: 'local-client-id',
			renderable: true,
			authoritativeForSave: false,
		} );

		expect(
			getDistributedEditingSelectionPresenceMapping( selectionState, {
				localBaseVersion: '12',
				localBaseStateHash:
					'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
				localHasPendingChanges: true,
				resolveBlockPath,
			} )
		).toMatchObject( {
			resolvedMappingStatus:
				DISTRIBUTED_EDITING_SELECTION_RESOLVED_MAPPING_STATUSES.EXACT,
			resolvedDegradationReason:
				DISTRIBUTED_EDITING_SELECTION_DEGRADATION_REASONS.NONE,
			renderable: true,
		} );

		const pendingSenderSelectionState = {
			...selectionState,
			selectionSourceStatus:
				DISTRIBUTED_EDITING_SELECTION_SOURCE_STATUSES.LOCAL_PENDING_ONLY,
		};

		expect(
			getDistributedEditingSelectionPresenceMapping(
				pendingSenderSelectionState,
				{
					localBaseVersion: '12',
					localBaseStateHash:
						'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
					localHasPendingChanges: false,
					resolveBlockPath,
				}
			)
		).toMatchObject( {
			resolvedMappingStatus:
				DISTRIBUTED_EDITING_SELECTION_RESOLVED_MAPPING_STATUSES.EXACT,
			resolvedDegradationReason:
				DISTRIBUTED_EDITING_SELECTION_DEGRADATION_REASONS.NONE,
			renderable: true,
		} );

		expect(
			getDistributedEditingSelectionPresenceMapping( selectionState, {
				localBaseVersion: '12',
				localBaseStateHash:
					'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
				localHasPendingChanges: false,
				resolveBlockPath,
			} )
		).toMatchObject( {
			resolvedMappingStatus:
				DISTRIBUTED_EDITING_SELECTION_RESOLVED_MAPPING_STATUSES.WITHHELD,
			resolvedDegradationReason:
				DISTRIBUTED_EDITING_SELECTION_DEGRADATION_REASONS.STALE_BASE,
			renderable: false,
		} );
	} );

	it( 'normalizes explicit presence snapshot refreshes without unsafe fields or write claims', () => {
		const normalized =
			getDistributedEditingSessionStateForPresenceSnapshotRefreshResult(
				{
					result: 'presence_roster_snapshot',
					rest_route: 'post_presence_roster',
					presence_roster: {
						status: 'recent',
						freshness: 'recent',
						entries: [
							{
								key: 'presence-mira',
								displayName: 'Mira',
								freshness: 'recent',
								presenceUpdatedAtGmt: '2026-05-20 12:00:30',
								documentState: {
									available: true,
									confirmedBaseVersion: '12',
									confirmedStateHash:
										'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
									hasPendingChanges: false,
									confirmedAtGmt: '2026-05-20 12:00:00',
									authoritativeForSave: true,
									claimsSaved: true,
									exposesRawContent: true,
								},
								userId: 42,
								selection: { anchor: 4 },
								rawContent: 'hidden',
							},
						],
						totalKnownCount: 3,
						expiredCount: 2,
					},
					presence_read_contract: {
						source: 'de_rtc_presence_read_snapshot',
						route: '/wp/v2/posts/42/distributed-editing/presence',
						cheap_host_polling_guidance: {
							suggested_polling_interval_seconds: 30,
							cheap_host_polling_interval_seconds: 120,
							repeated_client_refresh_enabled_now: false,
						},
					},
					enables_repeated_client_refresh: false,
				},
				{
					pendingChangeCount: 1,
					canExportLocalUpdates: true,
				}
			);
		const roster =
			getDistributedEditingPresenceRosterStateForSessionState(
				normalized
			);

		expect( normalized ).toMatchObject( {
			pendingChangeCount: 1,
			canExportLocalUpdates: true,
			presenceRosterStatus:
				DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.RECENT,
			presenceRosterVisibleCount: 1,
			presenceRosterTotalKnownCount: 3,
			presenceRosterExpiredCount: 2,
			presenceRosterRefreshStatus:
				DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.REFRESHED,
			presenceRosterRefreshRequested: true,
			presenceRosterRefreshSucceeded: true,
			presenceRosterRefreshCallsRestEndpoint: true,
			presenceRosterRefreshCallsSave: false,
			presenceRosterRefreshMutatesEditorContent: false,
			presenceRosterRefreshMutatesPersistedPostContent: false,
			presenceRosterRefreshChangesPostLock: false,
			presenceRosterRefreshRecordsPresenceHeartbeat: false,
			presenceRosterRefreshEnablesRepeatedClientRefresh: false,
			presenceRosterRefreshClaimsSaved: false,
			presenceRosterRefreshExposesRawContent: false,
			presenceRosterRefreshExposesUserIds: false,
			presenceRosterRefreshExposesCursorOffset: false,
			presenceRosterRefreshExposesSelection: false,
			presenceRosterReadContractSource: 'de_rtc_presence_read_snapshot',
			presenceRosterReadSuggestedPollingIntervalSeconds: 30,
			presenceRosterReadCheapHostPollingIntervalSeconds: 120,
			presenceRosterReadRepeatedClientRefreshEnabled: false,
		} );
		expect( normalized.presenceRosterEntries[ 0 ] ).toMatchObject( {
			presenceUpdatedAtGmt: '2026-05-20 12:00:30',
			documentState: {
				available: true,
				confirmedBaseVersion: '12',
				confirmedStateHash:
					'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
				hasPendingChanges: false,
				confirmedAtGmt: '2026-05-20 12:00:00',
				authoritativeForSave: false,
				claimsSaved: false,
				exposesRawContent: false,
			},
		} );
		expect( roster.copy.summary ).toBe(
			'Mira was here recently. Presence may be delayed.'
		);
		expect( JSON.stringify( normalized ) ).not.toMatch(
			/userId|rawContent|rawSelection|selectedText|"clientId"|cursor_offset/
		);
	} );

	it( 'keeps the current roster and protected changes after presence refresh gate failures', () => {
		const normalized =
			getDistributedEditingSessionStateForPresenceSnapshotRefreshResult(
				{
					code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED,
					message: 'Distributed Editing is disabled.',
					data: {
						detail: 'feature_disabled_for_post',
					},
				},
				{
					pendingChangeCount: 1,
					canExportLocalUpdates: true,
					presenceRosterEntries: [
						{
							key: 'presence-existing',
							displayName: 'Mira',
							freshness: 'recent',
						},
					],
				}
			);

		expect( normalized ).toMatchObject( {
			pendingChangeCount: 1,
			hasPendingChanges: true,
			canExportLocalUpdates: true,
			presenceRosterVisibleCount: 1,
			presenceRosterRefreshStatus:
				DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.FEATURE_DISABLED,
			presenceRosterRefreshReason:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED,
			presenceRosterRefreshRequested: true,
			presenceRosterRefreshFailed: true,
			presenceRosterRefreshCallsRestEndpoint: true,
			presenceRosterRefreshCallsSave: false,
			presenceRosterRefreshMutatesEditorContent: false,
			presenceRosterRefreshChangesPostLock: false,
			presenceRosterRefreshClaimsSaved: false,
		} );
	} );

	it( 'normalizes presence heartbeat success as a content-free local status', () => {
		const normalized =
			getDistributedEditingSessionStateForPresenceHeartbeatResult(
				{
					result: 'presence_heartbeat_recorded',
					rest_route: 'post_presence_heartbeat',
					writes_presence: true,
					records_presence_heartbeat: true,
					heartbeat_interval_seconds: 30,
					document_state: {
						available: true,
						confirmedBaseVersion: '12',
						confirmedStateHash:
							'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
						hasPendingChanges: true,
						confirmedAtGmt: '2026-05-20 12:00:00',
						presenceUpdatedAtGmt: '2026-05-20 12:00:30',
						authoritativeForSave: true,
						claimsSaved: true,
						exposesRawContent: true,
					},
					calls_save: true,
					mutates_post_content: true,
					changes_post_lock: true,
					claims_saved: true,
					raw_session_key_included: true,
					rawContent: 'hidden',
					userId: 42,
				},
				{
					pendingChangeCount: 1,
					canExportLocalUpdates: true,
				}
			);

		expect( normalized ).toMatchObject( {
			pendingChangeCount: 1,
			hasPendingChanges: true,
			canExportLocalUpdates: true,
			presenceHeartbeatStatus:
				DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.SENT,
			presenceHeartbeatResult: 'presence_heartbeat_recorded',
			presenceHeartbeatRequested: true,
			presenceHeartbeatSucceeded: true,
			presenceHeartbeatCallsRestEndpoint: true,
			presenceHeartbeatRecordsPresenceHeartbeat: true,
			presenceHeartbeatWritesPresence: true,
			presenceHeartbeatCallsSave: false,
			presenceHeartbeatMutatesEditorContent: false,
			presenceHeartbeatMutatesPersistedPostContent: false,
			presenceHeartbeatChangesPostLock: false,
			presenceHeartbeatClaimsSaved: false,
			presenceHeartbeatEnablesRepeatedClientRefresh: false,
			presenceHeartbeatRuntimePollingEnabled: false,
			presenceHeartbeatExposesRawContent: false,
			presenceHeartbeatExposesUserIds: false,
			presenceHeartbeatExposesCursorOffset: false,
			presenceHeartbeatExposesSelection: false,
			presenceHeartbeatRawSessionKeyIncluded: false,
			presenceHeartbeatMarksLocalEditorCurrent: true,
			presenceHeartbeatMarksLocalEditorDelayed: false,
			presenceHeartbeatLocalRosterEntryVisible: true,
			presenceHeartbeatLocalRosterEntryFreshness: 'current',
			presenceHeartbeatRepeatedRefreshOptional: true,
			presenceHeartbeatSuggestedIntervalSeconds: 30,
			presenceRosterStatus:
				DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.ACTIVE,
			presenceRosterFreshness: 'current',
			presenceRosterVisibleCount: 1,
			presenceRosterEntries: [
				{
					key: 'presence-local-heartbeat-current-tab',
					displayName: null,
					identityVisibility: 'self',
					relationship: 'current_user_current_tab',
					freshness: 'current',
					presenceUpdatedAtGmt: '2026-05-20 12:00:30',
					documentState: {
						available: true,
						confirmedBaseVersion: '12',
						confirmedStateHash:
							'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
						hasPendingChanges: true,
						confirmedAtGmt: '2026-05-20 12:00:00',
						presenceUpdatedAtGmt: '2026-05-20 12:00:30',
						authoritativeForSave: false,
						claimsSaved: false,
						exposesRawContent: false,
					},
					exposesUserId: false,
					exposesCursorOffset: false,
					exposesSelection: false,
					exposesRawContent: false,
				},
			],
		} );
		expect( JSON.stringify( normalized ) ).not.toMatch(
			/rawContent|userId|raw_session_key/
		);
	} );

	it( 'keeps expired roster evidence visible when a local heartbeat follows an expired-only snapshot', () => {
		const expiredOnlySnapshot =
			getDistributedEditingSessionStateForPresenceSnapshotRefreshResult(
				{
					result: 'presence_roster_snapshot',
					presenceRoster: {
						status: 'recent',
						freshness: 'recent',
						entries: [],
						visibleCount: 0,
						totalKnownCount: 2,
						hiddenCount: 0,
						expiredCount: 2,
					},
				},
				{
					presenceRosterStatus: 'empty',
				}
			);
		const normalized =
			getDistributedEditingSessionStateForPresenceHeartbeatResult(
				{
					result: 'presence_heartbeat_recorded',
					writes_presence: true,
					records_presence_heartbeat: true,
				},
				expiredOnlySnapshot
			);
		const rosterState =
			getDistributedEditingPresenceRosterStateForSessionState(
				normalized
			);

		expect( normalized ).toMatchObject( {
			presenceHeartbeatStatus:
				DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.SENT,
			presenceHeartbeatMarksLocalEditorCurrent: true,
			presenceHeartbeatLocalRosterEntryVisible: true,
			presenceRosterStatus:
				DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.ACTIVE,
			presenceRosterVisibleCount: 1,
			presenceRosterTotalKnownCount: 3,
			presenceRosterExpiredCount: 2,
			presenceRosterEntries: [
				{
					relationship: 'current_user_current_tab',
					freshness: 'current',
				},
			],
		} );
		expect( rosterState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.ACTIVE,
			currentVisibleCount: 1,
			expiredCount: 2,
			totalKnownCount: 3,
			copy: {
				summary: 'You are visible in this editing session.',
				countSummary:
					'1 editor is active now. Some editor activity expired before this refresh.',
			},
			claimsAbsence: false,
			callsSave: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( JSON.stringify( rosterState ) ).not.toMatch(
			/Expired Repeated Browser|userId|raw_session_key|rawSelection|selectedText|"clientId"|cursor_offset/
		);
	} );

	it( 'reconciles a storage-backed current-tab snapshot after local heartbeat without duplicating presence', () => {
		const currentSessionSnapshot = {
			result: 'presence_roster_snapshot',
			presenceRoster: {
				status: 'active',
				freshness: 'current',
				entries: [
					{
						key: 'de-rtc-presence-current-session',
						displayName: 'Admin User',
						identityVisibility: 'self',
						relationship: 'current_user_current_tab',
						freshness: 'current',
						source: 'de_rtc_presence_storage',
						rawSessionKeyIncluded: true,
						userId: 1,
					},
				],
				visibleCount: 1,
				totalKnownCount: 1,
				hiddenCount: 0,
				expiredCount: 0,
			},
		};
		const heartbeatConfirmedState =
			getDistributedEditingSessionStateForPresenceHeartbeatResult(
				{
					result: 'presence_heartbeat_recorded',
				},
				{
					presenceRosterEntries: [],
					presenceRosterExpiredCount: 2,
					presenceRosterTotalKnownCount: 2,
				}
			);
		const reconciled =
			getDistributedEditingSessionStateForPresenceSnapshotRefreshResult(
				currentSessionSnapshot,
				heartbeatConfirmedState
			);
		const rosterState =
			getDistributedEditingPresenceRosterStateForSessionState(
				reconciled
			);
		const nextCleanSnapshot =
			getDistributedEditingSessionStateForPresenceSnapshotRefreshResult(
				currentSessionSnapshot,
				reconciled
			);

		expect( reconciled ).toMatchObject( {
			presenceRosterRefreshStatus:
				DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.REFRESHED,
			presenceRosterStatus:
				DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.ACTIVE,
			presenceRosterVisibleCount: 1,
			presenceRosterTotalKnownCount: 3,
			presenceRosterExpiredCount: 2,
			presenceRosterExpiredEvidenceCarriedForward: true,
			presenceRosterEntries: [
				{
					key: 'de-rtc-presence-current-session',
					relationship: 'current_user_current_tab',
					freshness: 'current',
					exposesUserId: false,
					exposesCursorOffset: false,
					exposesSelection: false,
					exposesRawContent: false,
				},
			],
			presenceRosterRefreshCallsSave: false,
			presenceRosterRefreshMutatesEditorContent: false,
			presenceRosterRefreshChangesPostLock: false,
			presenceRosterRefreshClaimsSaved: false,
		} );
		expect( rosterState ).toMatchObject( {
			currentVisibleCount: 1,
			delayedVisibleCount: 0,
			expiredCount: 2,
			totalKnownCount: 3,
			copy: {
				summary: 'You are visible in this editing session.',
				countSummary:
					'1 editor is active now. Some editor activity expired before this refresh.',
			},
			claimsAbsence: false,
			callsSave: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect(
			reconciled.presenceRosterEntries.filter(
				( entry ) => entry.relationship === 'current_user_current_tab'
			)
		).toHaveLength( 1 );
		expect( nextCleanSnapshot ).toMatchObject( {
			presenceRosterVisibleCount: 1,
			presenceRosterTotalKnownCount: 1,
			presenceRosterExpiredCount: 0,
			presenceRosterExpiredEvidenceCarriedForward: false,
		} );
		expect( JSON.stringify( reconciled ) ).not.toMatch(
			/rawSessionKey|raw_session_key|userId|rawSelection|selectedText|"clientId"|cursor_offset/
		);
	} );

	it( 'keeps same-user other-tab storage rows distinct from the local current tab', () => {
		const heartbeatConfirmedState =
			getDistributedEditingSessionStateForPresenceHeartbeatResult(
				{
					result: 'presence_heartbeat_recorded',
				},
				{
					presenceRosterEntries: [],
					presenceRosterExpiredCount: 2,
					presenceRosterTotalKnownCount: 2,
				}
			);
		const sameUserSnapshot = {
			result: 'presence_roster_snapshot',
			presenceRoster: {
				status: 'active',
				freshness: 'current',
				entries: [
					{
						key: 'de-rtc-presence-admin-other-tab',
						displayName: 'Admin User',
						identityVisibility: 'self',
						relationship: 'same_user_other_tab',
						freshness: 'current',
						rawSessionKeyIncluded: true,
						userId: 1,
					},
					{
						key: 'de-rtc-presence-remote-editor',
						displayName: 'Sustained Remote Editor',
						identityVisibility: 'named',
						relationship: 'other_user',
						freshness: 'current',
						rawSessionKeyIncluded: true,
						userId: 2,
					},
				],
				visibleCount: 2,
				totalKnownCount: 2,
				hiddenCount: 0,
				expiredCount: 0,
			},
		};
		const refreshed =
			getDistributedEditingSessionStateForPresenceSnapshotRefreshResult(
				sameUserSnapshot,
				heartbeatConfirmedState
			);
		const heartbeatRefreshed =
			getDistributedEditingSessionStateForPresenceHeartbeatResult(
				{
					result: 'presence_heartbeat_recorded',
				},
				refreshed
			);
		const rosterState =
			getDistributedEditingPresenceRosterStateForSessionState(
				heartbeatRefreshed
			);

		expect( refreshed ).toMatchObject( {
			presenceRosterRefreshStatus:
				DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.REFRESHED,
			presenceRosterVisibleCount: 3,
			presenceRosterTotalKnownCount: 5,
			presenceRosterExpiredCount: 2,
			presenceRosterExpiredEvidenceCarriedForward: true,
			presenceRosterEntries: [
				{
					relationship: 'current_user_current_tab',
					freshness: 'recent',
				},
				{
					relationship: 'same_user_other_tab',
					freshness: 'current',
					exposesUserId: false,
					exposesCursorOffset: false,
					exposesSelection: false,
					exposesRawContent: false,
				},
				{
					displayName: 'Sustained Remote Editor',
					relationship: 'other_user',
					freshness: 'current',
					exposesUserId: false,
					exposesCursorOffset: false,
					exposesSelection: false,
					exposesRawContent: false,
				},
			],
		} );
		expect( heartbeatRefreshed ).toMatchObject( {
			presenceHeartbeatStatus:
				DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.SENT,
			presenceHeartbeatLocalRosterEntryVisible: true,
			presenceHeartbeatLocalRosterEntryFreshness: 'current',
			presenceRosterStatus:
				DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.ACTIVE,
			presenceRosterVisibleCount: 3,
			presenceRosterTotalKnownCount: 5,
			presenceRosterExpiredCount: 2,
			presenceRosterEntries: [
				{
					relationship: 'current_user_current_tab',
					freshness: 'current',
				},
				{
					relationship: 'same_user_other_tab',
					freshness: 'current',
				},
				{
					relationship: 'other_user',
					freshness: 'current',
				},
			],
			presenceRosterRefreshCallsSave: false,
			presenceRosterRefreshMutatesEditorContent: false,
			presenceRosterRefreshChangesPostLock: false,
			presenceRosterRefreshClaimsSaved: false,
			presenceHeartbeatCallsSave: false,
			presenceHeartbeatChangesPostLock: false,
			presenceHeartbeatClaimsSaved: false,
		} );
		expect( rosterState ).toMatchObject( {
			currentVisibleCount: 3,
			delayedVisibleCount: 0,
			localCurrentTabVisible: true,
			sameUserOtherTabVisible: true,
			remoteCurrentVisibleCount: 1,
			remoteDelayedVisibleCount: 0,
			expiredCount: 2,
			totalKnownCount: 5,
			copy: {
				summary:
					'You are visible in this editing session. You have this post open in another tab. Sustained Remote Editor is also editing this post.',
				countSummary:
					'3 editors are active now. Some editor activity expired before this refresh.',
			},
			claimsAbsence: false,
			callsSave: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect(
			heartbeatRefreshed.presenceRosterEntries.filter(
				( entry ) => entry.relationship === 'current_user_current_tab'
			)
		).toHaveLength( 1 );
		expect(
			heartbeatRefreshed.presenceRosterEntries.filter(
				( entry ) => entry.relationship === 'same_user_other_tab'
			)
		).toHaveLength( 1 );
		expect( JSON.stringify( heartbeatRefreshed ) ).not.toMatch(
			/rawSessionKey|raw_session_key|userId|rawSelection|selectedText|"clientId"|cursor_offset/
		);
	} );

	it( 'preserves an existing presence roster when heartbeat success confirms only local freshness', () => {
		const normalized =
			getDistributedEditingSessionStateForPresenceHeartbeatResult(
				{
					result: 'presence_heartbeat_recorded',
					writes_presence: true,
					records_presence_heartbeat: true,
				},
				{
					presenceRosterEntries: [
						{
							key: 'presence-other-editor',
							displayName: 'Mira Presence',
							identityVisibility: 'named',
							relationship: 'other_user',
							freshness: 'current',
						},
					],
				}
			);

		expect( normalized ).toMatchObject( {
			presenceHeartbeatStatus:
				DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.SENT,
			presenceHeartbeatMarksLocalEditorCurrent: true,
			presenceHeartbeatMarksLocalEditorDelayed: false,
			presenceHeartbeatLocalRosterEntryVisible: false,
			presenceHeartbeatLocalRosterEntryFreshness: null,
			presenceRosterVisibleCount: 1,
			presenceRosterEntries: [
				{
					key: 'presence-other-editor',
					displayName: 'Mira Presence',
					relationship: 'other_user',
					freshness: 'current',
				},
			],
		} );
	} );

	it( 'downgrades the local heartbeat roster entry when a later heartbeat degrades', () => {
		const normalized =
			getDistributedEditingSessionStateForPresenceHeartbeatResult(
				{
					code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_PRESENCE_STORAGE_UNAVAILABLE,
					message: 'Presence storage is unavailable.',
					data: {
						result: 'presence_storage_unavailable',
						status: 503,
						calls_rest_endpoint: true,
						records_presence_heartbeat: false,
						writes_presence: false,
					},
				},
				{
					presenceRosterEntries: [
						{
							key: 'presence-local-heartbeat-current-tab',
							identityVisibility: 'self',
							relationship: 'current_user_current_tab',
							freshness: 'current',
						},
					],
				}
			);
		const rosterState =
			getDistributedEditingPresenceRosterStateForSessionState(
				normalized
			);

		expect( normalized ).toMatchObject( {
			presenceHeartbeatStatus:
				DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.STORAGE_UNAVAILABLE,
			presenceHeartbeatRequested: true,
			presenceHeartbeatFailed: true,
			presenceHeartbeatMarksLocalEditorCurrent: false,
			presenceHeartbeatMarksLocalEditorDelayed: true,
			presenceHeartbeatLocalRosterEntryVisible: true,
			presenceHeartbeatLocalRosterEntryFreshness: 'recent',
			presenceRosterStatus:
				DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.RECENT,
			presenceRosterFreshness: 'recent',
			presenceRosterVisibleCount: 1,
			presenceRosterEntries: [
				{
					key: 'presence-local-heartbeat-current-tab',
					relationship: 'current_user_current_tab',
					freshness: 'recent',
					exposesUserId: false,
					exposesCursorOffset: false,
					exposesSelection: false,
					exposesRawContent: false,
				},
			],
			presenceHeartbeatCallsSave: false,
			presenceHeartbeatChangesPostLock: false,
			presenceHeartbeatClaimsSaved: false,
		} );
		expect( rosterState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.RECENT,
			currentVisibleCount: 0,
			delayedVisibleCount: 1,
			copy: {
				summary: 'Your presence may be delayed.',
				countSummary: '1 editor may be delayed.',
			},
			claimsAbsence: false,
			callsRestEndpoint: false,
			callsSave: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( JSON.stringify( normalized ) ).not.toMatch(
			/rawContent|userId|raw_session_key/
		);
	} );

	it( 'keeps a same-user other-tab roster distinct after local heartbeat success', () => {
		const normalized =
			getDistributedEditingSessionStateForPresenceHeartbeatResult(
				{
					result: 'presence_heartbeat_recorded',
					heartbeatIntervalSeconds: 30,
				},
				{
					presenceRosterEntries: [
						{
							key: 'presence-same-user-other-tab',
							identityVisibility: 'self',
							relationship: 'same_user_other_tab',
							freshness: 'current',
						},
					],
				}
			);
		const rosterState =
			getDistributedEditingPresenceRosterStateForSessionState(
				normalized
			);

		expect( normalized ).toMatchObject( {
			presenceHeartbeatStatus:
				DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.SENT,
			presenceHeartbeatMarksLocalEditorCurrent: true,
			presenceHeartbeatMarksLocalEditorDelayed: false,
			presenceHeartbeatLocalRosterEntryVisible: false,
			presenceHeartbeatLocalRosterEntryFreshness: null,
			presenceRosterVisibleCount: 1,
			presenceRosterEntries: [
				{
					key: 'presence-same-user-other-tab',
					relationship: 'same_user_other_tab',
					freshness: 'current',
					exposesUserId: false,
					exposesCursorOffset: false,
					exposesSelection: false,
					exposesRawContent: false,
				},
			],
		} );
		expect( rosterState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.ACTIVE,
			currentVisibleCount: 1,
			delayedVisibleCount: 0,
			copy: {
				summary: 'You have this post open in another tab.',
				countSummary: '1 editor is active now.',
			},
			claimsAbsence: false,
			callsRestEndpoint: false,
			callsSave: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect(
			normalized.presenceRosterEntries.some(
				( entry ) => entry.relationship === 'current_user_current_tab'
			)
		).toBe( false );
	} );

	it( 'summarizes mixed local, duplicate-tab, current remote, and delayed remote roster rows', () => {
		const rosterState =
			getDistributedEditingPresenceRosterStateForSessionState( {
				presenceRosterEntries: [
					{
						key: 'presence-local-heartbeat-current-tab',
						identityVisibility: 'self',
						relationship: 'current_user_current_tab',
						freshness: 'recent',
					},
					{
						key: 'presence-same-user-other-tab',
						identityVisibility: 'self',
						relationship: 'same_user_other_tab',
						freshness: 'current',
					},
					{
						key: 'presence-mira',
						displayName: 'Mira',
						identityVisibility: 'named',
						relationship: 'other_user',
						freshness: 'current',
					},
					{
						key: 'presence-sam',
						displayName: 'Sam',
						identityVisibility: 'named',
						relationship: 'other_user',
						freshness: 'recent',
					},
				],
				presenceRosterHiddenCount: 1,
				presenceRosterExpiredCount: 1,
				presenceRosterTotalKnownCount: 5,
			} );

		expect( rosterState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.RECENT,
			visibleCount: 4,
			currentVisibleCount: 2,
			delayedVisibleCount: 2,
			localCurrentTabVisible: true,
			sameUserOtherTabVisible: true,
			remoteVisibleCount: 2,
			remoteCurrentVisibleCount: 1,
			remoteDelayedVisibleCount: 1,
			hiddenCount: 1,
			expiredCount: 1,
			totalKnownCount: 5,
			copy: {
				summary:
					'Your presence may be delayed. You have this post open in another tab. Mira is also editing this post. Sam was here recently. Presence may be delayed.',
				countSummary:
					'2 editors are active now; 2 editors may be delayed. Some editor activity is hidden by roster limits or privacy settings. Some editor activity expired before this refresh.',
			},
			claimsAbsence: false,
			callsRestEndpoint: false,
			callsSave: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( JSON.stringify( rosterState ) ).not.toMatch(
			/rawContent|userId|raw_session_key|rawSelection|selectedText|"clientId"|cursor_offset/
		);
	} );

	it( 'keeps remote freshness and anonymous labels distinct under sustained presence cadence', () => {
		const rosterState =
			getDistributedEditingPresenceRosterStateForSessionState( {
				presenceRosterEntries: [
					{
						key: 'presence-local-heartbeat-current-tab',
						identityVisibility: 'self',
						relationship: 'current_user_current_tab',
						freshness: 'current',
					},
					{
						key: 'presence-same-user-other-tab',
						identityVisibility: 'self',
						relationship: 'same_user_other_tab',
						freshness: 'current',
					},
					{
						key: 'presence-mira',
						displayName: 'Mira',
						identityVisibility: 'named',
						relationship: 'other_user',
						freshness: 'current',
					},
					{
						key: 'presence-anonymous-current',
						identityVisibility: 'anonymous',
						relationship: 'other_user',
						freshness: 'current',
					},
					{
						key: 'presence-sam',
						displayName: 'Sam',
						identityVisibility: 'named',
						relationship: 'other_user',
						freshness: 'recent',
					},
					{
						key: 'presence-anonymous-delayed',
						identityVisibility: 'anonymous',
						relationship: 'other_user',
						freshness: 'recent',
					},
				],
				presenceRosterExpiredCount: 2,
				presenceRosterTotalKnownCount: 8,
			} );

		expect( rosterState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.RECENT,
			visibleCount: 6,
			currentVisibleCount: 4,
			delayedVisibleCount: 2,
			localCurrentTabVisible: true,
			sameUserOtherTabVisible: true,
			remoteVisibleCount: 4,
			remoteCurrentVisibleCount: 2,
			remoteDelayedVisibleCount: 2,
			expiredCount: 2,
			totalKnownCount: 8,
			copy: {
				summary:
					'You are visible in this editing session. You have this post open in another tab. Mira and Another editor are also editing this post. Sam and Another editor were here recently. Presence may be delayed.',
				countSummary:
					'4 editors are active now; 2 editors may be delayed. Some editor activity expired before this refresh.',
			},
			claimsAbsence: false,
			callsRestEndpoint: false,
			callsSave: false,
			mutatesEditorContent: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( rosterState.entries[ 3 ] ).toMatchObject( {
			key: 'presence-anonymous-current',
			identityVisibility: 'anonymous',
			freshness: 'current',
			exposesUserId: false,
			exposesSelection: false,
			exposesCursorOffset: false,
		} );
		expect( rosterState.entries[ 5 ] ).toMatchObject( {
			key: 'presence-anonymous-delayed',
			identityVisibility: 'anonymous',
			freshness: 'recent',
			exposesUserId: false,
			exposesSelection: false,
			exposesCursorOffset: false,
		} );
		expect( JSON.stringify( rosterState ) ).not.toMatch(
			/rawContent|userId|raw_session_key|rawSelection|selectedText|"clientId"|cursor_offset/
		);
	} );

	it( 'summarizes high-count remote rows with hidden and expired aggregate evidence', () => {
		const rosterState =
			getDistributedEditingPresenceRosterStateForSessionState( {
				presenceRosterEntries: [
					{
						key: 'presence-local-heartbeat-current-tab',
						identityVisibility: 'self',
						relationship: 'current_user_current_tab',
						freshness: 'current',
					},
					{
						key: 'presence-same-user-other-tab',
						identityVisibility: 'self',
						relationship: 'same_user_other_tab',
						freshness: 'current',
					},
					{
						key: 'presence-mira',
						displayName: 'Mira',
						identityVisibility: 'named',
						relationship: 'other_user',
						freshness: 'current',
					},
					{
						key: 'presence-quinn',
						displayName: 'Quinn',
						identityVisibility: 'named',
						relationship: 'other_user',
						freshness: 'current',
					},
					{
						key: 'presence-anonymous-current',
						identityVisibility: 'anonymous',
						relationship: 'other_user',
						freshness: 'current',
					},
					{
						key: 'presence-theo',
						displayName: 'Theo',
						identityVisibility: 'named',
						relationship: 'other_user',
						freshness: 'current',
					},
					{
						key: 'presence-sam',
						displayName: 'Sam',
						identityVisibility: 'named',
						relationship: 'other_user',
						freshness: 'recent',
					},
					{
						key: 'presence-priya',
						displayName: 'Priya',
						identityVisibility: 'named',
						relationship: 'other_user',
						freshness: 'recent',
					},
					{
						key: 'presence-anonymous-delayed',
						identityVisibility: 'anonymous',
						relationship: 'other_user',
						freshness: 'recent',
					},
				],
				presenceRosterHiddenCount: 4,
				presenceRosterExpiredCount: 2,
				presenceRosterTotalKnownCount: 15,
			} );

		expect( rosterState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.RECENT,
			visibleCount: 9,
			currentVisibleCount: 6,
			delayedVisibleCount: 3,
			localCurrentTabVisible: true,
			sameUserOtherTabVisible: true,
			remoteVisibleCount: 7,
			remoteCurrentVisibleCount: 4,
			remoteDelayedVisibleCount: 3,
			hiddenCount: 4,
			expiredCount: 2,
			totalKnownCount: 15,
			copy: {
				summary:
					'You are visible in this editing session. You have this post open in another tab. Mira, Quinn, and 2 others are also editing this post. Sam, Priya, and 1 other were here recently. Presence may be delayed.',
				countSummary:
					'6 editors are active now; 3 editors may be delayed. Some editor activity is hidden by roster limits or privacy settings. Some editor activity expired before this refresh.',
			},
			claimsAbsence: false,
			callsRestEndpoint: false,
			callsSave: false,
			mutatesEditorContent: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( JSON.stringify( rosterState ) ).not.toMatch(
			/rawContent|userId|raw_session_key|rawSelection|selectedText|"clientId"|cursor_offset|Hidden High Count/
		);
	} );

	it( 'preserves a local heartbeat row as delayed when an empty snapshot arrives first', () => {
		const normalized =
			getDistributedEditingSessionStateForPresenceSnapshotRefreshResult(
				{
					result: 'presence_roster_snapshot',
					presenceRoster: {
						status: 'empty',
						freshness: 'unknown',
						entries: [],
						visibleCount: 0,
						totalKnownCount: 0,
						hiddenCount: 0,
					},
				},
				{
					presenceRosterEntries: [
						{
							key: 'presence-local-heartbeat-current-tab',
							identityVisibility: 'self',
							relationship: 'current_user_current_tab',
							freshness: 'current',
						},
					],
				}
			);
		const rosterState =
			getDistributedEditingPresenceRosterStateForSessionState(
				normalized
			);

		expect( normalized ).toMatchObject( {
			presenceRosterRefreshStatus:
				DISTRIBUTED_EDITING_PRESENCE_REFRESH_STATUSES.REFRESHED,
			presenceRosterStatus:
				DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.RECENT,
			presenceRosterVisibleCount: 1,
			presenceRosterEntries: [
				{
					key: 'presence-local-heartbeat-current-tab',
					relationship: 'current_user_current_tab',
					freshness: 'recent',
					exposesUserId: false,
					exposesCursorOffset: false,
					exposesSelection: false,
					exposesRawContent: false,
				},
			],
			presenceRosterRefreshCallsSave: false,
			presenceRosterRefreshMutatesEditorContent: false,
			presenceRosterRefreshChangesPostLock: false,
			presenceRosterRefreshClaimsSaved: false,
		} );
		expect( rosterState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.RECENT,
			currentVisibleCount: 0,
			delayedVisibleCount: 1,
			copy: {
				summary: 'Your presence may be delayed.',
				countSummary: '1 editor may be delayed.',
			},
			claimsAbsence: false,
			callsSave: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
	} );

	it( 'preserves remote avatars through one transient empty snapshot', () => {
		const firstEmptySnapshot =
			getDistributedEditingSessionStateForPresenceSnapshotRefreshResult(
				{
					result: 'presence_roster_snapshot',
					presenceRoster: {
						status: 'empty',
						entries: [],
						totalKnownCount: 0,
						hiddenCount: 0,
						expiredCount: 0,
					},
				},
				{
					presenceRosterEntries: [
						{
							key: 'presence-mira',
							displayName: 'Mira',
							identityVisibility: 'named',
							relationship: 'other_user',
							freshness: 'current',
							documentState: {
								available: true,
								confirmedBaseVersion: '12',
								confirmedStateHash:
									'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
								hasPendingChanges: false,
							},
						},
					],
				}
			);
		const secondEmptySnapshot =
			getDistributedEditingSessionStateForPresenceSnapshotRefreshResult(
				{
					result: 'presence_roster_snapshot',
					presenceRoster: {
						status: 'empty',
						entries: [],
						totalKnownCount: 0,
						hiddenCount: 0,
						expiredCount: 0,
					},
				},
				firstEmptySnapshot
			);

		expect( firstEmptySnapshot ).toMatchObject( {
			presenceRosterStatus:
				DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.RECENT,
			presenceRosterVisibleCount: 1,
			presenceRosterEmptySnapshotPreservedEntries: true,
			presenceRosterEntries: [
				{
					key: 'presence-mira',
					displayName: 'Mira',
					relationship: 'other_user',
					freshness: 'recent',
					documentState: {
						available: true,
						confirmedBaseVersion: '12',
					},
				},
			],
			presenceRosterRefreshCallsSave: false,
			presenceRosterRefreshChangesPostLock: false,
			presenceRosterRefreshClaimsSaved: false,
		} );
		expect( secondEmptySnapshot ).toMatchObject( {
			presenceRosterStatus:
				DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.EMPTY,
			presenceRosterVisibleCount: 0,
			presenceRosterEntries: [],
			presenceRosterEmptySnapshotPreservedEntries: false,
		} );
		expect( JSON.stringify( firstEmptySnapshot ) ).not.toMatch(
			/rawContent|userId|raw_session_key|rawSelection|selectedText|"clientId"|cursor_offset/
		);
	} );

	it( 'keeps protected local changes when presence heartbeat storage is unavailable', () => {
		const normalized =
			getDistributedEditingSessionStateForPresenceHeartbeatResult(
				{
					code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_PRESENCE_STORAGE_UNAVAILABLE,
					message: 'Presence storage is unavailable.',
					data: {
						result: 'presence_storage_unavailable',
						status: 503,
						calls_rest_endpoint: true,
						records_presence_heartbeat: false,
						writes_presence: false,
					},
				},
				{
					pendingChangeCount: 1,
					canExportLocalUpdates: true,
					presenceRosterEntries: [
						{
							key: 'presence-existing',
							displayName: 'Mira',
							freshness: 'recent',
						},
					],
				}
			);

		expect( normalized ).toMatchObject( {
			pendingChangeCount: 1,
			hasPendingChanges: true,
			canExportLocalUpdates: true,
			presenceRosterVisibleCount: 1,
			presenceHeartbeatStatus:
				DISTRIBUTED_EDITING_PRESENCE_HEARTBEAT_STATUSES.STORAGE_UNAVAILABLE,
			presenceHeartbeatReason:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_PRESENCE_STORAGE_UNAVAILABLE,
			presenceHeartbeatRequested: true,
			presenceHeartbeatFailed: true,
			presenceHeartbeatCallsRestEndpoint: true,
			presenceHeartbeatRecordsPresenceHeartbeat: false,
			presenceHeartbeatWritesPresence: false,
			presenceHeartbeatCallsSave: false,
			presenceHeartbeatMutatesEditorContent: false,
			presenceHeartbeatChangesPostLock: false,
			presenceHeartbeatClaimsSaved: false,
			presenceHeartbeatRepeatedRefreshOptional: true,
		} );
	} );

	it( 'keeps repeated presence cadence disabled by default with no runtime side effects', () => {
		const normalized = normalizeDistributedEditingSessionState( {
			distributedEditingPresenceRepeatedRefreshRuntime: {
				explicitOptIn: false,
				hostProfile: 'cheap_shared_host',
				standardPollingIntervalSeconds: 30,
				cheapHostPollingIntervalSeconds: 120,
				heartbeatIntervalSeconds: 120,
				callsPresenceReadEndpointNow: true,
				callsHeartbeatEndpointNow: true,
				writesHeartbeatNow: true,
				startsPollingImmediately: true,
				callsSave: true,
				changesPostLock: true,
				claimsSaved: true,
				rawSessionKeyIncluded: true,
			},
		} );
		const runtimeState =
			getDistributedEditingPresenceRepeatedRefreshRuntimeStateForSessionState(
				normalized
			);

		expect( runtimeState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.DISABLED_BY_DEFAULT,
			localConnectionState:
				DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.DISABLED,
			requiresExplicitOptIn: true,
			runtimeEnabledByDefault: false,
			explicitOptIn: false,
			hostProfile: 'cheap_shared_host',
			selectedIntervalSeconds: 120,
			selectedHeartbeatIntervalSeconds: 120,
			schedulesNextRefresh: false,
			schedulesNextHeartbeat: false,
			callsPresenceReadEndpointNow: false,
			callsHeartbeatEndpointNow: false,
			recordsPresenceHeartbeatNow: false,
			writesHeartbeatNow: false,
			startsPollingImmediately: false,
			repeatedRefreshOptional: true,
			correctnessIndependentOfTransport: true,
			transportRequiredForCorrectness: false,
			dispatchesNotice: false,
			callsSave: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			changesPostLock: false,
			claimsAbsence: false,
			claimsSaved: false,
			exposesRawContent: false,
			rawSessionKeyIncluded: false,
			copy: {
				label: 'Presence updates',
				summary: 'Presence updates are off.',
			},
		} );
	} );

	it( 'records an explicit cheap-host repeated presence cadence as inert scheduled state', () => {
		const sessionState =
			getDistributedEditingSessionStateForPresenceRepeatedRefreshRuntimeConfig(
				{
					explicitOptIn: true,
					hostProfile: 'cheap_shared_host',
					standardPollingIntervalSeconds: 30,
					cheapHostPollingIntervalSeconds: 120,
					minimumPollingIntervalSeconds: 60,
					heartbeatIntervalSeconds: 120,
				},
				{
					pendingChangeCount: 1,
					canExportLocalUpdates: true,
				}
			);
		const runtimeState =
			getDistributedEditingPresenceRepeatedRefreshRuntimeStateForSessionState(
				sessionState
			);

		expect( sessionState ).toMatchObject( {
			pendingChangeCount: 1,
			canExportLocalUpdates: true,
			presenceRepeatedRefreshRuntimeStatus:
				DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.SCHEDULED,
			presenceRepeatedRefreshLocalConnectionState:
				DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.CONNECTED,
			presenceRepeatedRefreshExplicitOptIn: true,
			presenceRepeatedRefreshRuntimeEnabledByDefault: false,
			presenceRepeatedRefreshSelectedIntervalSeconds: 120,
			presenceRepeatedRefreshSelectedHeartbeatIntervalSeconds: 120,
			presenceRepeatedRefreshStandardIntervalSeconds: 30,
			presenceRepeatedRefreshCheapHostIntervalSeconds: 120,
			presenceRepeatedRefreshMinimumIntervalSeconds: 60,
			presenceRepeatedRefreshSchedulesNextRefresh: true,
			presenceRepeatedRefreshSchedulesNextHeartbeat: true,
			presenceRepeatedRefreshCallsPresenceReadEndpointNow: false,
			presenceRepeatedRefreshCallsHeartbeatEndpointNow: false,
			presenceRepeatedRefreshStartsPollingImmediately: false,
			presenceRepeatedRefreshCallsSave: false,
			presenceRepeatedRefreshChangesPostLock: false,
			presenceRepeatedRefreshClaimsSaved: false,
		} );
		expect( runtimeState.copy.summary ).toBe(
			'Presence updates are scheduled about every 120 seconds.'
		);
	} );

	it( 'uses the local-development minimum for repeated presence cadence', () => {
		const sessionState =
			getDistributedEditingSessionStateForPresenceRepeatedRefreshRuntimeConfig(
				{
					explicitOptIn: true,
					hostProfile: 'local_development',
					standardPollingIntervalSeconds: 30,
					cheapHostPollingIntervalSeconds: 5,
					minimumPollingIntervalSeconds: 5,
					heartbeatIntervalSeconds: 5,
				}
			);
		const runtimeState =
			getDistributedEditingPresenceRepeatedRefreshRuntimeStateForSessionState(
				sessionState
			);

		expect( runtimeState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.SCHEDULED,
			hostProfile: 'local_development',
			selectedIntervalSeconds: 5,
			selectedHeartbeatIntervalSeconds: 5,
			schedulesNextRefresh: true,
			schedulesNextHeartbeat: true,
			callsSave: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( runtimeState.copy.summary ).toBe(
			'Presence updates are scheduled about every 5 seconds.'
		);
	} );

	it( 'lets repeated presence runtime config override the normalized default cadence', () => {
		const sessionState =
			getDistributedEditingSessionStateForPresenceRepeatedRefreshRuntimeConfig(
				{
					explicitOptIn: true,
					hostProfile: 'local_development',
					standardPollingIntervalSeconds: 30,
					cheapHostPollingIntervalSeconds: 5,
					minimumPollingIntervalSeconds: 5,
					heartbeatIntervalSeconds: 5,
				},
				{
					presenceRepeatedRefreshSelectedIntervalSeconds: 30,
				}
			);
		const runtimeState =
			getDistributedEditingPresenceRepeatedRefreshRuntimeStateForSessionState(
				sessionState
			);

		expect( runtimeState.selectedIntervalSeconds ).toBe( 5 );
		expect( runtimeState.selectedHeartbeatIntervalSeconds ).toBe( 5 );
	} );

	it( 'pauses repeated presence cadence while transport is degraded', () => {
		const sessionState =
			getDistributedEditingSessionStateForPresenceRepeatedRefreshRuntimeConfig(
				{
					explicitOptIn: true,
					serverContact: 'degraded',
					standardPollingIntervalSeconds: 30,
					cheapHostPollingIntervalSeconds: 120,
					heartbeatIntervalSeconds: 120,
				}
			);
		const runtimeState =
			getDistributedEditingPresenceRepeatedRefreshRuntimeStateForSessionState(
				sessionState
			);

		expect( runtimeState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.PAUSED_DEGRADED_TRANSPORT,
			localConnectionState:
				DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.DEGRADED,
			serverContact: 'degraded',
			selectedIntervalSeconds: 30,
			selectedHeartbeatIntervalSeconds: 120,
			schedulesNextRefresh: false,
			schedulesNextHeartbeat: false,
			pausesOnDegradedTransport: true,
			callsPresenceReadEndpointNow: false,
			callsHeartbeatEndpointNow: false,
			startsPollingImmediately: false,
			callsSave: false,
			changesPostLock: false,
			claimsSaved: false,
			copy: {
				summary:
					'Presence updates are paused while the connection is degraded.',
			},
		} );
	} );

	it( 'keeps initial presence startup manual by default without immediate side effects', () => {
		const normalized = normalizeDistributedEditingSessionState( {
			distributedEditingPresenceStartupPolicy: {
				allowAutomaticInitialHeartbeat: false,
				hostProfile: 'cheap_shared_host',
				standardInitialHeartbeatDelaySeconds: 10,
				cheapHostInitialHeartbeatDelaySeconds: 120,
				minimumInitialHeartbeatDelaySeconds: 60,
				callsHeartbeatEndpointNow: true,
				writesPresenceNow: true,
				startsPollingNow: true,
				startsTimerNow: true,
				callsSave: true,
				changesPostLock: true,
				claimsSaved: true,
				rawSessionKeyIncluded: true,
			},
		} );
		const startupPolicy =
			getDistributedEditingPresenceStartupPolicyStateForSessionState(
				normalized
			);

		expect( startupPolicy ).toMatchObject( {
			status: DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.MANUAL_REQUIRED,
			reason: 'cheap_host_requires_slow_startup',
			requiresExplicitEnablement: true,
			maySendInitialHeartbeatAutomatically: false,
			slowAutomaticHeartbeatAllowed: false,
			manualHeartbeatAvailable: true,
			hostProfile: 'cheap_shared_host',
			selectedInitialHeartbeatDelaySeconds: null,
			callsHeartbeatEndpointNow: false,
			recordsPresenceHeartbeatNow: false,
			writesPresenceNow: false,
			startsPollingNow: false,
			startsTimerNow: false,
			dispatchesNotice: false,
			callsSave: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			changesPostLock: false,
			claimsAbsence: false,
			claimsSaved: false,
			exposesRawContent: false,
			rawSessionKeyIncluded: false,
			correctnessIndependentOfTransport: true,
			transportRequiredForCorrectness: false,
			copy: {
				label: 'Presence startup',
				summary: 'Presence startup waits for a manual update.',
			},
		} );
	} );

	it( 'allows slow automatic initial presence only when cheap-host startup is explicit', () => {
		const sessionState =
			getDistributedEditingSessionStateForPresenceStartupPolicyConfig(
				{
					allowAutomaticInitialHeartbeat: true,
					allowSlowAutomaticInitialHeartbeat: true,
					hostProfile: 'cheap_shared_host',
					standardInitialHeartbeatDelaySeconds: 10,
					cheapHostInitialHeartbeatDelaySeconds: 120,
					minimumInitialHeartbeatDelaySeconds: 60,
				},
				{
					pendingChangeCount: 1,
					canExportLocalUpdates: true,
				}
			);
		const startupPolicy =
			getDistributedEditingPresenceStartupPolicyStateForSessionState(
				sessionState
			);

		expect( sessionState ).toMatchObject( {
			pendingChangeCount: 1,
			canExportLocalUpdates: true,
			presenceStartupPolicyStatus:
				DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.SLOW_AUTOMATIC_HEARTBEAT_ALLOWED,
			presenceStartupPolicyReason: 'cheap_host_slow_startup_allowed',
			presenceStartupPolicyMaySendInitialHeartbeatAutomatically: true,
			presenceStartupPolicySlowAutomaticHeartbeatAllowed: true,
			presenceStartupPolicySelectedInitialHeartbeatDelaySeconds: 120,
			presenceStartupPolicyCallsHeartbeatEndpointNow: false,
			presenceStartupPolicyWritesPresenceNow: false,
			presenceStartupPolicyStartsPollingNow: false,
			presenceStartupPolicyStartsTimerNow: false,
			presenceStartupPolicyCallsSave: false,
			presenceStartupPolicyChangesPostLock: false,
			presenceStartupPolicyClaimsSaved: false,
		} );
		expect( startupPolicy.copy.summary ).toBe(
			'Initial presence may start automatically after about 120 seconds on cheap hosts.'
		);
	} );

	it( 'pauses initial presence startup policy while transport is degraded', () => {
		const sessionState =
			getDistributedEditingSessionStateForPresenceStartupPolicyConfig( {
				allowAutomaticInitialHeartbeat: true,
				serverContact: 'degraded',
				standardInitialHeartbeatDelaySeconds: 10,
			} );
		const startupPolicy =
			getDistributedEditingPresenceStartupPolicyStateForSessionState(
				sessionState
			);

		expect( startupPolicy ).toMatchObject( {
			status: DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.PAUSED_DEGRADED_TRANSPORT,
			reason: 'transport_degraded',
			serverContact: 'degraded',
			maySendInitialHeartbeatAutomatically: false,
			selectedInitialHeartbeatDelaySeconds: null,
			callsHeartbeatEndpointNow: false,
			writesPresenceNow: false,
			startsPollingNow: false,
			startsTimerNow: false,
			callsSave: false,
			changesPostLock: false,
			claimsSaved: false,
			copy: {
				summary:
					'Presence startup waits while server contact is degraded.',
			},
		} );
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

		expect( normalized ).toMatchObject( {
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
			retrySaveReviewApprovalProofEnvelope: null,
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
			reviewTokenRecoveryStatus:
				DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_STATUSES.NONE,
			reviewTokenRecoveryReason: null,
			reviewTokenRecoveryRequiresFreshReview: false,
			localUpdatesImportStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.NONE,
			localUpdatesImportReason: null,
			localUpdatesImportPostId: null,
			localUpdatesImportPostType: null,
			localUpdatesImportHasPostContent: false,
			localUpdatesImportHasAcceptedReviewApprovalProof: false,
			localUpdatesImportVerifiedPostContentHash: null,
			localUpdatesImportReviewRequestStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.NONE,
			localUpdatesImportReviewRequestReason: null,
			localUpdatesImportRequiresFreshReview: false,
			localUpdatesImportReviewActionKey: null,
			localUpdatesImportFreshReviewRequestResult: null,
			localUpdatesImportFreshReviewRequestAction: null,
			localUpdatesImportFreshReviewRequestRestRoute: null,
			localUpdatesImportFreshReviewRequestRecordId: null,
			localUpdatesImportFreshReviewRequestAccepted: false,
			localUpdatesImportFreshReviewRequestRequested: false,
			localUpdatesImportFreshReviewRequestSavesPost: false,
			localUpdatesImportFreshReviewRequestMutatesPostContent: false,
			localUpdatesImportFreshReviewRequestCreatesRevision: false,
			localUpdatesImportFreshReviewRequestClaimsSaved: false,
			localUpdatesImportFreshReviewDecisionStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.NONE,
			localUpdatesImportFreshReviewDecisionResult: null,
			localUpdatesImportFreshReviewDecisionRestRoute: null,
			localUpdatesImportFreshReviewDecisionAccepted: false,
			localUpdatesImportFreshReviewDecisionSubmitted: false,
			localUpdatesImportFreshReviewDecisionDecision: null,
			localUpdatesImportFreshReviewDecisionReason: null,
			localUpdatesImportFreshReviewDecisionItems: [],
			localUpdatesImportFreshReviewDecisionItemCount: 0,
			localUpdatesImportFreshReviewDecisionPendingCount: 0,
			localUpdatesImportFreshReviewDecisionApprovedCount: 0,
			localUpdatesImportFreshReviewDecisionRejectedCount: 0,
			localUpdatesImportFreshReviewDecisionPanelRequired: false,
			localUpdatesImportFreshReviewDecisionReady: false,
			localUpdatesImportFreshReviewDecisionReviewedBlockItems: [],
			localUpdatesImportFreshReviewDecisionReviewedBlockItemCount: 0,
			localUpdatesImportFreshReviewDecisionSavesPost: false,
			localUpdatesImportFreshReviewDecisionCallsNormalSavePost: false,
			localUpdatesImportFreshReviewDecisionCallsRetrySaveEndpoint: false,
			localUpdatesImportFreshReviewDecisionDispatchesNotice: false,
			localUpdatesImportFreshReviewDecisionMutatesEditorContent: false,
			localUpdatesImportFreshReviewDecisionMutatesPersistedPostContent: false,
			localUpdatesImportFreshReviewDecisionChangesPostLock: false,
			localUpdatesImportFreshReviewDecisionClaimsSaved: false,
			localUpdatesImportFreshReviewDecisionRawContentIncluded: false,
			localUpdatesImportFreshReviewDecisionExposesRawContent: false,
			localUpdatesImportFreshReviewDecisionExposesProofSignature: false,
			localUpdatesImportFreshReviewDecisionExposesReviewerIds: false,
			localUpdatesImportFreshReviewRetrySaveHandoffStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.NONE,
			localUpdatesImportFreshReviewRetrySaveHandoffReason: null,
			localUpdatesImportFreshReviewRetrySaveHandoffResult: null,
			localUpdatesImportFreshReviewRetrySaveHandoffRestRoute: null,
			localUpdatesImportFreshReviewRetrySaveHandoffReady: false,
			localUpdatesImportFreshReviewRetrySaveHandoffValidating: false,
			localUpdatesImportFreshReviewRetrySaveHandoffAccepted: false,
			localUpdatesImportFreshReviewRetrySaveHandoffCallsNormalSavePost: false,
			localUpdatesImportFreshReviewRetrySaveHandoffCallsRetrySaveEndpoint: false,
			localUpdatesImportFreshReviewRetrySaveHandoffDispatchesNotice: false,
			localUpdatesImportFreshReviewRetrySaveHandoffMutatesEditorContent: false,
			localUpdatesImportFreshReviewRetrySaveHandoffMutatesPersistedPostContent: false,
			localUpdatesImportFreshReviewRetrySaveHandoffChangesPostLock: false,
			localUpdatesImportFreshReviewRetrySaveHandoffClaimsSaved: false,
			localUpdatesImportFreshReviewRetrySaveHandoffExposesRawContent: false,
			localUpdatesImportFreshReviewRetrySaveHandoffExposesProofSignature: false,
			localUpdatesImportFreshReviewRetrySaveHandoffExposesReviewerIds: false,
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
			'<!-- wp:freeform --><p><script type="wp/post-sync-meta" data-sync-meta-format="diff-match-patch">{"version":"server-v7","previous_version":"server-v6"}</script></p><!-- /wp:freeform -->';
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

	it( 'rebases stale-base local changes across formatted serialized block spacing', () => {
		const serializeParagraph = ( text ) =>
			`<!-- wp:paragraph -->\n<p>${ text }</p>\n<!-- /wp:paragraph -->`;
		const serializeParagraphs = ( firstText, secondText ) =>
			`${ serializeParagraph( firstText ) }\n\n${ serializeParagraph(
				secondText
			) }`;
		const baseContent = serializeParagraphs( 'Alpha', 'Beta' );
		const serverContent = serializeParagraphs( 'Alpha', 'Remote beta' );
		const localContent = serializeParagraphs( 'Local alpha', 'Beta' );
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
		} );
		expect( result.candidatePostContent ).toBe(
			serializeParagraphs( 'Local alpha', 'Remote beta' )
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

	it( 'rebases a local prepended block over a remote existing-block edit', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
		const serverContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote beta</p><!-- /wp:paragraph -->';
		const localContent =
			'<!-- wp:paragraph --><p>Local intro</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState: getReadyStaleBaseLocalRebaseSessionState(),
			clientBaseContent: baseContent,
			serverContent,
			localContent,
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
			reason: null,
			hasCandidatePostContent: true,
			mergedBlockCount: 3,
			readyToRetrySubmit: true,
			requiresManualConflictResolution: false,
		} );
		expect( result.candidatePostContent ).toBe(
			'<!-- wp:paragraph --><p>Local intro</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote beta</p><!-- /wp:paragraph -->'
		);
	} );

	it( 'rebases a remote prepended block around a local existing-block edit', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
		const serverContent =
			'<!-- wp:paragraph --><p>Remote intro</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
		const localContent =
			'<!-- wp:paragraph --><p>Local alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState: getReadyStaleBaseLocalRebaseSessionState(),
			clientBaseContent: baseContent,
			serverContent,
			localContent,
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
			reason: null,
			hasCandidatePostContent: true,
			mergedBlockCount: 3,
			readyToRetrySubmit: true,
			requiresManualConflictResolution: false,
		} );
		expect( result.candidatePostContent ).toBe(
			'<!-- wp:paragraph --><p>Remote intro</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Local alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->'
		);
	} );

	it( 'keeps middle insertions as manual conflicts when an existing block also changed', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Gamma</p><!-- /wp:paragraph -->';
		const serverContent =
			'<!-- wp:paragraph --><p>Remote alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Gamma</p><!-- /wp:paragraph -->';
		const localContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Local beta</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Gamma</p><!-- /wp:paragraph -->';
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState: getReadyStaleBaseLocalRebaseSessionState(),
			clientBaseContent: baseContent,
			serverContent,
			localContent,
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

	it( 'keeps same-count reorders as manual conflicts when the other side prepends', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
		const serverContent =
			'<!-- wp:paragraph --><p>Remote intro</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
		const localContent =
			'<!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph -->';
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState: getReadyStaleBaseLocalRebaseSessionState(),
			clientBaseContent: baseContent,
			serverContent,
			localContent,
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
			reason: 'block_reordered',
			hasCandidatePostContent: false,
			readyToRetrySubmit: false,
			requiresManualConflictResolution: true,
			sessionState: {
				localRebaseResultReason: 'block_reordered',
			},
		} );
	} );

	it( 'keeps ambiguous edge insertions as manual conflicts when repeated blocks hide insertion direction', () => {
		const repeatedBlock =
			'<!-- wp:paragraph --><p>Repeated</p><!-- /wp:paragraph -->';
		const baseContent = repeatedBlock + repeatedBlock;
		const serverContent =
			repeatedBlock +
			'<!-- wp:paragraph --><p>Remote repeated edit</p><!-- /wp:paragraph -->';
		const localContent = repeatedBlock + repeatedBlock + repeatedBlock;
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState: getReadyStaleBaseLocalRebaseSessionState(),
			clientBaseContent: baseContent,
			serverContent,
			localContent,
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

	it( 'rebases a local serialized block deletion over a remote retained-block edit', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Gamma</p><!-- /wp:paragraph -->';
		const serverContent =
			'<!-- wp:paragraph --><p>Remote alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Gamma</p><!-- /wp:paragraph -->';
		const localContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState: getReadyStaleBaseLocalRebaseSessionState(),
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
		} );
		expect( result.candidatePostContent ).toBe(
			'<!-- wp:paragraph --><p>Remote alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->'
		);
	} );

	it( 'rebases a remote serialized block deletion around a local retained-block edit', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Gamma</p><!-- /wp:paragraph -->';
		const serverContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
		const localContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Local beta</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Gamma</p><!-- /wp:paragraph -->';
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState: getReadyStaleBaseLocalRebaseSessionState(),
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
		} );
		expect( result.candidatePostContent ).toBe(
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Local beta</p><!-- /wp:paragraph -->'
		);
	} );

	it( 'keeps ambiguous repeated-block deletions as manual conflicts', () => {
		const repeatedBlock =
			'<!-- wp:paragraph --><p>Repeated</p><!-- /wp:paragraph -->';
		const baseContent = repeatedBlock + repeatedBlock;
		const serverContent =
			repeatedBlock +
			'<!-- wp:paragraph --><p>Remote repeated edit</p><!-- /wp:paragraph -->';
		const localContent = repeatedBlock;
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState: getReadyStaleBaseLocalRebaseSessionState(),
			clientBaseContent: baseContent,
			serverContent,
			localContent,
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
			reason: 'block_deleted',
			hasCandidatePostContent: false,
			readyToRetrySubmit: false,
			requiresManualConflictResolution: true,
			sessionState: {
				localRebaseResultReason: 'block_deleted',
			},
		} );
	} );

	it( 'keeps delete-versus-edit of the same serialized block as a manual conflict', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Beta</p><!-- /wp:paragraph -->';
		const serverContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Remote beta</p><!-- /wp:paragraph -->';
		const localContent =
			'<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph -->';
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState: getReadyStaleBaseLocalRebaseSessionState(),
			clientBaseContent: baseContent,
			serverContent,
			localContent,
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
			reason: 'block_deleted',
			hasCandidatePostContent: false,
			readyToRetrySubmit: false,
			requiresManualConflictResolution: true,
		} );
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
					client_base_version: '7',
					server_version: '7',
					rebased_from_version: '4',
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
			clientBaseVersion: '4',
			serverVersion: '7',
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

	it( 'marks guarded retry-save requests as pending without adding export noise to the basic Save path', () => {
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
			{ pendingChangeCount: 2, suppressExportDuringSave: true }
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
			retrySaveConfirmedMergedEdits: false,
			mustOfferLocalCopy: false,
			canExportLocalUpdates: false,
		} );
	} );

	it( 'normalizes idempotent already-persisted retry-save responses as saved', () => {
		const persistedContent =
			'<!-- wp:paragraph --><p>Demo content alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Duplicated content!</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Demo content beta.</p><!-- /wp:paragraph -->';
		const persistedRawContent = `<!-- wp:sync-meta {"format":"automerge"} -->\n<script type="application/json" data-wp-sync-meta="distributed-editing" data-sync-meta-format="automerge">{"schema":"de-rtc-automerge-v1","version":"2"}</script>\n<!-- /wp:sync-meta -->${ persistedContent }`;
		const normalized = getDistributedEditingSessionStateForRetrySaveResult(
			{
				result: 'retry_save_applied',
				retry_save_accepted: true,
				retry_save_duplicate: true,
				idempotent_no_write: true,
				already_persisted: true,
				previous_server_version: '1',
				server_version: '2',
				pending_change_count: 1,
				claims_saved: true,
				saves_post: false,
				mutates_post_content: false,
				creates_revision: false,
				content: {
					raw: persistedRawContent,
				},
			},
			{
				clientBaseVersion: '1',
				serverVersion: '1',
				pendingChangeCount: 1,
				hasPendingChanges: true,
				isAwaitingServerConfirmation: true,
				saveButtonClickInFlight: true,
				canExportLocalUpdates: true,
			}
		);

		expect( normalized ).toMatchObject( {
			disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
			reasonCode: null,
			clientBaseVersion: '2',
			clientBaseContent: persistedContent,
			serverVersion: '2',
			pendingChangeCount: 0,
			hasPendingChanges: false,
			isAwaitingServerConfirmation: false,
			saveButtonClickInFlight: false,
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
			retrySaveAccepted: true,
			retrySaveServerVersion: '2',
			retrySavePreviousServerVersion: '1',
			retrySaveSavesPost: false,
			retrySaveMutatesPostContent: false,
			retrySaveClaimsSaved: true,
			retrySaveIdempotentNoWrite: true,
			retrySaveAlreadyPersisted: true,
			mustOfferLocalCopy: false,
			canExportLocalUpdates: false,
		} );
		expect(
			hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState(
				normalized
			)
		).toBe( true );
	} );

	it( 'absorbs partial-safe retry-save content while keeping unsafe block review pending', () => {
		const safeServerContent =
			'<!-- wp:paragraph --><p>Demo content alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Duplicated content!</p><!-- /wp:paragraph --><!-- wp:html --><div>Demo content beta.</div><!-- /wp:html --><!-- wp:paragraph --><p>Demo content gamma.</p><!-- /wp:paragraph -->';
		const safeServerRawContent = `<!-- wp:sync-meta {"format":"automerge"} -->\n<script type="application/json" data-wp-sync-meta="distributed-editing" data-sync-meta-format="automerge">{"schema":"de-rtc-automerge-v1","version":"302"}</script>\n<!-- /wp:sync-meta -->${ safeServerContent }`;
		const normalized = getDistributedEditingSessionStateForRetrySaveResult(
			{
				result: 'retry_save_partial_safe_merge',
				reason_code: 'de_rtc_unfiltered_html_would_change_content',
				server_version: '302',
				pending_change_count: 1,
				pre_publish_review_required: true,
				partial_safe_merge_applied: true,
				partial_safe_merge_status: 'safe_subset_already_current',
				safe_server_content_included: true,
				unsafe_raw_content_included: false,
				content: {
					raw: safeServerRawContent,
				},
				review_items: [
					{
						id: 'unsafe-html-block',
						block_path: [ 2 ],
						block_name: 'core/html',
						change_kind: 'modified_block',
						review_status: 'pending_review',
						content_review_policy: 'kses',
						review_evidence_type: 'kses_block_hash_only_change',
						raw_content_included: false,
						exposes_raw_content: false,
					},
				],
				pending_review_item_count: 1,
			},
			{
				clientBaseVersion: '301',
				serverVersion: '301',
				clientBaseContent:
					'<!-- wp:paragraph --><p>Demo content alpha.</p><!-- /wp:paragraph --><!-- wp:html -->\n<div>Demo content beta.</div>\n<!-- /wp:html --><!-- wp:paragraph --><p>Demo content gamma.</p><!-- /wp:paragraph -->',
				pendingChangeCount: 2,
				hasPendingChanges: true,
				isAwaitingServerConfirmation: true,
				saveButtonClickInFlight: true,
				canExportLocalUpdates: true,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
				retrySubmitAccepted: true,
				retrySubmitSavePathRequired: true,
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				retrySubmitSaveReady: true,
			}
		);

		expect( normalized ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
			clientBaseVersion: '302',
			serverVersion: '302',
			clientBaseContent: safeServerContent,
			clientBaseSyncMeta: {
				schema: 'de-rtc-automerge-v1',
				version: '302',
			},
			refetchedServerContent: safeServerContent,
			refetchedServerState: true,
			requiresServerStateRefetch: false,
			pendingChangeCount: 1,
			hasPendingChanges: true,
			isAwaitingServerConfirmation: false,
			saveButtonClickInFlight: false,
			requiresManualConflictResolution: false,
			retrySubmitAccepted: false,
			retrySubmitSavePathRequired: false,
			retrySaveStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
			retrySaveAccepted: false,
			retrySaveServerVersion: '302',
			riskyBlockReviewStatus:
				DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
			riskyBlockReviewPendingCount: 1,
			riskyBlockReviewRawContentIncluded: false,
			riskyBlockReviewExposesRawContent: false,
			mustOfferLocalCopy: false,
			canExportLocalUpdates: false,
		} );
		expect(
			getDistributedEditingSaveButtonStateForSessionState( normalized )
		).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.ACCEPTED_BUT_UNCONSUMED,
			reason: 'partial_safe_review_pending',
			source: 'partial_safe_review',
			label: 'Save',
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
			disabled: false,
			blocksNormalSavePost: true,
			opensPrePublishReview: false,
			requiresServerStateRefetch: false,
		} );
		expect(
			getDistributedEditingSavePolicyStateForSessionState( normalized )
		).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.READY_FOR_REVIEWED_RETRY_SAVE,
			saveButtonLabel: 'Save',
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
			blocksNormalSavePost: true,
			opensPrePublishReview: false,
			requiresServerStateRefetch: false,
		} );

		const afterPresenceOrStatusRefresh =
			normalizeDistributedEditingSessionState( {
				...normalized,
				isAwaitingServerConfirmation: true,
				requiresManualConflictResolution: true,
			} );

		expect( afterPresenceOrStatusRefresh ).toMatchObject( {
			isAwaitingServerConfirmation: false,
			requiresManualConflictResolution: false,
			refetchedServerState: true,
			requiresServerStateRefetch: false,
		} );
	} );

	it( 'normalizes confirmed server-merged retry-save evidence as saved and content-free', () => {
		const mergedContent =
			'<!-- wp:paragraph --><p>Server edit.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Local edit.</p><!-- /wp:paragraph -->';
		const mergedRawContent = `<!-- wp:sync-meta {"format":"automerge"} -->\n<script type="application/json" data-wp-sync-meta="distributed-editing" data-sync-meta-format="automerge">{"schema":"de-rtc-automerge-v1","version":"52"}</script>\n<!-- /wp:sync-meta -->${ mergedContent }`;
		const normalized = getDistributedEditingSessionStateForRetrySaveResult(
			{
				result: 'retry_save_server_merged',
				retry_save_accepted: true,
				previous_server_version: '51',
				server_version: '52',
				pending_change_count: 1,
				saves_post: true,
				mutates_post_content: true,
				creates_revision: true,
				claims_saved: true,
				revision_created: true,
				created_revision_ids: [ 7003 ],
				server_merge_applied: true,
				server_merge: {
					merge_status: 'merged',
					merge_strategy: 'top_level_serialized_block_three_way',
					base_version: '50',
					server_version: '51',
					block_count: 2,
					server_changed_indexes: [ 1 ],
					local_changed_indexes: [ 0 ],
					merged_stripped_content_hash:
						'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
				},
				content: {
					raw: mergedRawContent,
				},
			},
			{
				serverVersion: '51',
				clientBaseContent:
					'<!-- wp:paragraph --><p>Old base.</p><!-- /wp:paragraph -->',
				pendingChangeCount: 1,
				saveButtonClickInFlight: true,
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
			pendingChangeCount: 0,
			hasPendingChanges: false,
			saveButtonClickInFlight: false,
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
			retrySaveAccepted: true,
			retrySaveServerVersion: '52',
			retrySavePreviousServerVersion: '51',
			retrySaveConfirmedMergedEdits: true,
			retrySaveServerMerged: true,
			retrySaveServerMergeApplied: true,
			retrySaveServerMergeStatus: 'merged',
			retrySaveServerMergeStrategy:
				'top_level_serialized_block_three_way',
			retrySaveServerMergeBaseVersion: '50',
			retrySaveServerMergeServerVersion: '51',
			retrySaveServerMergeBlockCount: 2,
			retrySaveServerMergeServerChangedIndexes: [ 1 ],
			retrySaveServerMergeLocalChangedIndexes: [ 0 ],
			retrySaveServerMergeMergedStrippedContentHash:
				'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
			clientBaseVersion: '52',
			clientBaseContent: mergedContent,
			clientBaseSyncMeta: {
				schema: 'de-rtc-automerge-v1',
				version: '52',
			},
			refetchedServerContent: null,
			refetchedServerState: false,
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

	it( 'communicates opaque token retry-save expiry and unknown-token failures without reconstructing proof', () => {
		const postContent =
			'<!-- wp:html --><script>still-protected</script><!-- /wp:html -->';
		const opaqueTokenEnvelope = {
			proof_envelope_type:
				DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_ENVELOPE_TYPE,
			token: 'de-rtc-review-token.expiring-copy',
			token_version: 1,
			issued_at: 1893456000,
			expires_at: 1893456300,
			post: {
				id: 44,
				type: 'post',
			},
		};
		const currentSessionState = {
			serverVersion: '12',
			clientBaseVersion: '7',
			pendingChangeCount: 1,
			hasPendingChanges: true,
			canExportLocalUpdates: true,
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
			retrySubmitAccepted: true,
			retrySubmitSavePathRequired: true,
			retrySubmitSaveStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
			retrySubmitSaveReady: true,
			retrySaveReviewApprovalProofStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
			retrySaveReviewApprovalAccepted: true,
			retrySaveReviewApprovalProofEnvelope: opaqueTokenEnvelope,
			retrySaveReviewApprovalReviewerUserId: 'reviewer-user-7',
			retrySaveReviewApprovalServerVersion: '12',
			retrySaveReviewApprovalRebasedFromVersion: '7',
			retrySaveReviewApprovalReviewedBlockItems: [
				{
					id: 'risk-html-approved',
					reviewStatus: 'approved_for_retry_save',
				},
			],
			retrySaveReviewApprovalProofSignature: 'signed-proof',
			retrySaveReviewApprovalRawContentIncluded: true,
		};
		const cases = [
			{
				label: 'unknown token',
				code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD,
				detail: 'unknown_retry_save_review_approval_proof_token',
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_MALFORMED_SYNC_PAYLOAD,
				status: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD,
				recoveryReason:
					DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_REASONS.TOKEN_UNAVAILABLE,
			},
			{
				label: 'expired token',
				code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
				detail: 'retry_save_review_approval_proof_token_expired',
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_SYNC_META_TAMPERED,
				status: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED,
				recoveryReason:
					DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_REASONS.TOKEN_EXPIRED,
			},
		];

		for ( const statusCase of cases ) {
			const normalized =
				getDistributedEditingSessionStateForRetrySaveResult(
					{
						code: statusCase.code,
						data: {
							reason_code: statusCase.code,
							detail: statusCase.detail,
							pending_change_count: 1,
							review_approval_proof_format:
								DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_ENVELOPE_TYPE,
							review_approval_proof_requires_new_review: true,
							can_export_local_updates: true,
						},
					},
					currentSessionState
				);
			const exportPayload =
				getDistributedEditingLocalUpdatesExportPayload( {
					currentPost: {
						id: 44,
						type: 'post',
					},
					editedPostContent: postContent,
					sessionState: normalized,
				} );

			expect( normalized ).toMatchObject( {
				disposition: statusCase.disposition,
				reasonCode: statusCase.code,
				retrySaveStatus: statusCase.status,
				retrySaveReason: statusCase.detail,
				retrySaveAccepted: false,
				retrySaveReviewApprovalProofStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.NONE,
				retrySaveReviewApprovalAccepted: false,
				retrySaveReviewApprovalProofEnvelope: null,
				retrySaveReviewApprovalReviewerUserId: null,
				retrySaveReviewApprovalReviewedBlockItems: [],
				retrySaveReviewApprovalProofSignature: null,
				retrySaveReviewApprovalRawContentIncluded: false,
				hasPendingChanges: true,
				isAwaitingServerConfirmation: true,
				canExportLocalUpdates: true,
				mustOfferLocalCopy: true,
				reviewTokenRecoveryStatus:
					DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_STATUSES.FRESH_REVIEW_REQUIRED,
				reviewTokenRecoveryReason: statusCase.recoveryReason,
				reviewTokenRecoveryRequiresFreshReview: true,
			} );
			expect(
				getDistributedEditingReviewTokenRecoveryStateForSessionState(
					normalized
				)
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_STATUSES.FRESH_REVIEW_REQUIRED,
				reason: statusCase.recoveryReason,
				requiresFreshReview: true,
				canExportLocalUpdates: true,
				actionKey:
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
				shouldCallRetrySaveEndpoint: false,
				shouldCallNormalSavePost: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
				exposesTokenInternals: false,
				exposesProofSignature: false,
				exposesReviewedBlockItems: false,
				exposesReviewerIds: false,
			} );
			expect( exportPayload.postContent ).toBe( postContent );
			expect( exportPayload.acceptedReviewApprovalProof ).toBeNull();
			expect( exportPayload.serverVersion ).toBe( '12' );
			expect( exportPayload.clientBaseVersion ).toBe( '7' );
			expect( exportPayload.reviewTokenRecovery ).toEqual( {
				status: DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_STATUSES.FRESH_REVIEW_REQUIRED,
				reason: statusCase.recoveryReason,
				requiresFreshReview: true,
				canExportLocalUpdates: true,
				serverVersion: '12',
				clientBaseVersion: '7',
			} );
			expect( JSON.stringify( exportPayload ) ).not.toContain(
				opaqueTokenEnvelope.token
			);
			expect( JSON.stringify( exportPayload ) ).not.toContain(
				'proof_signature'
			);
			expect( JSON.stringify( exportPayload ) ).not.toContain(
				'signed-proof'
			);
			expect( JSON.stringify( exportPayload ) ).not.toContain(
				'reviewer-user-7'
			);
			expect( JSON.stringify( exportPayload ) ).not.toContain(
				'reviewed_block_items'
			);
			expect( JSON.stringify( exportPayload ) ).not.toContain(
				'risk-html-approved'
			);
			expect( JSON.stringify( normalized ) ).not.toContain(
				'proof_signature'
			);
			expect( JSON.stringify( normalized ) ).not.toContain(
				'signed-proof'
			);
			expect( JSON.stringify( normalized ) ).not.toContain(
				'reviewer-user-7'
			);
			expect( JSON.stringify( normalized ) ).not.toContain(
				'risk-html-approved'
			);
			expect(
				getDistributedEditingLocalUpdatesImportResult( {
					payload: exportPayload,
					currentPost: {
						id: 44,
						type: 'post',
					},
					currentSessionState: {
						pendingChangeCount: 1,
						hasPendingChanges: true,
						canExportLocalUpdates: true,
					},
				} )
			).toMatchObject( {
				status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
				reason: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
				hasPostContent: false,
				hasAcceptedReviewApprovalProof: false,
				reviewRequestStatus:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.FRESH_REVIEW_REQUIRED,
				requiresFreshReview: true,
				reviewRequestActionKey:
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW,
				mutatesEditorContent: false,
				callsRetrySaveEndpoint: false,
				callsNormalSavePost: false,
				dispatchesNotice: false,
				changesPostLock: false,
				claimsSaved: false,
				sessionState: {
					canExportLocalUpdates: true,
					localUpdatesImportStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					localUpdatesImportReason:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
					localUpdatesImportReviewRequestStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.FRESH_REVIEW_REQUIRED,
					localUpdatesImportRequiresFreshReview: true,
					localUpdatesImportReviewActionKey:
						DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW,
				},
			} );
		}
	} );

	it( 'exposes requested fresh-review decision readiness without raw descriptor leakage', () => {
		const rawContentToken =
			'<script>fresh-review-decision-raw-content</script>';
		const proposedContentHash =
			'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
		const requestedState =
			getDistributedEditingSessionStateForFreshReviewDecisionItems(
				{
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					localUpdatesImportStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					localUpdatesImportReason:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
					localUpdatesImportReviewRequestStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
					localUpdatesImportFreshReviewRequestAccepted: true,
					localUpdatesImportFreshReviewRequestRequested: true,
				},
				{
					reviewItems: [
						{
							id: 'fresh-risk-html',
							blockClientId: 'block-fresh-risk-html',
							blockName: 'core/html',
							blockLabel: 'Custom HTML change',
							proposedContentHash,
							rawContent: rawContentToken,
							reviewerId: 7,
							proofSignature: 'fresh-review-proof-signature',
						},
					],
				}
			);
		const decisionState =
			getDistributedEditingFreshReviewDecisionStateForSessionState(
				requestedState
			);
		const descriptors =
			getDistributedEditingNoticeDescriptorsForSessionState(
				requestedState
			);
		const descriptorJson = JSON.stringify( descriptors );

		expect( requestedState ).toMatchObject( {
			localUpdatesImportFreshReviewDecisionStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.AWAITING_REVIEW,
			localUpdatesImportFreshReviewDecisionPanelRequired: true,
			localUpdatesImportFreshReviewDecisionPendingCount: 1,
			localUpdatesImportFreshReviewDecisionSavesPost: false,
			localUpdatesImportFreshReviewDecisionCallsNormalSavePost: false,
			localUpdatesImportFreshReviewDecisionCallsRetrySaveEndpoint: false,
			localUpdatesImportFreshReviewDecisionDispatchesNotice: false,
			localUpdatesImportFreshReviewDecisionMutatesEditorContent: false,
			localUpdatesImportFreshReviewDecisionClaimsSaved: false,
			localUpdatesImportFreshReviewDecisionRawContentIncluded: false,
			localUpdatesImportFreshReviewDecisionExposesRawContent: false,
			localUpdatesImportFreshReviewDecisionExposesProofSignature: false,
			localUpdatesImportFreshReviewDecisionExposesReviewerIds: false,
		} );
		expect( decisionState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.AWAITING_REVIEW,
			panelRequired: true,
			ready: false,
			reviewItemCount: 1,
			pendingReviewItemCount: 1,
			reviewItems: [
				expect.objectContaining( {
					id: 'fresh-risk-html',
					proposedContentHash,
					rawContentIncluded: false,
					exposesRawContent: false,
					exposesProofSignature: false,
					exposesReviewerIds: false,
				} ),
			],
			savesPost: false,
			callsNormalSavePost: false,
			callsRetrySaveEndpoint: false,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			changesPostLock: false,
			claimsSaved: false,
			exposesRawContent: false,
		} );
		expect( descriptors ).toHaveLength( 2 );
		expect( descriptorJson ).toContain(
			'localUpdatesImportFreshReviewDecisionStatus'
		);
		expect( descriptorJson ).not.toContain( rawContentToken );
		expect( descriptorJson ).not.toContain(
			'fresh-review-proof-signature'
		);
		expect( descriptorJson ).not.toContain( 'reviewerId' );
		expect( descriptorJson ).not.toContain( 'reviewedBlockItems' );
		expect( descriptorJson ).not.toContain( 'fresh-risk-html' );
	} );

	it( 'opens safe fresh-review comparison state without exposing raw review content', () => {
		const baseSerializedBlock =
			'<!-- wp:paragraph --><p>Original board-safe paragraph.</p><!-- /wp:paragraph -->';
		const proposedSerializedBlock =
			'<!-- wp:paragraph --><p>Updated board-safe paragraph.</p><!-- /wp:paragraph -->';
		const requestedState =
			getDistributedEditingSessionStateForFreshReviewDecisionItems(
				{
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					localUpdatesImportStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					localUpdatesImportReason:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
					localUpdatesImportReviewRequestStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
					localUpdatesImportFreshReviewRequestAccepted: true,
					localUpdatesImportFreshReviewRequestRequested: true,
				},
				{
					reviewItems: [
						{
							id: 'fresh-safe-paragraph',
							blockClientId: 'fresh-safe-paragraph-client',
							blockName: 'core/paragraph',
							blockLabel: 'Safe paragraph change',
							baseContentHash:
								'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
							proposedContentHash:
								'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
							baseSerializedBlock,
							proposedSerializedBlock,
							privacyClass: 'synthetic-content',
						},
					],
				}
			);
		const decisionState =
			getDistributedEditingFreshReviewDecisionStateForSessionState(
				requestedState
			);
		const reviewItem = decisionState.reviewItems[ 0 ];

		expect( reviewItem ).toMatchObject( {
			id: 'fresh-safe-paragraph',
			canCompare: true,
			compareAction: expect.objectContaining( {
				actionKey:
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.COMPARE_FRESH_REVIEW_ITEM,
				canOpenReadOnlyComparisonSurface: true,
				callsRestEndpoint: false,
				callsSave: false,
				callsRetrySaveEndpoint: false,
				callsNormalSavePost: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				selectsBlock: false,
				movesFocus: false,
				opensComparison: true,
				claimsSaved: false,
				exposesRawContent: false,
				comparisonSurface: expect.objectContaining( {
					status: 'ready',
					mode: 'read_only_side_by_side_block_review',
					itemId: 'fresh-safe-paragraph',
					baseText: baseSerializedBlock,
					proposedText: proposedSerializedBlock,
					canOpenComparisonSurface: true,
					readOnly: true,
					renderable: true,
					rendersDiff: false,
					derivesPatch: false,
					callsRestEndpoint: false,
					callsSave: false,
					mutatesEditorContent: false,
					mutatesPersistedPostContent: false,
					changesPostLock: false,
					claimsSaved: false,
					rawContentIncluded: false,
					exposesRawContent: false,
				} ),
				comparePlan: expect.objectContaining( {
					canOpenReadOnlyComparisonSurface: true,
					opensComparison: true,
					callsRestEndpoint: false,
					callsSave: false,
					mutatesEditorContent: false,
					mutatesPersistedPostContent: false,
					claimsSaved: false,
				} ),
			} ),
			rawContentIncluded: false,
			exposesRawContent: false,
		} );
	} );

	it( 'records fresh-review approve and reject decisions as hash-only local evidence', () => {
		const approvedHash =
			'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
		const rejectedHash =
			'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
		const initialState =
			getDistributedEditingSessionStateForFreshReviewDecisionItems(
				{
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					localUpdatesImportStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					localUpdatesImportReason:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
					localUpdatesImportReviewRequestStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
					localUpdatesImportFreshReviewRequestAccepted: true,
					localUpdatesImportFreshReviewRequestRequested: true,
				},
				{
					reviewItems: [
						{
							id: 'fresh-approve',
							blockLabel: 'Approved HTML change',
							proposedContentHash: approvedHash,
							rawBlockContent: '<script>approve</script>',
						},
						{
							id: 'fresh-reject',
							blockLabel: 'Rejected HTML change',
							proposedContentHash: rejectedHash,
							rawBlockContent: '<script>reject</script>',
						},
					],
				}
			);
		const approvedState =
			getDistributedEditingSessionStateForFreshReviewDecisionItemResolution(
				initialState,
				{
					reviewItemId: 'fresh-approve',
					decision: 'approved',
				}
			);
		const resolvedState =
			getDistributedEditingSessionStateForFreshReviewDecisionItemResolution(
				approvedState,
				{
					reviewItemId: 'fresh-reject',
					decision: 'rejected',
					rejectionReason: 'unsafe_script_change',
				}
			);
		const decisionState = getDistributedEditingFreshReviewDecisionState( {
			distributedEditingSession: resolvedState,
		} );
		const reviewedBlockItems =
			getDistributedEditingReviewedBlockItemsForFreshReviewDecision(
				resolvedState
			);

		expect( decisionState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.READY,
			ready: true,
			pendingReviewItemCount: 0,
			approvedReviewItemCount: 1,
			rejectedReviewItemCount: 1,
			reviewedBlockItemCount: 2,
			savesPost: false,
			callsNormalSavePost: false,
			callsRetrySaveEndpoint: false,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( reviewedBlockItems ).toEqual( [
			expect.objectContaining( {
				id: 'fresh-approve',
				proposedContentHash: approvedHash,
				reviewedProposedContentHash: approvedHash,
				reviewStatus:
					DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.APPROVED_FOR_RETRY_SAVE,
				rawContentIncluded: false,
				exposesRawContent: false,
			} ),
			expect.objectContaining( {
				id: 'fresh-reject',
				proposedContentHash: rejectedHash,
				reviewedProposedContentHash: rejectedHash,
				reviewStatus:
					DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.REJECTED,
				rejectionReason: 'unsafe_script_change',
				rawContentIncluded: false,
				exposesRawContent: false,
			} ),
		] );
		expect( JSON.stringify( decisionState ) ).not.toContain(
			'<script>approve</script>'
		);
		expect( JSON.stringify( decisionState ) ).not.toContain(
			'<script>reject</script>'
		);
		expect( JSON.stringify( decisionState ) ).not.toContain(
			'rawBlockContent'
		);
	} );

	it( 'normalizes accepted fresh-review decision proof without claiming a save', () => {
		const proposedContentHash =
			'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';
		const readyState =
			getDistributedEditingSessionStateForFreshReviewDecisionItemResolution(
				getDistributedEditingSessionStateForFreshReviewDecisionItems(
					{
						serverVersion: '12',
						clientBaseVersion: '7',
						pendingChangeCount: 1,
						hasPendingChanges: true,
						canExportLocalUpdates: true,
						localUpdatesImportStatus:
							DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
						localUpdatesImportReason:
							DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
						localUpdatesImportReviewRequestStatus:
							DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
						localUpdatesImportFreshReviewRequestRecordId:
							'fresh-review-request-123',
						localUpdatesImportFreshReviewRequestAccepted: true,
						localUpdatesImportFreshReviewRequestRequested: true,
						localUpdatesImportVerifiedPostContentHash:
							proposedContentHash,
					},
					{
						reviewItems: [
							{
								id: 'fresh-proof-html',
								blockLabel: 'Fresh proof HTML',
								proposedContentHash,
								rawBlockContent:
									'<script>fresh decision raw content</script>',
							},
						],
					}
				),
				{
					reviewItemId: 'fresh-proof-html',
					decision: 'approved',
				}
			);
		const proofState =
			getDistributedEditingSessionStateForFreshReviewDecisionResult(
				{
					result: 'fresh_review_decision_approved_for_retry_save',
					fresh_review_decision: 'approved',
					fresh_review_request_status: 'decision_recorded',
					fresh_review_request_record_id: 'fresh-review-request-123',
					rest_route: 'post_fresh_review_decision',
					server_version: '12',
					client_base_version: '7',
					pending_change_count: 1,
					reviewed_block_item_count: 1,
					fresh_review_decision_accepted: true,
				},
				readyState
			);

		expect( proofState ).toMatchObject( {
			localUpdatesImportReviewRequestStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.DECISION_RECORDED,
			localUpdatesImportFreshReviewRequestRecordId:
				'fresh-review-request-123',
			localUpdatesImportFreshReviewDecisionStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED,
			localUpdatesImportFreshReviewDecisionResult:
				'fresh_review_decision_approved_for_retry_save',
			localUpdatesImportFreshReviewDecisionRestRoute:
				'post_fresh_review_decision',
			localUpdatesImportFreshReviewDecisionAccepted: true,
			localUpdatesImportFreshReviewDecisionSubmitted: true,
			localUpdatesImportFreshReviewDecisionDecision: 'approved',
			localUpdatesImportFreshReviewDecisionReviewedBlockItemCount: 1,
			localUpdatesImportFreshReviewDecisionSavesPost: false,
			localUpdatesImportFreshReviewDecisionCallsNormalSavePost: false,
			localUpdatesImportFreshReviewDecisionCallsRetrySaveEndpoint: false,
			localUpdatesImportFreshReviewDecisionDispatchesNotice: false,
			localUpdatesImportFreshReviewDecisionMutatesEditorContent: false,
			localUpdatesImportFreshReviewDecisionMutatesPersistedPostContent: false,
			localUpdatesImportFreshReviewDecisionChangesPostLock: false,
			localUpdatesImportFreshReviewDecisionClaimsSaved: false,
			localUpdatesImportFreshReviewDecisionRawContentIncluded: false,
			localUpdatesImportFreshReviewDecisionExposesRawContent: false,
			localUpdatesImportFreshReviewDecisionExposesProofSignature: false,
			localUpdatesImportFreshReviewDecisionExposesReviewerIds: false,
			canExportLocalUpdates: true,
			mustOfferLocalCopy: true,
		} );
		expect( JSON.stringify( proofState ) ).not.toContain(
			'fresh decision raw content'
		);
	} );

	it( 'stages and consumes fresh-review retry-save handoff validation without saving', () => {
		const proposedPostContentHash =
			'0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
		const candidatePostContentHash =
			'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
		const recordedState = normalizeDistributedEditingSessionState( {
			serverVersion: '12',
			clientBaseVersion: '7',
			pendingChangeCount: 1,
			hasPendingChanges: true,
			canExportLocalUpdates: true,
			localUpdatesImportStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			localUpdatesImportReason:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			localUpdatesImportVerifiedPostContentHash: proposedPostContentHash,
			localUpdatesImportReviewRequestStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.DECISION_RECORDED,
			localUpdatesImportFreshReviewRequestRecordId:
				'fresh-review-request-123',
			localUpdatesImportFreshReviewRequestAccepted: true,
			localUpdatesImportFreshReviewRequestRequested: true,
			localUpdatesImportFreshReviewDecisionStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED,
			localUpdatesImportFreshReviewDecisionResult:
				'fresh_review_decision_approved_for_retry_save',
			localUpdatesImportFreshReviewDecisionAccepted: true,
			localUpdatesImportFreshReviewDecisionSubmitted: true,
			localUpdatesImportFreshReviewDecisionDecision: 'approved',
			localUpdatesImportFreshReviewDecisionReviewedBlockItemCount: 1,
		} );
		const validatingState =
			getDistributedEditingSessionStateForFreshReviewRetrySaveHandoffValidation(
				recordedState,
				{
					proposedPostContentHash,
					candidatePostContentHash,
				}
			);
		const acceptedState =
			getDistributedEditingSessionStateForFreshReviewRetrySaveHandoffValidationResult(
				{
					result: 'fresh_review_decision_eligible_for_retry_save_handoff',
					rest_route: 'post_fresh_review_consume',
					fresh_review_decision_consumption_validated: true,
					fresh_review_decision_eligible_for_retry_save: true,
					fresh_review_request_record_id: 'fresh-review-request-123',
					client_base_version: '7',
					server_version: '12',
					reviewed_block_item_count: 1,
					proof_signature: 'fresh-review-proof-must-not-surface',
					raw_content: '<script>fresh-review-raw</script>',
					reviewer_user_id: 9,
				},
				validatingState
			);
		const handoffState =
			getDistributedEditingFreshReviewRetrySaveHandoffStateForSessionState(
				acceptedState
			);

		expect( validatingState ).toMatchObject( {
			localUpdatesImportFreshReviewRetrySaveHandoffStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.VALIDATING,
			localUpdatesImportFreshReviewRetrySaveHandoffValidating: true,
			localUpdatesImportFreshReviewRetrySaveHandoffProposedContentHash:
				proposedPostContentHash,
			localUpdatesImportFreshReviewRetrySaveHandoffCandidateContentHash:
				candidatePostContentHash,
			localUpdatesImportFreshReviewRetrySaveHandoffCallsNormalSavePost: false,
			localUpdatesImportFreshReviewRetrySaveHandoffCallsRetrySaveEndpoint: false,
			localUpdatesImportFreshReviewRetrySaveHandoffMutatesEditorContent: false,
			localUpdatesImportFreshReviewRetrySaveHandoffChangesPostLock: false,
			localUpdatesImportFreshReviewRetrySaveHandoffClaimsSaved: false,
		} );
		expect( handoffState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
			result: 'fresh_review_decision_eligible_for_retry_save_handoff',
			restRoute: 'post_fresh_review_consume',
			accepted: true,
			clientBaseVersion: '7',
			serverVersion: '12',
			proposedPostContentHash,
			candidatePostContentHash,
			callsNormalSavePost: false,
			callsRetrySaveEndpoint: false,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			changesPostLock: false,
			claimsSaved: false,
			exposesRawContent: false,
			exposesProofSignature: false,
			exposesReviewerIds: false,
		} );
		expect( JSON.stringify( handoffState ) ).not.toMatch(
			/fresh-review-raw|fresh-review-proof-must-not-surface|reviewer_user_id/
		);

		const acceptedValidation =
			getDistributedEditingAcceptedFreshReviewConsumeValidationForRetrySaveRequest(
				acceptedState
			);

		expect( acceptedValidation ).toMatchObject( {
			type: 'fresh_review_decision_consumption_validation',
			status: 'eligible_for_retry_save_handoff',
			result: 'fresh_review_decision_eligible_for_retry_save_handoff',
			restRoute: 'post_fresh_review_consume',
			freshReviewRequestRecordId: 'fresh-review-request-123',
			freshReviewRequestStatus: 'decision_recorded',
			freshReviewDecisionStatus: 'approved',
			clientBaseVersion: '7',
			serverVersion: '12',
			proposedPostContentHash,
			reviewedProposedContentHash: proposedPostContentHash,
			candidatePostContentHash,
			reviewedCandidateContentHash: candidatePostContentHash,
			reviewedBlockItemCount: 1,
			freshReviewDecisionConsumptionValidated: true,
			freshReviewDecisionEligibleForRetrySave: true,
			rawContentIncluded: false,
			exposesRawContent: false,
			exposesReviewerIds: false,
			savesPost: false,
			mutatesPostContent: false,
			createsRevision: false,
			claimsSaved: false,
		} );
		expect( JSON.stringify( acceptedValidation ) ).not.toMatch(
			/fresh-review-raw|fresh-review-proof-must-not-surface|reviewer_user_id|reviewerUserId/
		);
		expect(
			getDistributedEditingSessionStateForRetrySaveRequest(
				acceptedState,
				{
					pendingChangeCount: 1,
					acceptedFreshReviewConsumeValidation: acceptedValidation,
				}
			)
		).toMatchObject( {
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
			retrySaveFreshReviewConsumeValidationStatus:
				'accepted_for_retry_save',
			retrySaveFreshReviewConsumeValidationAccepted: true,
			retrySaveFreshReviewDecisionConsumptionValidated: true,
			retrySaveFreshReviewRequestRecordId: 'fresh-review-request-123',
			retrySaveFreshReviewClientBaseVersion: '7',
			retrySaveFreshReviewServerVersion: '12',
			retrySaveFreshReviewProposedContentHash: proposedPostContentHash,
			canExportLocalUpdates: true,
		} );
	} );

	it( 'describes fresh-review retry-save success and rejection without save fallback', () => {
		const proposedPostContentHash =
			'0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
		const savedState = getDistributedEditingSessionStateForRetrySaveResult(
			{
				result: 'retry_save_applied',
				retry_save_accepted: true,
				previous_server_version: '12',
				server_version: '13',
				saves_post: true,
				mutates_post_content: true,
				creates_revision: true,
				claims_saved: true,
				revision_created: true,
				created_revision_ids: [ 9013 ],
				proof_signature: 'fresh-review-success-proof',
				reviewer_user_id: 9,
			},
			{
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
				retrySaveFreshReviewConsumeValidationStatus:
					'accepted_for_retry_save',
				retrySaveFreshReviewConsumeValidationAccepted: true,
				retrySaveFreshReviewDecisionConsumptionValidated: true,
				retrySaveFreshReviewDecisionEligibleForRetrySave: true,
				retrySaveFreshReviewRequestRecordId: 'fresh-review-request-123',
				retrySaveFreshReviewClientBaseVersion: '7',
				retrySaveFreshReviewServerVersion: '12',
				retrySaveFreshReviewProposedContentHash:
					proposedPostContentHash,
				retrySaveFreshReviewReviewedProposedContentHash:
					proposedPostContentHash,
				retrySaveFreshReviewReviewedBlockItemCount: 1,
			}
		);
		const savedDescriptor =
			getDistributedEditingNoticeDescriptorsForSessionState(
				savedState
			).find(
				( descriptor ) =>
					descriptor.kind ===
					DISTRIBUTED_EDITING_NOTICE_KINDS.RETRY_SAVE
			);
		const rejectedState =
			getDistributedEditingSessionStateForRetrySaveResult(
				{
					code: DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					data: {
						reason_code:
							DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
						result: 'stale_base_rejected',
						server_version: '14',
						pending_change_count: 1,
						proof_signature: 'fresh-review-rejected-proof',
						reviewer_user_id: 9,
					},
				},
				{
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					retrySaveFreshReviewConsumeValidationStatus:
						'accepted_for_retry_save',
					retrySaveFreshReviewConsumeValidationAccepted: true,
					retrySaveFreshReviewDecisionConsumptionValidated: true,
					retrySaveFreshReviewDecisionEligibleForRetrySave: true,
					retrySaveFreshReviewRequestRecordId:
						'fresh-review-request-123',
					retrySaveFreshReviewClientBaseVersion: '7',
					retrySaveFreshReviewServerVersion: '12',
					retrySaveFreshReviewProposedContentHash:
						proposedPostContentHash,
					retrySaveFreshReviewReviewedProposedContentHash:
						proposedPostContentHash,
					retrySaveFreshReviewReviewedBlockItemCount: 1,
				}
			);
		const rejectedDescriptor =
			getDistributedEditingNoticeDescriptorsForSessionState(
				rejectedState
			).find(
				( descriptor ) =>
					descriptor.kind ===
					DISTRIBUTED_EDITING_NOTICE_KINDS.RETRY_SAVE
			);

		expect( savedState ).toMatchObject( {
			disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
			pendingChangeCount: 0,
			hasPendingChanges: false,
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
			retrySaveFreshReviewConsumeValidationAccepted: true,
			retrySaveFreshReviewDecisionConsumptionValidated: true,
			canExportLocalUpdates: false,
		} );
		expect( savedDescriptor ).toMatchObject( {
			status: 'success',
			priority: 'status',
			retrySaveFreshReviewConsumed: true,
			retrySaveFreshReviewRetrySaveAccepted: true,
			retrySaveFreshReviewRetrySaveRejected: false,
			retrySaveFreshReviewReviewedBlockItemCount: 1,
			actionKeys: [],
		} );
		expect( rejectedState ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
			retrySaveStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED,
			retrySaveFreshReviewConsumeValidationAccepted: true,
			retrySaveFreshReviewDecisionConsumptionValidated: true,
			canExportLocalUpdates: true,
			retrySaveHandoffAllowsNormalSaveFallback: false,
			retrySaveHandoffBlocksNormalSave: false,
		} );
		expect( rejectedDescriptor ).toMatchObject( {
			status: 'warning',
			priority: 'blocking',
			retrySaveFreshReviewConsumed: true,
			retrySaveFreshReviewRetrySaveAccepted: false,
			retrySaveFreshReviewRetrySaveRejected: true,
			retrySaveFreshReviewRequiresFreshReview: true,
			actionKeys: expect.arrayContaining( [
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
			] ),
		} );
		expect( JSON.stringify( savedDescriptor ) ).not.toMatch(
			/fresh-review-success-proof|reviewer_user_id|raw_content/
		);
		expect( JSON.stringify( rejectedDescriptor ) ).not.toMatch(
			/fresh-review-rejected-proof|reviewer_user_id|raw_content/
		);
	} );

	it( 'normalizes retry-save unfiltered HTML review rejections as in-editor review', () => {
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
			mustOfferLocalCopy: false,
			canExportLocalUpdates: false,
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
			canExportLocalUpdates: false,
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
					actionKeys: [],
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
			mustOfferLocalCopy: false,
			canExportLocalUpdates: false,
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
			actionKeys: [],
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

	it( 'preserves opaque review approval proof token envelopes from approval responses', () => {
		const opaqueTokenEnvelope = {
			proof_envelope_type:
				DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_ENVELOPE_TYPE,
			token: 'de-rtc-review-token.turn-0077',
			token_version: 1,
			issued_at: 1893456000,
			expires_at: 1893456300,
			post: {
				id: 44,
				type: 'post',
			},
		};
		const normalized =
			getDistributedEditingSessionStateForRetrySaveReviewApprovalProofResult(
				{
					result: 'review_approval_accepted_for_retry_save',
					review_approval_accepted: true,
					server_version: '12',
					pending_change_count: 1,
					proposed_post_content_hash:
						'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
					candidate_post_content_hash:
						'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
					review_approval_proof: opaqueTokenEnvelope,
					saves_post: false,
					mutates_post_content: false,
					creates_revision: false,
					claims_saved: false,
				},
				{
					serverVersion: '12',
					pendingChangeCount: 1,
					hasPendingChanges: true,
				}
			);

		expect( normalized ).toMatchObject( {
			retrySaveReviewApprovalProofStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
			retrySaveReviewApprovalAccepted: true,
			retrySaveReviewApprovalProofEnvelope: opaqueTokenEnvelope,
			retrySaveReviewApprovalProofSignature: null,
			retrySaveReviewApprovalReviewedBlockItems: [],
			retrySaveReviewApprovalPostId: '44',
			retrySaveReviewApprovalPostType: 'post',
			retrySaveReviewApprovalIssuedAt: '1893456000',
			retrySaveReviewApprovalExpiresAt: '1893456300',
			retrySaveReviewApprovalProposedContentHash:
				'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
		} );
		expect(
			getDistributedEditingAcceptedReviewApprovalProofForRetrySaveRequest(
				normalized
			)
		).toEqual( opaqueTokenEnvelope );
		expect(
			JSON.stringify(
				getDistributedEditingAcceptedReviewApprovalProofForRetrySaveRequest(
					normalized
				)
			)
		).not.toContain( 'proof_signature' );
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
			mustOfferLocalCopy: false,
			canExportLocalUpdates: false,
			riskyBlockReviewStatus:
				DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
			riskyBlockReviewItemCount: 1,
			riskyBlockReviewPendingCount: 1,
			riskyBlockReviewPrePublishPanelRequired: true,
			riskyBlockReviewSaveButtonLabel: 'Save',
			riskyBlockReviewSaveClickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
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
			saveButtonLabel: 'Save',
			saveClickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
			canExportLocalUpdates: false,
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
						saveAuthorityLabel:
							'HTML review required before Save for HTML',
						saveAuthorityMessage:
							'This highlighted block needs HTML review before Save can update the post.',
						hasSaveAuthorityCopy: true,
						reliesOnColorAlone: false,
					},
				} ),
			],
		} );
		expect( savePolicy ).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.REVIEW_REQUIRED,
			reason: 'risky_block_review_required',
			saveButtonLabel: 'Save',
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
			blocksNormalSavePost: true,
			opensPrePublishReview: false,
			requiresServerStateRefetch: false,
			reviewItemCount: 1,
			pendingReviewItemCount: 1,
			approvedReviewItemCount: 0,
			rejectedReviewItemCount: 0,
			saveButton: expect.objectContaining( {
				status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.REVIEW_BLOCKED,
				source: 'risky_block_review',
				label: 'Save',
				statusText:
					'WordPress will save safe edits and keep blocked blocks for review.',
				clickAction:
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
				authorityStatusText:
					'WordPress cannot update the post until risky changes are approved or removed.',
				blocksNormalSavePost: true,
				opensPrePublishReview: false,
				shouldCallNormalSavePost: false,
				shouldCallRetrySaveEndpoint: false,
				claimsSaved: false,
				exposesRawContent: false,
				exposesReviewerIds: false,
			} ),
			saveButtonStatus:
				DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.REVIEW_BLOCKED,
			saveButtonSource: 'risky_block_review',
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

	it( 'exposes fresh-review lifecycle as inert pre-save placement evidence', () => {
		const rawContentToken = 'fresh-review-pre-save-raw-token';
		const normalized = normalizeDistributedEditingSessionState( {
			pendingChangeCount: 1,
			hasPendingChanges: true,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
			localUpdatesImportStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			localUpdatesImportReason:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			localUpdatesImportRequiresFreshReview: true,
			localUpdatesImportReviewRequestStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
			localUpdatesImportFreshReviewRequestAccepted: true,
			localUpdatesImportFreshReviewRequestRequested: true,
			localUpdatesImportFreshReviewDecisionPanelRequired: true,
			localUpdatesImportFreshReviewDecisionItems: [
				{
					id: 'fresh-review-pre-save-html',
					blockClientId: 'client-html',
					blockName: 'core/html',
					blockLabel: 'HTML',
					changeKind: 'modified_block',
					riskReason: 'kses_would_remove_script',
					proposedContentHash:
						'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
					reviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW,
					rawContent: `<script>${ rawContentToken }</script>`,
					proofSignature: 'fresh-review-pre-save-proof',
					reviewerId: 7,
				},
			],
		} );
		const preSaveState =
			getDistributedEditingFreshReviewPreSaveStateForSessionState(
				normalized
			);
		const selectorState = { distributedEditingSession: normalized };
		const descriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( normalized );

		expect( preSaveState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REVIEW_REQUIRED,
			reason: 'fresh_review_required',
			placement:
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_PUBLISH_REVIEW,
			saveButtonLabel: 'Save',
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
			blocksNormalSavePost: true,
			opensPrePublishReview: true,
			requiresServerStateRefetch: false,
			canExportLocalUpdates: false,
			hasProtectedLocalChanges: true,
			requestAccepted: true,
			requested: true,
			decisionStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.AWAITING_REVIEW,
			decisionPanelRequired: true,
			decisionItemCount: 1,
			pendingDecisionItemCount: 1,
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			changesPostLock: false,
			claimsSaved: false,
			exposesRawContent: false,
			exposesProofSignature: false,
			exposesReviewerIds: false,
		} );
		expect(
			getDistributedEditingFreshReviewPreSaveState( selectorState )
		).toEqual( preSaveState );
		expect( descriptors ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					kind: DISTRIBUTED_EDITING_NOTICE_KINDS.LOCAL_UPDATES_IMPORT_BLOCKED,
					freshReviewPreSaveStatus:
						DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REVIEW_REQUIRED,
					freshReviewPreSavePlacement:
						DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_PUBLISH_REVIEW,
					freshReviewPreSaveBlocksNormalSavePost: true,
					freshReviewPreSaveOpensPrePublishReview: true,
					freshReviewPreSaveCanExportLocalUpdates: false,
					shouldCallNormalSavePost: false,
					shouldCallRetrySaveEndpoint: false,
					claimsSaved: false,
					exposesRawContent: false,
					exposesProofSignature: false,
					exposesReviewerIds: false,
				} ),
			] )
		);
		expect( JSON.stringify( preSaveState ) ).not.toContain(
			rawContentToken
		);
		expect( JSON.stringify( descriptors ) ).not.toContain(
			rawContentToken
		);
	} );

	it( 'classifies fresh-review comparison renderer capability maps without registration side effects', () => {
		// This helper name contains "Renderer", but it is not Testing Library render.
		// eslint-disable-next-line testing-library/render-result-naming-convention
		const resolveCapabilityMap =
			getDistributedEditingFreshReviewComparisonRendererCapabilityResolution;
		const missingCapabilityResolution = resolveCapabilityMap();
		const partialCapabilityResolution = resolveCapabilityMap( {
			candidateRendererCapabilityMap: {
				boundary_safe_diff_renderer: true,
				caller_supplied_renderer_name: true,
			},
		} );
		const completeCapabilityResolution = resolveCapabilityMap( {
			candidateRendererCapabilityMap: {
				boundary_safe_diff_renderer: true,
				human_review_controls: true,
			},
		} );

		expect( missingCapabilityResolution ).toMatchObject( {
			status: 'missing_required_capabilities',
			reason: 'missing_all_required_capabilities',
			resolverKind:
				'fresh_review_comparison_renderer_capability_resolver',
			requiredRendererCapabilityKeys: [
				'boundary_safe_diff_renderer',
				'human_review_controls',
			],
			presentRendererCapabilityKeys: [],
			presentRendererCapabilityCount: 0,
			missingRendererCapabilityKeys: [
				'boundary_safe_diff_renderer',
				'human_review_controls',
			],
			missingRendererCapabilityCount: 2,
			candidateRendererCapabilityKeyCount: 0,
			unknownCandidateRendererCapabilityCount: 0,
			allRequiredRendererCapabilitiesPresent: false,
			rendererCapabilitiesComplete: false,
			completeButDisabled: false,
			candidateMapAccepted: true,
			candidateMapStored: false,
			resolverOnly: true,
			registersRenderer: false,
			hasRegisteredRenderer: false,
			activatesRenderer: false,
			renderable: false,
			rendersPreview: false,
			computesDiff: false,
			opensPanel: false,
			callsRestEndpoint: false,
			callsSave: false,
			mutatesEditorContent: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( partialCapabilityResolution ).toMatchObject( {
			status: 'partial_required_capabilities',
			reason: 'missing_some_required_capabilities',
			presentRendererCapabilityKeys: [ 'boundary_safe_diff_renderer' ],
			presentRendererCapabilityCount: 1,
			missingRendererCapabilityKeys: [ 'human_review_controls' ],
			missingRendererCapabilityCount: 1,
			candidateRendererCapabilityKeyCount: 2,
			unknownCandidateRendererCapabilityCount: 1,
			allRequiredRendererCapabilitiesPresent: false,
			rendererCapabilitiesComplete: false,
			candidateMapStored: false,
			registersRenderer: false,
			renderable: false,
			rendersPreview: false,
			computesDiff: false,
			callsSave: false,
		} );
		expect( JSON.stringify( partialCapabilityResolution ) ).not.toContain(
			'caller_supplied_renderer_name'
		);
		expect( completeCapabilityResolution ).toMatchObject( {
			status: 'complete_but_disabled',
			reason: 'renderer_disabled_until_explicit_renderer_turn',
			presentRendererCapabilityKeys: [
				'boundary_safe_diff_renderer',
				'human_review_controls',
			],
			presentRendererCapabilityCount: 2,
			missingRendererCapabilityKeys: [],
			missingRendererCapabilityCount: 0,
			candidateRendererCapabilityKeyCount: 2,
			unknownCandidateRendererCapabilityCount: 0,
			allRequiredRendererCapabilitiesPresent: true,
			rendererCapabilitiesComplete: true,
			completeButDisabled: true,
			rendererDisabledAfterResolution: true,
			canMakePreviewShellRenderable: false,
			registersRenderer: false,
			hasRegisteredRenderer: false,
			activatesRenderer: false,
			renderable: false,
			rendersPreview: false,
			computesDiff: false,
			callsRestEndpoint: false,
			callsSave: false,
			savesPost: false,
			mutatesPersistedPostContent: false,
			claimsSaved: false,
		} );
	} );

	it( 'summarizes fresh-review comparison renderer capability classifications for support without retaining candidate maps', () => {
		const unsafeUnknownCapabilityKey = 'caller_supplied_renderer_name';
		// This helper name contains "Renderer", but it is not a Testing Library render helper.
		// eslint-disable-next-line testing-library/render-result-naming-convention
		const summarizeCapabilityMaps =
			getDistributedEditingFreshReviewComparisonRendererCapabilitySupportSummary;
		const supportSummary = summarizeCapabilityMaps( {
			candidateRendererCapabilityMaps: [
				{},
				{
					boundary_safe_diff_renderer: true,
					[ unsafeUnknownCapabilityKey ]: true,
				},
				{
					boundary_safe_diff_renderer: true,
					human_review_controls: true,
				},
			],
		} );

		expect( supportSummary ).toMatchObject( {
			status: 'available',
			available: true,
			schemaVersion: 1,
			summaryKind:
				'fresh_review_comparison_renderer_capability_support_summary',
			resolutionCount: 3,
			candidateMapCount: 3,
			missingRequiredCapabilitiesCount: 1,
			partialRequiredCapabilitiesCount: 1,
			completeButDisabledCount: 1,
			unavailableResolutionCount: 0,
			presentRendererCapabilityCount: 3,
			missingRendererCapabilityCount: 3,
			unknownCandidateRendererCapabilityCount: 1,
			candidateRendererCapabilityKeyCount: 4,
			hasMissingRequiredCapabilities: true,
			hasPartialRequiredCapabilities: true,
			hasCompleteButDisabledCapabilities: true,
			allCompleteButDisabled: false,
			aggregateOnly: true,
			resolverOnly: true,
			descriptorOnly: true,
			statusOnly: true,
			redacted: true,
			hashValuesRedacted: true,
			candidateMapsStored: false,
			unknownCandidateKeyNamesIncluded: false,
			rendererCodeIncluded: false,
			rawContentIncluded: false,
			exposesHashValues: false,
			exposesRawContent: false,
			exposesProofSignature: false,
			exposesTokenMaterial: false,
			exposesUserIdentity: false,
			exposesReviewerIds: false,
			exposesActorIds: false,
			canShareWithSupport: true,
			supportExportReady: true,
			supportBundleSafe: true,
			supportDiagnosticsOnly: true,
			registersRenderer: false,
			hasRegisteredRenderer: false,
			activatesRenderer: false,
			renderable: false,
			rendersPreview: false,
			computesDiff: false,
			opensPanel: false,
			callsRestEndpoint: false,
			callsSave: false,
			mutatesEditorContent: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( JSON.stringify( supportSummary ) ).not.toContain(
			unsafeUnknownCapabilityKey
		);
	} );

	it( 'exposes fresh-review pre-publish items and local decision action descriptors only', () => {
		const rawContentToken = 'fresh-review-pre-publish-raw-token';
		const approvedHash =
			'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
		const approvedBaseHash =
			'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
		const rejectedHash =
			'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
		const rejectedBaseHash =
			'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';
		const requestedState =
			getDistributedEditingSessionStateForFreshReviewDecisionItems(
				{
					pendingChangeCount: 1,
					hasPendingChanges: true,
					mustOfferLocalCopy: true,
					canExportLocalUpdates: true,
					localUpdatesImportStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					localUpdatesImportReason:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
					localUpdatesImportReviewRequestStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
					localUpdatesImportFreshReviewRequestAccepted: true,
					localUpdatesImportFreshReviewRequestRequested: true,
				},
				{
					reviewItems: [
						{
							id: 'fresh-review-pre-publish-approve',
							blockClientId: 'client-html-approve',
							blockName: 'core/html',
							blockLabel: 'Approved HTML',
							blockPath: [ 0 ],
							changeKind: 'modified_block',
							riskReason: 'kses_would_remove_script',
							baseContentHash: approvedBaseHash,
							proposedContentHash: approvedHash,
							rawContent: `<script>${ rawContentToken }</script>`,
							proofSignature: 'fresh-review-pre-publish-proof',
							reviewerId: 7,
						},
						{
							id: 'fresh-review-pre-publish-reject',
							blockClientId: 'client-html-reject',
							blockName: 'core/html',
							blockLabel: 'Rejected HTML',
							blockPath: [ 1 ],
							changeKind: 'deleted_block',
							riskReason: 'unfiltered_html_block_deleted',
							baseContentHash: rejectedBaseHash,
							proposedContentHash: rejectedHash,
							rawContent: `<script>${ rawContentToken }</script>`,
						},
					],
				}
			);
		const requestedPrePublishState =
			getDistributedEditingFreshReviewPrePublishStateForSessionState(
				requestedState
			);
		const selectorState = {
			distributedEditingSession: requestedState,
		};
		const ignoredUnknownDecision =
			getDistributedEditingSessionStateForFreshReviewDecisionItemResolution(
				requestedState,
				{
					reviewItemId: 'fresh-review-pre-publish-approve',
					decision: 'maybe',
				}
			);
		const approvedState =
			getDistributedEditingSessionStateForFreshReviewDecisionItemResolution(
				requestedState,
				{
					reviewItemId: 'fresh-review-pre-publish-approve',
					decision: 'approved',
				}
			);
		const resolvedState =
			getDistributedEditingSessionStateForFreshReviewDecisionItemResolution(
				approvedState,
				{
					reviewItemId: 'fresh-review-pre-publish-reject',
					decision: 'rejected',
					rejectionReason: 'reviewer_rejected_deleted_block',
				}
			);
		const resolvedPrePublishState =
			getDistributedEditingFreshReviewPrePublishStateForSessionState(
				resolvedState
			);

		expect( requestedPrePublishState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REVIEW_REQUIRED,
			placement:
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_PUBLISH_REVIEW,
			isActive: true,
			panelRequired: true,
			reviewListStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_REVIEW_LIST_STATUSES.AWAITING_REVIEW,
			saveButtonLabel: 'Save',
			saveClickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
			blocksNormalSavePost: true,
			opensPrePublishReview: true,
			canRecordLocalDecisions: true,
			canSubmitReviewDecision: false,
			reviewItemCount: 2,
			pendingReviewItemCount: 2,
			hasPendingReviewItems: true,
			allReviewItemsResolved: false,
			rendererCapabilitySupportSummary: expect.objectContaining( {
				status: 'available',
				summaryKind:
					'fresh_review_comparison_renderer_capability_support_summary',
				resolutionCount: 2,
				candidateMapCount: 2,
				missingRequiredCapabilitiesCount: 2,
				partialRequiredCapabilitiesCount: 0,
				completeButDisabledCount: 0,
				unknownCandidateRendererCapabilityCount: 0,
				candidateMapsStored: false,
				unknownCandidateKeyNamesIncluded: false,
				rendererCodeIncluded: false,
				resolverOnly: true,
				canShareWithSupport: true,
				supportExportReady: true,
				rawContentIncluded: false,
				exposesHashValues: false,
				exposesRawContent: false,
				registersRenderer: false,
				renderable: false,
				callsRestEndpoint: false,
				callsSave: false,
				claimsSaved: false,
			} ),
			hasRendererCapabilitySupportSummary: true,
			canShowRendererCapabilitySupportSummary: true,
			saveAction: expect.objectContaining( {
				actionKey:
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
				descriptorOnly: true,
				callsRestEndpoint: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
			} ),
			submitDecisionAction: expect.objectContaining( {
				actionKey:
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.SUBMIT_FRESH_REVIEW_DECISION,
				enabled: false,
				descriptorOnly: true,
				callsRestEndpoint: false,
			} ),
			exportAction: null,
			refetchAction: null,
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
			callsRestEndpoint: false,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			changesPostLock: false,
			claimsSaved: false,
			exposesRawContent: false,
			exposesProofSignature: false,
			exposesReviewerIds: false,
		} );
		expect( requestedPrePublishState.reviewItems[ 0 ] ).toMatchObject( {
			id: 'fresh-review-pre-publish-approve',
			proposedContentHash: approvedHash,
			isPendingReview: true,
			supportsJumpToBlock: true,
			supportsCompare: true,
			supportsComparePlan: true,
			canJumpToBlock: true,
			canCompare: true,
			canShowComparePlan: true,
			jumpToBlockAction: expect.objectContaining( {
				actionKey:
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.JUMP_TO_FRESH_REVIEW_ITEM,
				itemId: 'fresh-review-pre-publish-approve',
				blockClientId: 'client-html-approve',
				blockPath: [ 0 ],
				enabled: true,
				descriptorOnly: true,
				reportsCommandStatus: true,
				commandStatus: 'jump-target-available',
				commandStatusPlacement: 'fresh_review_decision_panel',
				callsRestEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				selectsBlock: false,
				movesFocus: false,
				opensComparison: false,
				claimsSaved: false,
				exposesRawContent: false,
			} ),
			compareAction: expect.objectContaining( {
				actionKey:
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.COMPARE_FRESH_REVIEW_ITEM,
				itemId: 'fresh-review-pre-publish-approve',
				baseContentHash: approvedBaseHash,
				proposedContentHash: approvedHash,
				enabled: true,
				reason: null,
				descriptorOnly: true,
				reportsCommandStatus: true,
				commandStatus: 'compare-evidence-available',
				commandStatusPlacement: 'fresh_review_decision_panel',
				callsRestEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				selectsBlock: false,
				movesFocus: false,
				opensComparison: false,
				claimsSaved: false,
				exposesRawContent: false,
				comparePlan: expect.objectContaining( {
					status: 'ready',
					itemId: 'fresh-review-pre-publish-approve',
					evidenceType: 'hash_only_serialized_block_compare_plan',
					hashEvidenceFields: [
						'baseContentHash',
						'proposedContentHash',
						'reviewedProposedContentHash',
					],
					hasBaseContentHash: true,
					hasProposedContentHash: true,
					hasReviewedProposedContentHash: true,
					comparisonInputShape: expect.objectContaining( {
						status: 'ready',
						schemaVersion: 1,
						inputKind:
							'fresh_review_serialized_block_comparison_inputs',
						comparisonMode: 'side_by_side_block_review',
						itemId: 'fresh-review-pre-publish-approve',
						inputSlots: [
							expect.objectContaining( {
								role: 'base',
								sourceField: 'baseContentHash',
								required: true,
								available: true,
								evidenceType: 'hash_field_reference',
								hashValueRedacted: true,
								rawContentIncluded: false,
								exposesHashValue: false,
								exposesRawContent: false,
							} ),
							expect.objectContaining( {
								role: 'proposed',
								sourceField: 'proposedContentHash',
								required: true,
								available: true,
							} ),
							expect.objectContaining( {
								role: 'reviewed',
								sourceField: 'reviewedProposedContentHash',
								required: false,
								available: true,
							} ),
						],
						availableInputRoles: [ 'base', 'proposed', 'reviewed' ],
						requiredInputRoles: [ 'base', 'proposed' ],
						optionalInputRoles: [ 'reviewed' ],
						requiredInputsAvailable: true,
						optionalInputsAvailable: true,
						boundaryPolicy: 'serialized_block_hash_only',
						boundaryKinds: [
							'serialized_block',
							'html_token',
							'json_token',
							'unicode_scalar',
							'rich_text_attribute',
						],
						usesSerializedBlockBoundaries: true,
						usesHashEvidenceOnly: true,
						descriptorOnly: true,
						redacted: true,
						hashValuesRedacted: true,
						sourceFieldNamesOnly: true,
						rawContentIncluded: false,
						exposesHashValues: false,
						exposesRawContent: false,
						exposesProofSignature: false,
						exposesReviewerIds: false,
						rendersDiff: false,
						opensComparison: false,
						derivesPatch: false,
						callsRestEndpoint: false,
						callsSave: false,
						callsNormalSavePost: false,
						callsRetrySaveEndpoint: false,
						dispatchesNotice: false,
						mutatesEditorContent: false,
						mutatesPersistedPostContent: false,
						selectsBlock: false,
						movesFocus: false,
						changesPostLock: false,
						claimsSaved: false,
					} ),
					comparisonSelectionHandoff: expect.objectContaining( {
						status: 'ready_to_select',
						reason: null,
						schemaVersion: 1,
						handoffKind:
							'fresh_review_comparison_selection_readiness',
						selectionTarget: 'fresh_review_review_item',
						comparisonMode: 'side_by_side_block_review',
						inputKind:
							'fresh_review_serialized_block_comparison_inputs',
						itemId: 'fresh-review-pre-publish-approve',
						requiredInputRoles: [ 'base', 'proposed' ],
						optionalInputRoles: [ 'reviewed' ],
						requiredInputsAvailable: true,
						optionalInputsAvailable: true,
						canSelectForFutureComparison: true,
						readyForFutureComparisonSelection: true,
						futureSelectionOnly: true,
						requiresUserCommandBeforeSelection: true,
						descriptorOnly: true,
						statusOnly: true,
						redacted: true,
						hashValuesRedacted: true,
						sourceFieldNamesOnly: true,
						rawContentIncluded: false,
						exposesHashValues: false,
						exposesRawContent: false,
						exposesProofSignature: false,
						exposesReviewerIds: false,
						rendersDiff: false,
						opensComparison: false,
						opensPanel: false,
						derivesPatch: false,
						callsRestEndpoint: false,
						callsSave: false,
						callsNormalSavePost: false,
						callsRetrySaveEndpoint: false,
						dispatchesNotice: false,
						mutatesEditorContent: false,
						mutatesPersistedPostContent: false,
						selectsBlock: false,
						selectsReviewItem: false,
						marksSelected: false,
						movesFocus: false,
						changesPostLock: false,
						claimsSaved: false,
					} ),
					comparisonPreviewShell: expect.objectContaining( {
						status: 'disabled_until_renderer_turn',
						reason: 'comparison_renderer_not_enabled',
						schemaVersion: 1,
						shellKind: 'fresh_review_side_by_side_preview_shell',
						previewMode: 'side_by_side_block_review',
						rendererStatus: 'not_registered',
						itemId: 'fresh-review-pre-publish-approve',
						inputKind:
							'fresh_review_serialized_block_comparison_inputs',
						selectionHandoffKind:
							'fresh_review_comparison_selection_readiness',
						requiredInputRoles: [ 'base', 'proposed' ],
						optionalInputRoles: [ 'reviewed' ],
						renderRequirementKeys: [
							'base_serialized_block_content',
							'proposed_serialized_block_content',
							'boundary_safe_diff_renderer',
							'human_review_controls',
						],
						optionalRenderRequirementKeys: [
							'reviewed_serialized_block_content',
						],
						boundaryPolicy: 'serialized_block_hash_only',
						boundaryKinds: [
							'serialized_block',
							'html_token',
							'json_token',
							'unicode_scalar',
							'rich_text_attribute',
						],
						requiredInputsAvailable: true,
						optionalInputsAvailable: true,
						readyForFutureComparisonSelection: true,
						disabledByDefault: true,
						requiresFutureRenderer: true,
						requiresExplicitRendererTurn: true,
						canOpenComparisonPreviewShell: false,
						renderable: false,
						previewShellOnly: true,
						descriptorOnly: true,
						statusOnly: true,
						redacted: true,
						hashValuesRedacted: true,
						sourceFieldNamesOnly: true,
						rawContentIncluded: false,
						exposesHashValues: false,
						exposesRawContent: false,
						exposesProofSignature: false,
						exposesReviewerIds: false,
						rendersPreview: false,
						rendersDiff: false,
						computesDiff: false,
						opensComparison: false,
						opensPanel: false,
						derivesPatch: false,
						callsRestEndpoint: false,
						callsSave: false,
						callsNormalSavePost: false,
						callsRetrySaveEndpoint: false,
						dispatchesNotice: false,
						mutatesEditorContent: false,
						mutatesPersistedPostContent: false,
						selectsBlock: false,
						selectsReviewItem: false,
						marksSelected: false,
						movesFocus: false,
						changesPostLock: false,
						claimsSaved: false,
						rendererReadiness: expect.objectContaining( {
							status: 'disabled_until_renderer_capabilities_registered',
							reason: 'comparison_renderer_capabilities_not_registered',
							available: true,
							schemaVersion: 1,
							registryEntryKind:
								'fresh_review_comparison_renderer_readiness',
							registryEntryStatus: 'disabled',
							registryEntryEnabled: false,
							registryEntryDisabledReason:
								'comparison_renderer_capabilities_not_registered',
							rendererId:
								'fresh_review_side_by_side_block_comparison_renderer',
							rendererRegistryScope:
								'editor_fresh_review_comparison_preview_shell',
							shellStatus: 'disabled_until_renderer_turn',
							shellReason: 'comparison_renderer_not_enabled',
							shellKind:
								'fresh_review_side_by_side_preview_shell',
							previewMode: 'side_by_side_block_review',
							rendererStatus: 'not_registered',
							registrationStatus: 'not_registered',
							capabilityRegistrationStatus:
								'missing_required_capabilities',
							capabilityRegistrationReason:
								'missing_all_required_capabilities',
							requiredRendererCapabilityKeys: [
								'boundary_safe_diff_renderer',
								'human_review_controls',
							],
							requiredRendererCapabilityCount: 2,
							registeredRendererCapabilityKeys: [],
							registeredRendererCapabilityCount: 0,
							presentRendererCapabilityKeys: [],
							presentRendererCapabilityCount: 0,
							missingRendererCapabilityKeys: [
								'boundary_safe_diff_renderer',
								'human_review_controls',
							],
							missingRendererCapabilityCount: 2,
							candidateRendererCapabilityKeyCount: 0,
							unknownCandidateRendererCapabilityCount: 0,
							allRequiredRendererCapabilitiesPresent: false,
							rendererCapabilitiesComplete: false,
							completeButDisabled: false,
							capabilityResolution: expect.objectContaining( {
								status: 'missing_required_capabilities',
								reason: 'missing_all_required_capabilities',
								resolverKind:
									'fresh_review_comparison_renderer_capability_resolver',
								presentRendererCapabilityKeys: [],
								presentRendererCapabilityCount: 0,
								missingRendererCapabilityKeys: [
									'boundary_safe_diff_renderer',
									'human_review_controls',
								],
								missingRendererCapabilityCount: 2,
								candidateRendererCapabilityKeyCount: 0,
								unknownCandidateRendererCapabilityCount: 0,
								allRequiredRendererCapabilitiesPresent: false,
								rendererCapabilitiesComplete: false,
								completeButDisabled: false,
								candidateMapAccepted: true,
								candidateMapStored: false,
								resolverOnly: true,
								registersRenderer: false,
								renderable: false,
								rendersPreview: false,
								computesDiff: false,
								callsRestEndpoint: false,
								callsSave: false,
							} ),
							hasCapabilityResolution: true,
							canShowCapabilityResolution: true,
							optionalRendererCapabilityKeys: [],
							optionalRendererCapabilityCount: 0,
							satisfiedRendererCapabilityKeys: [],
							satisfiedRendererCapabilityCount: 0,
							rendererRegistrationRequired: true,
							requiresBoundarySafeDiffRenderer: true,
							requiresHumanReviewControls: true,
							disabledByDefault: true,
							requiresFutureRenderer: true,
							requiresExplicitRendererTurn: true,
							canRegisterRenderer: false,
							registersRenderer: false,
							hasRegisteredRenderer: false,
							activatesRenderer: false,
							canMakePreviewShellRenderable: false,
							renderable: false,
							descriptorOnly: true,
							statusOnly: true,
							redacted: true,
							hashValuesRedacted: true,
							rawContentIncluded: false,
							exposesHashValues: false,
							exposesRawContent: false,
							exposesProofSignature: false,
							exposesTokenMaterial: false,
							exposesUserIdentity: false,
							exposesReviewerIds: false,
							exposesActorIds: false,
							rendersPreview: false,
							rendersDiff: false,
							computesDiff: false,
							opensComparison: false,
							opensPanel: false,
							derivesPatch: false,
							callsRestEndpoint: false,
							callsSave: false,
							callsNormalSavePost: false,
							callsRetrySaveEndpoint: false,
							dispatchesNotice: false,
							savesPost: false,
							mutatesEditorContent: false,
							mutatesPersistedPostContent: false,
							selectsBlock: false,
							selectsReviewItem: false,
							marksSelected: false,
							movesFocus: false,
							changesPostLock: false,
							claimsSaved: false,
						} ),
						hasRendererReadiness: true,
						canShowRendererReadiness: true,
						supportReport: expect.objectContaining( {
							status: 'available',
							available: true,
							schemaVersion: 1,
							reportKind:
								'fresh_review_comparison_preview_shell_support_report',
							headline:
								'Fresh-review comparison preview shell support report',
							summaryText:
								'Preview shell is disabled until a renderer turn registers boundary-safe diff rendering and review controls.',
							shellStatus: 'disabled_until_renderer_turn',
							shellReason: 'comparison_renderer_not_enabled',
							shellKind:
								'fresh_review_side_by_side_preview_shell',
							previewMode: 'side_by_side_block_review',
							rendererStatus: 'not_registered',
							itemIdentity: {
								itemId: 'fresh-review-pre-publish-approve',
								blockClientId: 'client-html-approve',
								blockName: 'core/html',
								blockLabel: 'Approved HTML',
								changeKind: 'modified_block',
							},
							availableItemIdentityFields: [
								'itemId',
								'blockClientId',
								'blockName',
								'blockLabel',
								'changeKind',
							],
							itemIdentityFieldCount: 5,
							requiredInputRoles: [ 'base', 'proposed' ],
							optionalInputRoles: [ 'reviewed' ],
							requiredInputsAvailable: true,
							optionalInputsAvailable: true,
							renderRequirementKeys: [
								'base_serialized_block_content',
								'proposed_serialized_block_content',
								'boundary_safe_diff_renderer',
								'human_review_controls',
							],
							optionalRenderRequirementKeys: [
								'reviewed_serialized_block_content',
							],
							missingFutureRendererPieceKeys: [
								'boundary_safe_diff_renderer',
								'human_review_controls',
							],
							missingFutureRendererPieceCount: 2,
							rendererReadinessStatus:
								'disabled_until_renderer_capabilities_registered',
							rendererReadinessRegistrationStatus:
								'not_registered',
							rendererReadinessCapabilityStatus:
								'missing_required_capabilities',
							rendererCapabilityResolutionStatus:
								'missing_required_capabilities',
							rendererCapabilityResolutionReason:
								'missing_all_required_capabilities',
							presentRendererCapabilityKeys: [],
							presentRendererCapabilityCount: 0,
							missingRendererCapabilityKeys: [
								'boundary_safe_diff_renderer',
								'human_review_controls',
							],
							missingRendererCapabilityCount: 2,
							unknownCandidateRendererCapabilityCount: 0,
							rendererCapabilitiesComplete: false,
							rendererCapabilityResolutionResolverOnly: true,
							rendererCapabilitySupportSummary:
								expect.objectContaining( {
									status: 'available',
									summaryKind:
										'fresh_review_comparison_renderer_capability_support_summary',
									resolutionCount: 1,
									candidateMapCount: 1,
									missingRequiredCapabilitiesCount: 1,
									partialRequiredCapabilitiesCount: 0,
									completeButDisabledCount: 0,
									unknownCandidateRendererCapabilityCount: 0,
									candidateMapsStored: false,
									unknownCandidateKeyNamesIncluded: false,
									rendererCodeIncluded: false,
									resolverOnly: true,
									canShareWithSupport: true,
									supportExportReady: true,
									rawContentIncluded: false,
									exposesHashValues: false,
									exposesRawContent: false,
									registersRenderer: false,
									renderable: false,
									callsRestEndpoint: false,
									callsSave: false,
									claimsSaved: false,
								} ),
							hasRendererCapabilitySupportSummary: true,
							canShowRendererCapabilitySupportSummary: true,
							rendererCapabilitySupportSummaryStatus: 'available',
							rendererCapabilitySupportSummaryResolutionCount: 1,
							rendererCapabilitySupportSummaryMissingCount: 1,
							rendererCapabilitySupportSummaryPartialCount: 0,
							rendererCapabilitySupportSummaryCompleteButDisabledCount: 0,
							rendererCapabilitySupportSummaryUnknownCandidateCount: 0,
							rendererCapabilitySupportSummaryCandidateMapsStored: false,
							rendererCapabilitySupportSummaryUnknownNamesIncluded: false,
							rendererCapabilitySupportSummaryRendererCodeIncluded: false,
							rendererCapabilitySupportSummaryResolverOnly: true,
							rendererReadinessRegistersRenderer: false,
							rendererReadinessRenderable: false,
							boundaryPolicy: 'serialized_block_hash_only',
							boundaryKinds: [
								'serialized_block',
								'html_token',
								'json_token',
								'unicode_scalar',
								'rich_text_attribute',
							],
							boundaryKindCount: 5,
							canShareWithSupport: true,
							supportExportReady: true,
							supportBundleSafe: true,
							supportDiagnosticsOnly: true,
							requiresFutureRenderer: true,
							requiresExplicitRendererTurn: true,
							canOpenComparisonPreviewShell: false,
							renderable: false,
							descriptorOnly: true,
							redacted: true,
							hashValuesRedacted: true,
							rawContentIncluded: false,
							exposesHashValues: false,
							exposesRawContent: false,
							exposesProofSignature: false,
							exposesTokenMaterial: false,
							exposesUserIdentity: false,
							exposesReviewerIds: false,
							exposesActorIds: false,
							rendersPreview: false,
							rendersDiff: false,
							computesDiff: false,
							opensComparison: false,
							opensPanel: false,
							derivesPatch: false,
							callsRestEndpoint: false,
							callsSave: false,
							callsNormalSavePost: false,
							callsRetrySaveEndpoint: false,
							dispatchesNotice: false,
							savesPost: false,
							mutatesEditorContent: false,
							mutatesPersistedPostContent: false,
							selectsBlock: false,
							selectsReviewItem: false,
							marksSelected: false,
							movesFocus: false,
							changesPostLock: false,
							claimsSaved: false,
						} ),
						hasSupportReport: true,
						canShowSupportReport: true,
					} ),
					usesBaseContentHash: true,
					usesProposedContentHash: true,
					usesReviewedProposedContentHash: true,
					supportsComparisonSelectionHandoff: true,
					supportsComparisonPreviewShell: true,
					canSelectForFutureComparison: true,
					canOpenComparisonPreviewShell: false,
					hashValuesRedacted: true,
					exposesHashValues: false,
					rendersDiff: false,
					opensComparison: false,
					callsRestEndpoint: false,
					callsSave: false,
					callsNormalSavePost: false,
					callsRetrySaveEndpoint: false,
					dispatchesNotice: false,
					mutatesEditorContent: false,
					mutatesPersistedPostContent: false,
					selectsBlock: false,
					movesFocus: false,
					changesPostLock: false,
					claimsSaved: false,
					exposesRawContent: false,
					exposesProofSignature: false,
					exposesReviewerIds: false,
				} ),
			} ),
			canApprove: true,
			canReject: true,
			approveAction: expect.objectContaining( {
				actionKey:
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.APPROVE_FRESH_REVIEW_ITEM,
				itemId: 'fresh-review-pre-publish-approve',
				decision: 'approved',
				enabled: true,
				descriptorOnly: true,
				callsRestEndpoint: false,
				dispatchesNotice: false,
			} ),
			rejectAction: expect.objectContaining( {
				actionKey:
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.REJECT_FRESH_REVIEW_ITEM,
				itemId: 'fresh-review-pre-publish-approve',
				decision: 'rejected',
				enabled: true,
				descriptorOnly: true,
				callsRestEndpoint: false,
				dispatchesNotice: false,
			} ),
			rawContentIncluded: false,
			exposesRawContent: false,
			exposesProofSignature: false,
			exposesReviewerIds: false,
		} );
		expect(
			requestedPrePublishState.reviewItems[ 0 ].actionDescriptors.map(
				( descriptor ) => descriptor.actionKey
			)
		).toEqual( [
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.JUMP_TO_FRESH_REVIEW_ITEM,
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.COMPARE_FRESH_REVIEW_ITEM,
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.APPROVE_FRESH_REVIEW_ITEM,
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.REJECT_FRESH_REVIEW_ITEM,
		] );
		expect(
			getDistributedEditingFreshReviewPrePublishState( selectorState )
		).toEqual( requestedPrePublishState );
		expect(
			getDistributedEditingFreshReviewDecisionStateForSessionState(
				ignoredUnknownDecision
			)
		).toMatchObject( {
			pendingReviewItemCount: 2,
			approvedReviewItemCount: 0,
			rejectedReviewItemCount: 0,
		} );
		expect( resolvedPrePublishState ).toMatchObject( {
			decisionStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.READY,
			reviewListStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_REVIEW_LIST_STATUSES.DECISION_READY,
			canRecordLocalDecisions: true,
			canSubmitReviewDecision: true,
			pendingReviewItemCount: 0,
			approvedReviewItemCount: 1,
			rejectedReviewItemCount: 1,
			allReviewItemsResolved: true,
			reviewedBlockItemCount: 2,
			submitDecisionAction: expect.objectContaining( {
				actionKey:
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.SUBMIT_FRESH_REVIEW_DECISION,
				enabled: true,
				descriptorOnly: true,
				callsRestEndpoint: false,
			} ),
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
			claimsSaved: false,
		} );
		expect( resolvedPrePublishState.reviewItems ).toEqual( [
			expect.objectContaining( {
				id: 'fresh-review-pre-publish-approve',
				isApprovedForRetrySave: true,
				supportsJumpToBlock: true,
				supportsCompare: true,
				canApprove: false,
				canReject: true,
			} ),
			expect.objectContaining( {
				id: 'fresh-review-pre-publish-reject',
				isRejected: true,
				supportsJumpToBlock: true,
				supportsCompare: true,
				canApprove: true,
				canReject: false,
				rejectionReason: 'reviewer_rejected_deleted_block',
			} ),
		] );
		expect( requestedPrePublishState.actionKeys ).toEqual( [
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
		] );
		expect( requestedPrePublishState.actionKeys ).not.toContain(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.SUBMIT_FRESH_REVIEW_DECISION
		);
		expect( requestedPrePublishState.actionKeys ).not.toContain(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE
		);
		expect( resolvedPrePublishState.actionKeys ).toEqual( [
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.SUBMIT_FRESH_REVIEW_DECISION,
		] );
		expect( JSON.stringify( requestedPrePublishState ) ).not.toContain(
			rawContentToken
		);
		expect( JSON.stringify( requestedPrePublishState ) ).not.toContain(
			'fresh-review-pre-publish-proof'
		);
		expect( JSON.stringify( requestedPrePublishState ) ).not.toMatch(
			/"reviewerId"\s*:\s*7|reviewer_user_id/
		);
		expect( JSON.stringify( resolvedPrePublishState ) ).not.toContain(
			rawContentToken
		);
	} );

	it( 'keeps accepted fresh-review validation ready for guarded retry save without calling save', () => {
		const normalized = normalizeDistributedEditingSessionState( {
			pendingChangeCount: 1,
			hasPendingChanges: true,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: false,
			localUpdatesImportStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			localUpdatesImportReason:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			localUpdatesImportRequiresFreshReview: true,
			localUpdatesImportReviewRequestStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.DECISION_RECORDED,
			localUpdatesImportFreshReviewRequestAccepted: true,
			localUpdatesImportFreshReviewRequestRequested: true,
			localUpdatesImportFreshReviewDecisionStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED,
			localUpdatesImportFreshReviewDecisionAccepted: true,
			localUpdatesImportFreshReviewDecisionSubmitted: true,
			localUpdatesImportFreshReviewDecisionDecision: 'approved',
			localUpdatesImportFreshReviewDecisionReviewedBlockItemCount: 1,
			localUpdatesImportFreshReviewRetrySaveHandoffStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
			localUpdatesImportFreshReviewRetrySaveHandoffAccepted: true,
			retrySaveFreshReviewConsumeValidationAccepted: true,
			retrySaveFreshReviewDecisionConsumptionValidated: true,
			retrySaveFreshReviewReviewedBlockItemCount: 1,
		} );
		const preSaveState =
			getDistributedEditingFreshReviewPreSaveStateForSessionState(
				normalized
			);
		const descriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( normalized );

		expect( preSaveState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.READY_FOR_GUARDED_RETRY_SAVE,
			reason: 'fresh_review_accepted_for_retry_save',
			placement:
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_SAVE_STATUS,
			saveButtonLabel: 'Save',
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
			blocksNormalSavePost: true,
			opensPrePublishReview: false,
			canExportLocalUpdates: false,
			reviewedBlockItemCount: 1,
			handoffAccepted: true,
			freshReviewConsumed: true,
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( descriptors ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					kind: DISTRIBUTED_EDITING_NOTICE_KINDS.LOCAL_UPDATES_IMPORT_BLOCKED,
					freshReviewPreSaveStatus:
						DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.READY_FOR_GUARDED_RETRY_SAVE,
					freshReviewPreSavePlacement:
						DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_SAVE_STATUS,
					freshReviewPreSaveClickAction:
						DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
					freshReviewPreSaveBlocksNormalSavePost: true,
					freshReviewPreSaveOpensPrePublishReview: false,
					freshReviewPreSaveCanExportLocalUpdates: false,
					shouldCallNormalSavePost: false,
					shouldCallRetrySaveEndpoint: false,
					claimsSaved: false,
				} ),
			] )
		);
	} );

	it( 'suppresses stale fresh-review import actions after retry-save confirmation', () => {
		const normalized = normalizeDistributedEditingSessionState( {
			pendingChangeCount: 0,
			hasPendingChanges: false,
			mustOfferLocalCopy: false,
			canExportLocalUpdates: false,
			localUpdatesImportStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			localUpdatesImportReason:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			localUpdatesImportRequiresFreshReview: true,
			localUpdatesImportReviewActionKey:
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW,
			localUpdatesImportReviewRequestStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.DECISION_RECORDED,
			localUpdatesImportFreshReviewRequestAccepted: true,
			localUpdatesImportFreshReviewRequestRequested: true,
			localUpdatesImportFreshReviewDecisionStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED,
			localUpdatesImportFreshReviewDecisionAccepted: true,
			localUpdatesImportFreshReviewDecisionSubmitted: true,
			localUpdatesImportFreshReviewDecisionDecision: 'approved',
			localUpdatesImportFreshReviewDecisionReviewedBlockItemCount: 1,
			localUpdatesImportFreshReviewRetrySaveHandoffStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
			localUpdatesImportFreshReviewRetrySaveHandoffAccepted: true,
			retrySaveFreshReviewConsumeValidationAccepted: true,
			retrySaveFreshReviewDecisionConsumptionValidated: true,
			retrySaveFreshReviewReviewedBlockItemCount: 1,
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
			retrySaveAccepted: true,
			retrySaveServerVersion: '13',
			retrySavePreviousServerVersion: '12',
			retrySaveSavesPost: true,
			retrySaveMutatesPostContent: true,
			retrySaveClaimsSaved: true,
			retrySaveRevisionCreated: true,
			retrySaveCreatedRevisionIds: [ 301 ],
		} );
		const reviewRequest =
			getDistributedEditingLocalUpdatesImportReviewRequestStateForSessionState(
				normalized
			);
		const descriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( normalized );

		expect(
			hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState(
				normalized
			)
		).toBe( true );
		expect( reviewRequest ).toMatchObject( {
			requiresFreshReview: false,
			actionKey: null,
			canExportLocalUpdates: false,
			hasProtectedLocalChanges: false,
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
		} );
		expect( descriptors ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					kind: DISTRIBUTED_EDITING_NOTICE_KINDS.RETRY_SAVE,
					status: 'success',
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
					retrySaveAccepted: true,
					retrySaveClaimsSaved: true,
					actionKeys: [],
				} ),
			] )
		);
		expect( descriptors ).not.toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					kind: DISTRIBUTED_EDITING_NOTICE_KINDS.LOCAL_UPDATES_IMPORT_BLOCKED,
				} ),
			] )
		);
		expect( JSON.stringify( descriptors ) ).not.toContain(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW
		);
	} );

	it( 'keeps new protected fresh-review work actionable after retry-save confirmation', () => {
		const normalized = normalizeDistributedEditingSessionState( {
			pendingChangeCount: 1,
			hasPendingChanges: true,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
			localUpdatesImportStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			localUpdatesImportReason:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			localUpdatesImportRequiresFreshReview: true,
			localUpdatesImportReviewActionKey:
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW,
			localUpdatesImportReviewRequestStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.DECISION_RECORDED,
			localUpdatesImportFreshReviewRequestAccepted: true,
			localUpdatesImportFreshReviewRequestRequested: true,
			localUpdatesImportFreshReviewDecisionPanelRequired: true,
			localUpdatesImportFreshReviewDecisionStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED,
			localUpdatesImportFreshReviewDecisionAccepted: true,
			localUpdatesImportFreshReviewDecisionSubmitted: true,
			localUpdatesImportFreshReviewDecisionDecision: 'approved',
			localUpdatesImportFreshReviewDecisionReviewedBlockItemCount: 1,
			localUpdatesImportFreshReviewRetrySaveHandoffStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
			localUpdatesImportFreshReviewRetrySaveHandoffAccepted: true,
			retrySaveFreshReviewConsumeValidationAccepted: true,
			retrySaveFreshReviewDecisionConsumptionValidated: true,
			retrySaveFreshReviewReviewedBlockItemCount: 1,
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
			retrySaveAccepted: true,
			retrySaveServerVersion: '13',
			retrySavePreviousServerVersion: '12',
			retrySaveSavesPost: true,
			retrySaveMutatesPostContent: true,
			retrySaveClaimsSaved: true,
			retrySaveRevisionCreated: true,
			retrySaveCreatedRevisionIds: [ 301 ],
		} );
		const reviewRequest =
			getDistributedEditingLocalUpdatesImportReviewRequestStateForSessionState(
				normalized
			);
		const preSave =
			getDistributedEditingFreshReviewPreSaveStateForSessionState(
				normalized
			);
		const saveButton =
			getDistributedEditingSaveButtonStateForSessionState( normalized );
		const savePolicy =
			getDistributedEditingSavePolicyStateForSessionState( normalized );
		const descriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( normalized );

		expect(
			hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState(
				normalized
			)
		).toBe( true );
		expect( reviewRequest ).toMatchObject( {
			requiresFreshReview: true,
			actionKey: DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW,
			canExportLocalUpdates: true,
			hasProtectedLocalChanges: true,
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
		} );
		expect( preSave ).toMatchObject( {
			status: DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REVIEW_REQUIRED,
			reason: 'fresh_review_required',
			placement:
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_PUBLISH_REVIEW,
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
			blocksNormalSavePost: true,
			opensPrePublishReview: true,
			canExportLocalUpdates: false,
		} );
		expect( saveButton ).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.REVIEW_BLOCKED,
			reason: 'fresh_review_required',
			label: 'Save',
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
			authorityState:
				DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.REVIEW_REQUIRED_BEFORE_UPDATE,
			authoritativePostUpdated: false,
			localChangesState:
				DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES.PROTECTED_CHANGES_EXPORTABLE,
			reviewCheckpointState:
				DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.REVIEW_REQUIRED,
			hasRetrySaveSavedStateEvidence: true,
			hasProtectedLocalChanges: true,
			blocksNormalSavePost: true,
			claimsSaved: false,
		} );
		expect( savePolicy ).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.REVIEW_REQUIRED,
			reason: 'fresh_review_required',
			saveButtonLabel: 'Save',
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
			blocksNormalSavePost: true,
			opensPrePublishReview: false,
			saveButtonAuthoritativePostUpdated: false,
			saveButtonLocalChangesState:
				DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES.PROTECTED_CHANGES_EXPORTABLE,
			saveButtonReviewCheckpointState:
				DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.REVIEW_REQUIRED,
			claimsSaved: false,
		} );
		expect( descriptors ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					kind: DISTRIBUTED_EDITING_NOTICE_KINDS.LOCAL_UPDATES_IMPORT_BLOCKED,
					actionKeys: [
						DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW,
					],
					freshReviewPreSaveStatus:
						DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REVIEW_REQUIRED,
					freshReviewPreSaveClickAction:
						DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
					freshReviewPreSaveBlocksNormalSavePost: true,
					freshReviewPreSaveCanExportLocalUpdates: false,
					claimsSaved: false,
				} ),
			] )
		);
	} );

	it( 'describes DE-RTC Save button semantics without content or identity exposure', () => {
		const rawContentToken = 'save-button-raw-content';
		const proofToken = 'save-button-proof-signature';
		const reviewBlocked = normalizeDistributedEditingSessionState( {
			pendingChangeCount: 1,
			hasPendingChanges: true,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
			localUpdatesImportStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			localUpdatesImportReason:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			localUpdatesImportReviewRequestStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
			localUpdatesImportFreshReviewRequestAccepted: true,
			localUpdatesImportFreshReviewRequestRequested: true,
			localUpdatesImportFreshReviewDecisionPanelRequired: true,
			localUpdatesImportFreshReviewDecisionItems: [
				{
					id: 'save-button-review-blocked',
					blockName: 'core/html',
					blockLabel: 'HTML',
					proposedContentHash:
						'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
					reviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_ITEM_STATUSES.PENDING_REVIEW,
					rawContent: rawContentToken,
					proofSignature: proofToken,
					reviewerId: 17,
				},
			],
		} );
		const acceptedButUnconsumed = normalizeDistributedEditingSessionState( {
			pendingChangeCount: 1,
			hasPendingChanges: true,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
			clientBaseVersion: '7',
			serverVersion: '12',
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
			retrySubmitAccepted: true,
			retrySubmitSavePathRequired: true,
			retrySubmitSaveStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
			retrySubmitSaveReady: true,
			localUpdatesImportStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			localUpdatesImportReason:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			localUpdatesImportReviewRequestStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.DECISION_RECORDED,
			localUpdatesImportFreshReviewRequestRecordId:
				'fresh-review-request-123',
			localUpdatesImportFreshReviewDecisionStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED,
			localUpdatesImportFreshReviewDecisionAccepted: true,
			localUpdatesImportFreshReviewDecisionSubmitted: true,
			localUpdatesImportFreshReviewDecisionDecision: 'approved',
			localUpdatesImportFreshReviewRetrySaveHandoffStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
			localUpdatesImportFreshReviewRetrySaveHandoffAccepted: true,
			retrySaveFreshReviewConsumeValidationAccepted: true,
			retrySaveFreshReviewDecisionConsumptionValidated: true,
			retrySaveFreshReviewDecisionEligibleForRetrySave: true,
			retrySaveFreshReviewRequestRecordId: 'fresh-review-request-123',
			retrySaveFreshReviewServerVersion: '12',
			retrySaveFreshReviewProposedContentHash:
				'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
			retrySaveFreshReviewCandidateContentHash:
				'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
			retrySaveFreshReviewHashEvidenceStatus: 'accepted',
		} );
		const retrySaveInProgress = normalizeDistributedEditingSessionState( {
			pendingChangeCount: 1,
			hasPendingChanges: true,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
		} );
		const saveButtonClickInFlight = normalizeDistributedEditingSessionState(
			{
				pendingChangeCount: 1,
				hasPendingChanges: true,
				mustOfferLocalCopy: true,
				canExportLocalUpdates: true,
				saveButtonClickInFlight: true,
			}
		);
		const freshReviewValidating = normalizeDistributedEditingSessionState( {
			pendingChangeCount: 1,
			hasPendingChanges: true,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
			localUpdatesImportStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			localUpdatesImportReason:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			localUpdatesImportReviewRequestStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.DECISION_RECORDED,
			localUpdatesImportFreshReviewRequestAccepted: true,
			localUpdatesImportFreshReviewRequestRequested: true,
			localUpdatesImportFreshReviewDecisionStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.RECORDED,
			localUpdatesImportFreshReviewDecisionAccepted: true,
			localUpdatesImportFreshReviewDecisionSubmitted: true,
			localUpdatesImportFreshReviewDecisionDecision: 'approved',
			localUpdatesImportFreshReviewRetrySaveHandoffStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.VALIDATING,
			localUpdatesImportFreshReviewRetrySaveHandoffValidating: true,
		} );
		const retrySaveConfirmed =
			getDistributedEditingSessionStateForRetrySaveResult(
				{
					result: 'retry_save_applied',
					retry_save_accepted: true,
					previous_server_version: '12',
					server_version: '13',
					saves_post: true,
					mutates_post_content: true,
					creates_revision: true,
					claims_saved: true,
				},
				{
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
				}
			);
		const refetchRequired = normalizeDistributedEditingSessionState( {
			pendingChangeCount: 1,
			hasPendingChanges: true,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
			requiresServerStateRefetch: true,
		} );
		const buttonStates = {
			reviewBlocked:
				getDistributedEditingSaveButtonStateForSessionState(
					reviewBlocked
				),
			acceptedButUnconsumed:
				getDistributedEditingSaveButtonStateForSessionState(
					acceptedButUnconsumed
				),
			retrySaveInProgress:
				getDistributedEditingSaveButtonStateForSessionState(
					retrySaveInProgress
				),
			saveButtonClickInFlight:
				getDistributedEditingSaveButtonStateForSessionState(
					saveButtonClickInFlight
				),
			freshReviewValidating:
				getDistributedEditingSaveButtonStateForSessionState(
					freshReviewValidating
				),
			retrySaveConfirmed:
				getDistributedEditingSaveButtonStateForSessionState(
					retrySaveConfirmed
				),
			refetchRequired:
				getDistributedEditingSaveButtonStateForSessionState(
					refetchRequired
				),
		};
		const acceptedSavePolicy =
			getDistributedEditingSavePolicyStateForSessionState(
				acceptedButUnconsumed
			);
		const saveButtonClickInFlightPolicy =
			getDistributedEditingSavePolicyStateForSessionState(
				saveButtonClickInFlight
			);
		const selectorState = {
			distributedEditingSession: acceptedButUnconsumed,
		};

		expect( buttonStates.reviewBlocked ).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.REVIEW_BLOCKED,
			source: 'fresh_review',
			label: 'Save',
			statusText:
				'WordPress will save safe edits and keep blocked blocks for review.',
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
			blocksNormalSavePost: true,
			opensPrePublishReview: false,
			authorityState:
				DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.REVIEW_REQUIRED_BEFORE_UPDATE,
			authorityStatusText:
				'WordPress cannot update the post until risky changes are approved or removed.',
			canExportLocalUpdates: true,
			localChangesState:
				DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES.PROTECTED_CHANGES_EXPORTABLE,
			reviewCheckpointState:
				DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.REVIEW_REQUIRED,
			authoritativePostState:
				DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.REVIEW_REQUIRED_BEFORE_UPDATE,
			saveStateSummaryText:
				'Protected local changes need review before WordPress can update the post.',
			stateVocabulary: expect.objectContaining( {
				localChangesState:
					DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES.PROTECTED_CHANGES_EXPORTABLE,
				reviewCheckpointState:
					DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.REVIEW_REQUIRED,
				authoritativePostState:
					DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.REVIEW_REQUIRED_BEFORE_UPDATE,
				summaryText:
					'Protected local changes need review before WordPress can update the post.',
				descriptorOnly: true,
				rawContentIncluded: false,
				exposesRawContent: false,
			} ),
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
			claimsSaved: false,
		} );
		expect( buttonStates.acceptedButUnconsumed ).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.ACCEPTED_BUT_UNCONSUMED,
			reason: 'fresh_review_accepted_but_unconsumed',
			source: 'fresh_review',
			label: 'Save',
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
			blocksNormalSavePost: true,
			hasAcceptedButUnconsumed: true,
			hasAcceptedFreshReviewConsumeValidation: true,
			authorityState:
				DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.READY_FOR_GUARDED_UPDATE,
			authoritativePostUpdated: false,
			localChangesState:
				DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES.PROTECTED_CHANGES_EXPORTABLE,
			reviewCheckpointState:
				DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.REVIEW_ACCEPTED,
			authoritativePostState:
				DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.READY_FOR_GUARDED_UPDATE,
			saveStateSummaryText:
				'Reviewed local changes are ready for Save; the post in WordPress is not updated yet.',
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
			claimsSaved: false,
		} );
		expect( acceptedSavePolicy ).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.READY_FOR_REVIEWED_RETRY_SAVE,
			saveButtonStatus:
				DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.ACCEPTED_BUT_UNCONSUMED,
			saveButtonSource: 'fresh_review',
			saveButtonAuthorityState:
				DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.READY_FOR_GUARDED_UPDATE,
			saveButtonAuthoritativePostUpdated: false,
			saveButtonLocalChangesState:
				DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES.PROTECTED_CHANGES_EXPORTABLE,
			saveButtonReviewCheckpointState:
				DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.REVIEW_ACCEPTED,
			saveButtonAuthoritativePostState:
				DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.READY_FOR_GUARDED_UPDATE,
			saveButtonStateSummaryText:
				'Reviewed local changes are ready for Save; the post in WordPress is not updated yet.',
			saveButtonStateVocabulary: expect.objectContaining( {
				localChangesText:
					'Protected local changes remain exportable from this editor.',
				reviewCheckpointText: 'Review is accepted for WordPress Save.',
			} ),
			blocksNormalSavePost: true,
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
			saveButton: expect.objectContaining( {
				descriptorOnly: true,
				callsRestEndpoint: false,
				exposesRawContent: false,
				exposesReviewerIds: false,
			} ),
		} );
		expect( getDistributedEditingSaveButtonState( selectorState ) ).toEqual(
			buttonStates.acceptedButUnconsumed
		);
		expect( buttonStates.retrySaveInProgress ).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_IN_PROGRESS,
			label: 'Saving',
			disabled: true,
			busy: true,
			blocksNormalSavePost: true,
			authorityState:
				DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.AWAITING_SERVER_CONFIRMATION,
			pendingServerConfirmation: true,
			localChangesState:
				DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES.AWAITING_SERVER_CONFIRMATION,
			reviewCheckpointState:
				DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.REVIEW_ACCEPTED,
			saveStateSummaryText:
				'Reviewed local changes are waiting for WordPress confirmation before the post updates.',
			claimsSaved: false,
		} );
		expect( buttonStates.saveButtonClickInFlight ).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_IN_PROGRESS,
			reason: 'distributed_editing_save_button_click_in_flight',
			source: 'save_button',
			label: 'Save',
			statusText: 'Saving.',
			clickAction: null,
			disabled: true,
			busy: false,
			blocksNormalSavePost: true,
			pendingServerConfirmation: true,
			authorityState:
				DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.AWAITING_SERVER_CONFIRMATION,
			localChangesState:
				DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES.AWAITING_SERVER_CONFIRMATION,
			reviewCheckpointState:
				DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.REVIEW_ACCEPTED,
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
			claimsSaved: false,
		} );
		expect( saveButtonClickInFlightPolicy ).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.IN_FLIGHT,
			reason: 'distributed_editing_save_button_click_in_flight',
			saveButtonStatus:
				DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_IN_PROGRESS,
			saveButtonSource: 'save_button',
			saveButtonDisabled: true,
			saveButtonBusy: false,
			blocksNormalSavePost: true,
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
			claimsSaved: false,
		} );
		expect( buttonStates.freshReviewValidating ).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.FRESH_REVIEW_VALIDATING,
			label: 'Checking review...',
			disabled: true,
			busy: true,
			blocksNormalSavePost: true,
			authorityState:
				DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.REVIEW_VALIDATION_IN_PROGRESS,
			localChangesState:
				DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES.PROTECTED_CHANGES_EXPORTABLE,
			reviewCheckpointState:
				DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.REVIEW_VALIDATING,
			saveStateSummaryText:
				'Reviewed local changes are being checked before WordPress can update the post.',
			claimsSaved: false,
		} );
		expect( buttonStates.retrySaveConfirmed ).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_CONFIRMED,
			label: 'Saved',
			disabled: true,
			blocksNormalSavePost: true,
			hasRetrySaveSavedStateEvidence: true,
			authorityState:
				DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.AUTHORITATIVE_UPDATE_CONFIRMED,
			authoritativePostUpdated: true,
			localChangesState:
				DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES.AUTHORITATIVE_UPDATE_CONFIRMED,
			reviewCheckpointState:
				DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.REVIEW_CONSUMED,
			saveStateSummaryText: 'Ready for new edits.',
			claimsSaved: true,
		} );
		expect( buttonStates.refetchRequired ).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.REFETCH_REQUIRED,
			label: 'Save',
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.REFETCH_SERVER_STATE,
			requiresServerStateRefetch: true,
			canRefetchServerState: true,
			blocksNormalSavePost: true,
			authorityState:
				DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.SERVER_REFRESH_REQUIRED_BEFORE_UPDATE,
			localChangesState:
				DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES.PROTECTED_CHANGES_EXPORTABLE,
			reviewCheckpointState:
				DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.SERVER_REFRESH_REQUIRED,
			saveStateSummaryText:
				'Getting the latest post only refreshes server state; protected local changes stay in this editor until a later Save is confirmed.',
			claimsSaved: false,
		} );
		expect( JSON.stringify( buttonStates ) ).not.toContain(
			rawContentToken
		);
		expect( JSON.stringify( buttonStates ) ).not.toContain( proofToken );
		expect( JSON.stringify( buttonStates ) ).not.toMatch(
			/reviewerId|reviewer_user_id|proofSignature/
		);
	} );

	it( 'describes repeated visible Save proof vocabulary for required viewports', () => {
		const sessionState = normalizeDistributedEditingSessionState( {
			pendingChangeCount: 1,
			hasPendingChanges: true,
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
			saveButtonClickInFlight: true,
		} );
		const proofInputs = {
			repeatedClickAttempted: true,
			secondClickFired: false,
			delayedRefetchHeld: true,
			delayedRefetchReleased: true,
			delayedServerStateRefetchCount: 1,
			localProposalPreserved: true,
			dirtyStatePreserved: true,
			normalSaveBlocked: true,
			requestDeltaAfterRepeatedClick: {
				serverStateRefetch: 0,
				retrySubmit: 0,
				retrySave: 0,
				distributedEditing: 0,
				autosave: 0,
				normalPostMutation: 0,
			},
			singlePeerGuardedPipeline: true,
		};

		for ( const viewport of [
			{ width: 1280, height: 720 },
			{ width: 1280, height: 900 },
		] ) {
			const proofState =
				getDistributedEditingRepeatedVisibleSaveProofStateForSessionState(
					sessionState,
					{
						...proofInputs,
						viewport,
					}
				);

			expect( proofState ).toEqual( {
				viewport,
				repeatedVisibleSaveIdempotency: {
					repeatedClickAttempted: true,
					secondClickFired: false,
					delayedRefetchHeld: true,
					delayedRefetchReleased: true,
					delayedServerStateRefetchCount: 1,
					localProposalPreserved: true,
					dirtyStatePreserved: true,
					normalSaveBlocked: true,
					requestDeltaAfterRepeatedClick: {
						serverStateRefetch: 0,
						retrySubmit: 0,
						retrySave: 0,
						distributedEditing: 0,
						autosave: 0,
						normalPostMutation: 0,
					},
					buttonSnapshot: {
						text: 'Save',
						disabled: true,
						busy: false,
						saveButtonStatus:
							DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_IN_PROGRESS,
						saveButtonClickAction: null,
						saveJourneyAction: 'keep_tab_open',
						saveButtonStateSummary:
							'Reviewed local changes are waiting for WordPress confirmation before the post updates.',
					},
					singlePeerGuardedPipeline: true,
					duplicateGuardedWritesPrevented: true,
					saveLoopPrevented: true,
				},
				descriptorOnly: true,
				contentFree: true,
				callsRestEndpoint: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				callsAutosaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
				exposesRawContent: false,
				exposesProofInternals: false,
				exposesReviewerIds: false,
				exposesSaverIds: false,
			} );
			expect(
				getDistributedEditingRepeatedVisibleSaveProofState(
					{
						distributedEditingSession: sessionState,
					},
					{
						...proofInputs,
						viewport,
					}
				)
			).toEqual( proofState );
		}
	} );

	it( 'routes mid-flow stale-base recovery through the real Save button semantics', () => {
		const cases = [
			{
				sessionState: {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					localRebasePlanStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
					localRebaseResultStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
					localRebaseResultReason: 'same_block_changed',
					requiresManualConflictResolution: true,
					clientBaseContent:
						'<!-- wp:paragraph --><p>Base</p><!-- /wp:paragraph -->',
					refetchedServerContent:
						'<!-- wp:paragraph --><p>Server</p><!-- /wp:paragraph -->',
				},
				reason: 'manual_conflict_review_required_before_save',
				label: 'Save',
				statusText:
					'Resolve the local and WordPress versions before Save can update the post.',
				clickAction:
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.COMPARE_CONFLICTING_CHANGES,
				journeyAction: 'compare_conflicting_changes',
			},
			{
				sessionState: {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					localRebasePlanStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
					clientBaseContent:
						'<!-- wp:paragraph --><p>Base</p><!-- /wp:paragraph -->',
					refetchedServerContent:
						'<!-- wp:paragraph --><p>Server</p><!-- /wp:paragraph -->',
				},
				reason: 'local_changes_not_applied_before_save',
				label: 'Apply local changes',
				statusText:
					'Apply protected local changes before Save can update the post.',
				clickAction:
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.APPLY_LOCAL_CHANGES,
				journeyAction: 'apply_local_changes',
			},
			{
				sessionState: {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					localRebaseResultStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
					readyToRetrySubmit: true,
				},
				reason: 'retry_submit_handoff_not_prepared_before_save',
				label: 'Continue Save',
				statusText: 'Continue Save before the post can update.',
				clickAction:
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.PREPARE_CHANGES,
				journeyAction: 'prepare_changes',
			},
			{
				sessionState: {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					retrySubmitHandoffStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
					retrySubmitPrepared: true,
				},
				reason: 'retry_submit_proof_not_checked_before_save',
				label: 'Continue Save',
				statusText: 'Continue Save before the post can update.',
				clickAction:
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CHECK_WITH_WORDPRESS,
				journeyAction: 'check_with_wordpress',
			},
		];

		for ( const currentCase of cases ) {
			const buttonState =
				getDistributedEditingSaveButtonStateForSessionState(
					currentCase.sessionState
				);
			const policyState =
				getDistributedEditingSavePolicyStateForSessionState(
					currentCase.sessionState
				);
			const journeyState =
				getDistributedEditingSaveJourneyStateForSessionState(
					currentCase.sessionState
				);

			expect( buttonState ).toMatchObject( {
				status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.WORKFLOW_ACTION_REQUIRED,
				reason: currentCase.reason,
				source: 'stale_base_recovery',
				label: currentCase.label,
				statusText: currentCase.statusText,
				clickAction: currentCase.clickAction,
				blocksNormalSavePost: true,
				authorityState:
					DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.REVIEW_REQUIRED_BEFORE_UPDATE,
				authorityStatusText:
					'Finish the recovery step before WordPress can update the post.',
				localChangesState:
					DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES.PROTECTED_CHANGES_EXPORTABLE,
				reviewCheckpointState:
					DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.REVIEW_REQUIRED,
				saveStateSummaryText:
					'Protected local changes need the next recovery step before WordPress can update the post.',
				shouldCallNormalSavePost: false,
				shouldCallRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
				rawContentIncluded: false,
				exposesRawContent: false,
			} );
			expect( policyState ).toMatchObject( {
				status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.WORKFLOW_ACTION_REQUIRED,
				reason: currentCase.reason,
				saveButtonLabel: currentCase.label,
				clickAction: currentCase.clickAction,
				blocksNormalSavePost: true,
				opensPrePublishReview: false,
				requiresServerStateRefetch: false,
				shouldCallNormalSavePost: false,
				shouldCallRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} );
			expect( journeyState ).toMatchObject( {
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED,
				action: currentCase.journeyAction,
				actionHint: currentCase.label,
				requiresActionBeforeSave: true,
				saveButtonLabel: currentCase.label,
				saveButtonBlocksNormalSavePost: true,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				claimsSavedWithoutEvidence: false,
				exposesRawContent: false,
				exposesProofInternals: false,
			} );
		}
	} );

	it( 'summarizes the M0 human loop step without side effects or private data', () => {
		const confirmedState =
			getDistributedEditingSessionStateForRetrySaveResult(
				{
					result: 'retry_save_applied',
					retry_save_accepted: true,
					previous_server_version: '12',
					server_version: '13',
					saves_post: true,
					mutates_post_content: true,
					creates_revision: true,
					claims_saved: true,
				},
				{
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
				}
			);
		const cases = [
			{
				sessionState: {},
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.READY_TO_EDIT,
				action: 'edit',
				saveButtonLabel: 'Update',
			},
			{
				sessionState: {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
				},
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.READY_TO_EDIT,
				action: 'edit',
				saveButtonLabel: 'Update',
			},
			{
				sessionState: {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					requiresServerStateRefetch: true,
				},
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.GET_LATEST_POST,
				action: 'get_latest_post',
				saveButtonLabel: 'Save',
				saveButtonBlocksNormalSavePost: true,
			},
			{
				sessionState: {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					riskyBlockReviewStatus:
						DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
					riskyBlockReviewHasPendingItems: true,
					riskyBlockReviewItemCount: 1,
					riskyBlockReviewPendingCount: 1,
				},
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.REVIEW_CHANGES,
				action: 'review_changes',
				saveButtonLabel: 'Save',
				saveButtonBlocksNormalSavePost: true,
			},
			{
				sessionState: {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					retrySubmitSaveStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
					retrySubmitSaveReady: true,
				},
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.READY_TO_SAVE,
				action: 'save',
				saveButtonLabel: 'Save',
				saveButtonBlocksNormalSavePost: true,
			},
			{
				sessionState: {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
				},
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.WAITING_FOR_WORDPRESS,
				action: 'keep_tab_open',
				saveButtonLabel: 'Saving',
				saveButtonDisabled: true,
				saveButtonBusy: true,
				saveButtonBlocksNormalSavePost: true,
			},
			{
				sessionState: confirmedState,
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.SAVE_CONFIRMED,
				action: 'none',
				confirmedByWordPress: true,
				saveButtonLabel: 'Saved',
				saveButtonDisabled: true,
				saveButtonBlocksNormalSavePost: true,
			},
		];

		for ( const currentCase of cases ) {
			const stepState =
				getDistributedEditingHumanLoopStepStateForSessionState(
					currentCase.sessionState
				);

			expect( stepState ).toMatchObject( {
				step: currentCase.step,
				action: currentCase.action,
				saveButtonLabel: currentCase.saveButtonLabel,
				saveButtonDisabled: Boolean( currentCase.saveButtonDisabled ),
				saveButtonBusy: Boolean( currentCase.saveButtonBusy ),
				saveButtonBlocksNormalSavePost: Boolean(
					currentCase.saveButtonBlocksNormalSavePost
				),
				confirmedByWordPress: Boolean(
					currentCase.confirmedByWordPress
				),
				descriptorOnly: true,
				callsRestEndpoint: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSavedWithoutEvidence: false,
				exposesRawContent: false,
				exposesProofInternals: false,
				exposesReviewerIds: false,
				exposesSaverIds: false,
			} );
		}
	} );

	it( 'summarizes the M0 Save journey for real Save controls without side effects or private data', () => {
		const rawContentToken = 'save-journey-raw-post-content';
		const proofToken = 'save-journey-proof-signature';
		const reviewState = normalizeDistributedEditingSessionState( {
			pendingChangeCount: 1,
			hasPendingChanges: true,
			canExportLocalUpdates: true,
			retrySaveStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
			retrySaveReason:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
			riskyBlockReviewStatus:
				DISTRIBUTED_EDITING_RISKY_BLOCK_REVIEW_STATUSES.REVIEW_REQUIRED,
			riskyBlockReviewHasPendingItems: true,
			riskyBlockReviewItemCount: 1,
			riskyBlockReviewPendingCount: 1,
			rawPostContent: rawContentToken,
			proofSignature: proofToken,
		} );
		const waitingState = normalizeDistributedEditingSessionState( {
			pendingChangeCount: 1,
			hasPendingChanges: true,
			canExportLocalUpdates: true,
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
			rawPostContent: rawContentToken,
			proofSignature: proofToken,
		} );
		const confirmedState =
			getDistributedEditingSessionStateForRetrySaveResult(
				{
					result: 'retry_save_applied',
					retry_save_accepted: true,
					previous_server_version: '12',
					server_version: '13',
					saves_post: true,
					mutates_post_content: true,
					creates_revision: true,
					claims_saved: true,
					raw_post_content: rawContentToken,
					proof_signature: proofToken,
				},
				{
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
				}
			);
		const cases = [
			{
				sessionState: {},
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.READY_TO_EDIT,
				action: 'edit',
				title: 'Save is available',
				summary: 'ready for WordPress',
				actionHint: null,
				requiresActionBeforeSave: false,
				saveButtonLabel: 'Update',
			},
			{
				sessionState: {},
				options: { isDirty: true },
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED,
				action: 'dirty_save_preflight',
				title: 'Unsaved changes',
				summary: 'Use Save when you are ready.',
				actionHint: null,
				requiresActionBeforeSave: false,
				saveButtonLabel: 'Update',
				dirtyEditorPreflight: true,
				statusChromeSummary: 'Use Save when you are ready.',
				statusChromeAuthorityText: 'Save can update the post.',
			},
			{
				sessionState: {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
				},
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED,
				action: 'wait_or_export',
				title: 'Keep editing',
				summary: 'Use Save when you are ready.',
				actionHint: null,
				requiresActionBeforeSave: false,
				saveButtonLabel: 'Update',
			},
			{
				sessionState: {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					localRebasePlanStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
					localRebaseResultStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
					localRebaseResultReason: 'same_block_changed',
					requiresManualConflictResolution: true,
					clientBaseContent:
						'<!-- wp:paragraph --><p>Base</p><!-- /wp:paragraph -->',
					refetchedServerContent:
						'<!-- wp:paragraph --><p>Server</p><!-- /wp:paragraph -->',
				},
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED,
				action: 'compare_conflicting_changes',
				title: 'Resolve changes',
				summary: 'Choose which version to keep before saving.',
				actionHint: 'Save',
				requiresActionBeforeSave: true,
				saveButtonLabel: 'Save',
				saveButtonBlocksNormalSavePost: true,
			},
			{
				sessionState: {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					localRebasePlanStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
					clientBaseContent:
						'<!-- wp:paragraph --><p>Base</p><!-- /wp:paragraph -->',
					refetchedServerContent:
						'<!-- wp:paragraph --><p>Server</p><!-- /wp:paragraph -->',
				},
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED,
				action: 'apply_local_changes',
				title: 'Apply local edits',
				summary: 'Apply local edits in this editor before saving.',
				actionHint: 'Apply local changes',
				requiresActionBeforeSave: true,
				saveButtonLabel: 'Apply local changes',
				saveButtonBlocksNormalSavePost: true,
			},
			{
				sessionState: {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					localRebaseResultStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
					readyToRetrySubmit: true,
				},
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED,
				action: 'prepare_changes',
				title: 'Continue Save',
				summary: 'Continue Save before updating the post.',
				actionHint: 'Continue Save',
				requiresActionBeforeSave: true,
				saveButtonLabel: 'Continue Save',
				saveButtonBlocksNormalSavePost: true,
			},
			{
				sessionState: {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					retrySubmitHandoffStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
					retrySubmitPrepared: true,
				},
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED,
				action: 'check_with_wordpress',
				title: 'Continue Save',
				summary: 'Continue Save before the post can update.',
				actionHint: 'Continue Save',
				requiresActionBeforeSave: true,
				saveButtonLabel: 'Continue Save',
				saveButtonBlocksNormalSavePost: true,
			},
			{
				sessionState: {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					requiresServerStateRefetch: true,
				},
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.GET_LATEST_POST,
				action: 'get_latest_post',
				title: 'Load latest version',
				summary: 'Load the latest post before saving again.',
				actionHint: 'Get latest first',
				requiresActionBeforeSave: true,
				saveButtonLabel: 'Save',
				saveButtonBlocksNormalSavePost: true,
			},
			{
				sessionState: reviewState,
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.REVIEW_CHANGES,
				action: 'review_changes',
				title: 'HTML review',
				summary: 'Review blocked HTML before saving it.',
				actionHint: 'Review before update',
				requiresActionBeforeSave: true,
				saveButtonLabel: 'Save',
				saveButtonBlocksNormalSavePost: true,
			},
			{
				sessionState: {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
				},
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.READY_TO_SAVE,
				action: 'prepare_save',
				title: 'Continue Save',
				summary: 'Continue Save before updating the post.',
				actionHint: 'Continue Save',
				requiresActionBeforeSave: true,
				saveButtonLabel: 'Continue Save',
				saveButtonBlocksNormalSavePost: true,
			},
			{
				sessionState: {
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					retrySubmitProofStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					retrySubmitSaveStatus:
						DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
					retrySubmitSaveReady: true,
				},
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.READY_TO_SAVE,
				action: 'save',
				title: 'Ready to Save',
				summary: 'Use Save to update the post.',
				actionHint: 'Send to WordPress',
				requiresActionBeforeSave: false,
				saveButtonLabel: 'Save',
				saveButtonBlocksNormalSavePost: true,
			},
			{
				sessionState: waitingState,
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.WAITING_FOR_WORDPRESS,
				action: 'keep_tab_open',
				title: 'Saving',
				summary: 'WordPress is saving your changes.',
				actionHint: null,
				requiresActionBeforeSave: false,
				saveButtonLabel: 'Saving',
				saveButtonDisabled: true,
				saveButtonBusy: true,
				saveButtonBlocksNormalSavePost: true,
			},
			{
				sessionState: confirmedState,
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.SAVE_CONFIRMED,
				action: 'none',
				title: 'Saved',
				summary: 'Ready for new edits.',
				actionHint: null,
				requiresActionBeforeSave: false,
				saveButtonLabel: 'Saved',
				saveButtonDisabled: true,
				saveButtonBlocksNormalSavePost: true,
				confirmedByWordPress: true,
			},
			{
				sessionState: confirmedState,
				options: { isDirty: true },
				step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED,
				action: 'dirty_save_preflight',
				title: 'Unsaved changes',
				summary: 'Use Save when you are ready.',
				actionHint: null,
				requiresActionBeforeSave: false,
				saveButtonLabel: 'Update',
				dirtyEditorPreflight: true,
				statusChromeSummary: 'Use Save when you are ready.',
				statusChromeAuthorityText: 'Save can update the post.',
			},
		];

		for ( const currentCase of cases ) {
			const journeyState =
				getDistributedEditingSaveJourneyStateForSessionState(
					currentCase.sessionState,
					currentCase.options
				);

			expect( journeyState ).toMatchObject( {
				step: currentCase.step,
				action: currentCase.action,
				title: currentCase.title,
				summary: expect.stringContaining( currentCase.summary ),
				actionHint: currentCase.actionHint,
				requiresActionBeforeSave: currentCase.requiresActionBeforeSave,
				saveButtonLabel: currentCase.saveButtonLabel,
				saveButtonDisabled: Boolean( currentCase.saveButtonDisabled ),
				saveButtonBusy: Boolean( currentCase.saveButtonBusy ),
				statusChromeSummary: expect.any( String ),
				statusChromeAuthorityState: expect.any( String ),
				statusChromeAuthorityText: expect.any( String ),
				saveButtonBlocksNormalSavePost: Boolean(
					currentCase.saveButtonBlocksNormalSavePost
				),
				dirtyEditorPreflight: Boolean(
					currentCase.dirtyEditorPreflight
				),
				confirmedByWordPress: Boolean(
					currentCase.confirmedByWordPress
				),
				descriptorOnly: true,
				callsRestEndpoint: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSavedWithoutEvidence: false,
				exposesRawContent: false,
				exposesProofInternals: false,
				exposesReviewerIds: false,
				exposesSaverIds: false,
			} );
			expect( JSON.stringify( journeyState ) ).not.toContain(
				rawContentToken
			);
			expect( JSON.stringify( journeyState ) ).not.toContain(
				proofToken
			);
		}

		expect(
			getDistributedEditingSaveJourneyState( {
				editorSettings: {
					distributedEditing: {
						enabled: true,
					},
				},
				distributedEditingSession: reviewState,
			} )
		).toMatchObject( {
			enabled: true,
			shouldExposeInSaveControls: true,
			step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.REVIEW_CHANGES,
			action: 'review_changes',
			title: 'HTML review',
			statusChromeSummary:
				'Protected local changes need review before WordPress can update the post.',
			statusChromeAuthorityState:
				DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.REVIEW_REQUIRED_BEFORE_UPDATE,
			statusChromeAuthorityText:
				'WordPress cannot update the post until risky changes are approved or removed.',
		} );

		expect(
			getDistributedEditingSaveJourneyState(
				{
					editorSettings: {
						distributedEditing: {
							enabled: true,
						},
					},
					distributedEditingSession: {},
				},
				true
			)
		).toMatchObject( {
			enabled: true,
			shouldExposeInSaveControls: false,
			step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED,
			action: 'dirty_save_preflight',
			title: 'Unsaved changes',
			dirtyEditorPreflight: true,
			statusChromeSummary: 'Use Save when you are ready.',
			statusChromeAuthorityText: 'Save can update the post.',
			callsNormalSavePost: false,
			callsRetrySaveEndpoint: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			changesPostLock: false,
			claimsSavedWithoutEvidence: false,
		} );

		expect(
			getDistributedEditingSaveJourneyState( {
				editorSettings: {
					distributedEditing: {
						enabled: false,
					},
				},
				distributedEditingSession: reviewState,
			} )
		).toMatchObject( {
			enabled: false,
			shouldExposeInSaveControls: false,
			step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.REVIEW_CHANGES,
			action: 'review_changes',
			title: 'HTML review',
		} );
	} );

	it( 'normalizes consumed fresh-review lifecycle evidence without exposing private data', () => {
		const rawContentToken = 'fresh-review-lifecycle-raw-content';
		const normalized =
			getDistributedEditingSessionStateForFreshReviewLifecycleRetrievalResult(
				{
					result: 'fresh_review_lifecycle_debug_available',
					rest_route: 'post_fresh_review_lifecycle',
					fresh_review_lifecycle_debug_available: true,
					fresh_review_support_evidence_available: true,
					fresh_review_request_record_id: 'fresh-review-request-123',
					fresh_review_request_record: {
						lifecycle_status: 'retry_save_consumed',
						raw_content: rawContentToken,
						reviewer_user_id: 7,
					},
					fresh_review_debug_contract: {
						contract: 'support_safe_fresh_review_lifecycle_debug',
						lifecycle_status: 'retry_save_consumed',
						lifecycle_event: 'consumed',
						lifecycle_reason: 'guarded_retry_save_applied',
						decision_recorded: true,
						decision_status: 'approved',
						decision_consumed: true,
						retry_save_applied: true,
						consumes_review_decision: true,
						previous_server_version: '56',
						saved_server_version: '57',
						reviewed_block_item_count: 1,
						reviewed_block_decision_counts: {
							approved: 1,
							rejected: 0,
						},
						hash_evidence_fields: [
							'proposed_post_content_hash',
							'saved_post_content_hash',
						],
						version_evidence_fields: [
							'previous_server_version',
							'saved_server_version',
						],
						reviewer_identity_retained: false,
						reviewer_capability_drift_recheck_supported: false,
						requires_new_review_if_reviewer_authority_cannot_be_rechecked: true,
						exposes_raw_content: false,
						exposes_reviewer_identity: false,
						exposes_saver_identity: false,
						exposes_proof_internals: false,
						raw_content: rawContentToken,
					},
				},
				{
					pendingChangeCount: 1,
					hasPendingChanges: true,
					mustOfferLocalCopy: true,
					canExportLocalUpdates: true,
					localUpdatesImportFreshReviewRequestRecordId:
						'fresh-review-request-123',
					localUpdatesImportFreshReviewRequestAccepted: true,
					localUpdatesImportFreshReviewRequestRequested: true,
				}
			);
		const lifecycleState =
			getDistributedEditingFreshReviewLifecycleStateForSessionState(
				normalized
			);
		const preSaveState =
			getDistributedEditingFreshReviewPreSaveStateForSessionState(
				normalized
			);
		const selectorState = { distributedEditingSession: normalized };

		expect( lifecycleState ).toMatchObject( {
			retrievalStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_LIFECYCLE_RETRIEVAL_STATUSES.AVAILABLE,
			result: 'fresh_review_lifecycle_debug_available',
			restRoute: 'post_fresh_review_lifecycle',
			debugAvailable: true,
			supportEvidenceAvailable: true,
			requestRecordId: 'fresh-review-request-123',
			decisionStatus: 'approved',
			decisionRecorded: true,
			decisionConsumed: true,
			retrySaveApplied: true,
			consumesReviewDecision: true,
			lifecycleStatus: 'retry_save_consumed',
			lifecycleEvent: 'consumed',
			lifecycleReason: 'guarded_retry_save_applied',
			previousServerVersion: '56',
			savedServerVersion: '57',
			reviewedBlockItemCount: 1,
			approvedBlockItemCount: 1,
			rejectedBlockItemCount: 0,
			hashEvidenceFields: [
				'proposed_post_content_hash',
				'saved_post_content_hash',
			],
			versionEvidenceFields: [
				'previous_server_version',
				'saved_server_version',
			],
			reviewListStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_REVIEW_LIST_STATUSES.CONSUMED,
			reviewerAuthorityStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_AUTHORITY_STATUSES.RECHECK_UNSUPPORTED,
			requiresFreshReviewDueToAuthority: false,
			reviewerCapabilityDriftRecheckSupported: false,
			reviewerIdentityRetained: false,
			requiresNewReviewIfReviewerAuthorityCannotBeRechecked: true,
			canExportLocalUpdates: true,
			hasProtectedLocalChanges: true,
			shouldCallRetrySaveEndpoint: false,
			shouldCallNormalSavePost: false,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			changesPostLock: false,
			claimsSaved: false,
			exposesRawContent: false,
			exposesProofSignature: false,
			exposesReviewerIds: false,
			exposesProofInternals: false,
		} );
		expect( preSaveState ).toMatchObject( {
			reviewListStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_REVIEW_LIST_STATUSES.CONSUMED,
			lifecycleRetrievalStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_LIFECYCLE_RETRIEVAL_STATUSES.AVAILABLE,
			lifecycleStatus: 'retry_save_consumed',
			lifecycleDecisionConsumed: true,
			lifecycleRetrySaveApplied: true,
			reviewerAuthorityStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_AUTHORITY_STATUSES.RECHECK_UNSUPPORTED,
		} );
		expect(
			getDistributedEditingFreshReviewLifecycleState( selectorState )
		).toEqual( lifecycleState );
		expect( JSON.stringify( lifecycleState ) ).not.toContain(
			rawContentToken
		);
		expect( JSON.stringify( preSaveState ) ).not.toContain(
			rawContentToken
		);
		expect( JSON.stringify( lifecycleState ) ).not.toContain(
			'reviewer_user_id'
		);
	} );

	it( 'keeps reviewer-authority drift fresh-review state exportable and blocks normal save fallback', () => {
		const normalized =
			getDistributedEditingSessionStateForFreshReviewLifecycleRetrievalResult(
				{
					code: 'de_rtc_review_approval_requires_unfiltered_html',
					detail: 'retry_save_fresh_review_requires_unfiltered_html_saver',
					rest_route: 'post_retry_save',
					fresh_review_support_evidence_available: true,
					fresh_review_request_record_id: 'fresh-review-request-123',
					fresh_review_decision_lifecycle_status: 'capability_drift',
					fresh_review_decision_lifecycle_action:
						'request_new_fresh_review',
				},
				{
					pendingChangeCount: 1,
					hasPendingChanges: true,
					requiresServerStateRefetch: true,
					localUpdatesImportStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					localUpdatesImportReason:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
					localUpdatesImportFreshReviewRequestRecordId:
						'fresh-review-request-123',
					localUpdatesImportFreshReviewRequestAccepted: true,
					localUpdatesImportFreshReviewRequestRequested: true,
				}
			);
		const preSaveState =
			getDistributedEditingFreshReviewPreSaveStateForSessionState(
				normalized
			);
		const lifecycleState =
			getDistributedEditingFreshReviewLifecycleStateForSessionState(
				normalized
			);
		const prePublishState =
			getDistributedEditingFreshReviewPrePublishStateForSessionState(
				normalized
			);
		const retrySavePolicy =
			getDistributedEditingRetrySavePolicyForSessionState( normalized, {
				pendingChangeCount: 1,
				postId: 1,
				restBase: 'posts',
				proposedPostContent:
					'<!-- wp:paragraph --><p>Pending reviewed edit.</p><!-- /wp:paragraph -->',
				clientBaseVersion: '56',
				acceptedProofServerVersion: '56',
				rebasedFromVersion: '55',
			} );
		const descriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( normalized );

		expect( normalized ).toMatchObject( {
			mustOfferLocalCopy: true,
			canExportLocalUpdates: true,
			requiresServerStateRefetch: true,
			localUpdatesImportFreshReviewDecisionLifecycleStatus:
				'capability_drift',
			localUpdatesImportFreshReviewDecisionLifecycleAction:
				'request_new_fresh_review',
			localUpdatesImportFreshReviewReviewerAuthorityStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_AUTHORITY_STATUSES.AUTHORITY_DRIFT_REQUIRES_FRESH_REVIEW,
			localUpdatesImportFreshReviewRequiresFreshReviewDueToAuthority: true,
		} );
		expect( preSaveState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REVIEW_REQUIRED,
			reason: 'fresh_review_authority_drift_requires_new_review',
			placement:
				DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_PUBLISH_REVIEW,
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
			blocksNormalSavePost: true,
			requiresServerStateRefetch: true,
			canRefetchServerState: true,
			canExportLocalUpdates: false,
			actionKeys: [
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
			],
			reviewListStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_REVIEW_LIST_STATUSES.BLOCKED,
			decisionLifecycleStatus: 'capability_drift',
			decisionLifecycleAction: 'request_new_fresh_review',
			reviewerAuthorityStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_AUTHORITY_STATUSES.AUTHORITY_DRIFT_REQUIRES_FRESH_REVIEW,
			requiresFreshReviewDueToAuthority: true,
			reviewerAuthorityDriftRequiresFreshReview: true,
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( lifecycleState ).toMatchObject( {
			reviewerAuthorityStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_AUTHORITY_STATUSES.AUTHORITY_DRIFT_REQUIRES_FRESH_REVIEW,
			requiresFreshReviewDueToAuthority: true,
			canExportLocalUpdates: true,
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
			changesPostLock: false,
		} );
		expect( prePublishState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REVIEW_REQUIRED,
			reviewListStatus:
				DISTRIBUTED_EDITING_FRESH_REVIEW_REVIEW_LIST_STATUSES.BLOCKED,
			blocksNormalSavePost: true,
			requiresServerStateRefetch: true,
			canRefetchServerState: true,
			canExportLocalUpdates: false,
			exportAction: null,
			refetchAction: expect.objectContaining( {
				actionKey:
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
				descriptorOnly: true,
				callsRestEndpoint: false,
			} ),
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
			callsRestEndpoint: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( prePublishState.actionKeys ).toEqual( [
			DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.CONTINUE_GUARDED_RETRY_SAVE,
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
		] );
		expect( retrySavePolicy ).toMatchObject( {
			status: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_STATUSES.BLOCKED,
			reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
			canRetrySave: false,
			shouldCallRetrySaveEndpoint: false,
			shouldCallNormalSavePost: false,
			canExportLocalUpdates: true,
			requiresServerStateRefetch: true,
		} );
		expect( descriptors ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					kind: DISTRIBUTED_EDITING_NOTICE_KINDS.LOCAL_UPDATES_IMPORT_BLOCKED,
					freshReviewPreSaveStatus:
						DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REVIEW_REQUIRED,
					freshReviewPreSaveReviewListStatus:
						DISTRIBUTED_EDITING_FRESH_REVIEW_REVIEW_LIST_STATUSES.BLOCKED,
					freshReviewReviewerAuthorityStatus:
						DISTRIBUTED_EDITING_FRESH_REVIEW_AUTHORITY_STATUSES.AUTHORITY_DRIFT_REQUIRES_FRESH_REVIEW,
					freshReviewRequiresFreshReviewDueToAuthority: true,
					shouldCallNormalSavePost: false,
					claimsSaved: false,
				} ),
			] )
		);
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
			canExportLocalUpdates: false,
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
			saveButtonLabel: 'Save',
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
			canExportLocalUpdates: false,
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
			hasAcceptedFreshReviewConsumeValidation: false,
			acceptedReviewApprovalReviewedBlockItemCount: 0,
			acceptedFreshReviewRequestRecordId: null,
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
		const saveButton =
			getDistributedEditingSaveButtonStateForSessionState( handoffState );
		const editorSavePolicy =
			getDistributedEditingSavePolicyStateForSessionState( handoffState );

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
		expect( saveButton ).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.REFETCH_REQUIRED,
			reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
			source: 'retry_save',
			label: 'Save',
			statusText: 'WordPress will check the current post before saving.',
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.REFETCH_SERVER_STATE,
			requiresServerStateRefetch: true,
			canRefetchServerState: true,
			blocksNormalSavePost: true,
			authorityState:
				DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.SERVER_REFRESH_REQUIRED_BEFORE_UPDATE,
			localChangesState:
				DISTRIBUTED_EDITING_SAVE_LOCAL_CHANGES_STATES.PROTECTED_CHANGES_EXPORTABLE,
			reviewCheckpointState:
				DISTRIBUTED_EDITING_SAVE_REVIEW_CHECKPOINT_STATES.SERVER_REFRESH_REQUIRED,
			authoritativePostState:
				DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.SERVER_REFRESH_REQUIRED_BEFORE_UPDATE,
			saveStateSummaryText:
				'Save will check WordPress before updating; protected local changes stay in this editor until Save is confirmed.',
			actionKeys: [
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
			],
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
			callsNormalSavePost: false,
			callsRetrySaveEndpoint: false,
			claimsSaved: false,
		} );
		expect( editorSavePolicy ).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.REFETCH_REQUIRED,
			reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
			saveButtonLabel: 'Save',
			clickAction:
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.REFETCH_SERVER_STATE,
			requiresServerStateRefetch: true,
			blocksNormalSavePost: true,
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
			saveButtonStatus:
				DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.REFETCH_REQUIRED,
			saveButtonSource: 'retry_save',
			saveButtonActionKeys: [
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
			],
			claimsSaved: false,
		} );
		expect( getDistributedEditingSaveButtonState( state ) ).toEqual(
			saveButton
		);
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
				{
					pendingChangeCount: 2,
					suppressExportDuringSave: true,
				}
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
					status: 'info',
					priority: 'blocking',
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
					retrySaveHandoffReason:
						DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS,
					actionKeys: [],
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
				canExportLocalUpdates: false,
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

	it( 'clears confirmed retry-save evidence when document history creates pending local changes', () => {
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
				revision_created: true,
				created_revision_ids: [ 9001 ],
			},
			{
				clientBaseVersion: '7',
				serverVersion: '7',
				clientBaseContent:
					'<!-- wp:paragraph --><p>Saved.</p><!-- /wp:paragraph -->',
				pendingChangeCount: 1,
			}
		);
		const pendingHistoryState =
			getDistributedEditingSessionStateForPendingLocalHistoryChange(
				savedState,
				{
					historyLastAction: 'undo',
					historyRedoStack: [
						{
							beforeContent:
								'<!-- wp:paragraph --><p>Restored.</p><!-- /wp:paragraph -->',
							afterContent:
								'<!-- wp:paragraph --><p>Saved.</p><!-- /wp:paragraph -->',
							label: 'Session edits',
							source: 'undo',
						},
					],
				}
			);
		const saveButton =
			getDistributedEditingSaveButtonStateForSessionState(
				pendingHistoryState
			);
		const saveJourney =
			getDistributedEditingSaveJourneyStateForSessionState(
				pendingHistoryState,
				{ isDirty: false }
			);

		expect(
			hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState(
				savedState
			)
		).toBe( true );
		expect( pendingHistoryState ).toMatchObject( {
			pendingChangeCount: 1,
			hasPendingChanges: true,
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
			retrySaveAccepted: false,
			retrySaveServerVersion: null,
			retrySaveSavesPost: false,
			retrySaveMutatesPostContent: false,
			retrySaveClaimsSaved: false,
			retrySaveRevisionCreated: false,
			retrySaveCreatedRevisionIds: [],
			historyLastAction: 'undo',
		} );
		expect(
			hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState(
				pendingHistoryState
			)
		).toBe( false );
		expect( saveButton ).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.UPDATE_READY,
			disabled: false,
			hasRetrySaveSavedStateEvidence: false,
			hasProtectedLocalChanges: true,
		} );
		expect( saveJourney ).toMatchObject( {
			step: DISTRIBUTED_EDITING_HUMAN_LOOP_STEPS.LOCAL_CHANGES_PROTECTED,
			action: 'wait_or_export',
			dirtyEditorPreflight: false,
		} );
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
			isAwaitingServerConfirmation: false,
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
		expect( notices ).not.toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					kind: DISTRIBUTED_EDITING_NOTICE_KINDS.PENDING_CHANGES,
				} ),
			] )
		);
	} );

	it( 'does not present a blocked retry-save policy as awaiting WordPress confirmation', () => {
		const sessionState =
			getDistributedEditingSessionStateForRetrySaveHandoff(
				{
					clientBaseVersion: '4',
					serverVersion: '4',
					pendingChangeCount: 1,
					hasPendingChanges: true,
				},
				{
					status: DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
					reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_PROOF_NOT_ACCEPTED,
					policy: {
						protectsLocalChanges: true,
						requiresServerStateRefetch: false,
					},
				}
			);
		const notices =
			getDistributedEditingNoticeDescriptorsForSessionState(
				sessionState
			);

		expect( sessionState ).toMatchObject( {
			hasPendingChanges: true,
			isAwaitingServerConfirmation: false,
			requiresServerStateRefetch: false,
			retrySaveHandoffStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
			retrySaveHandoffReason:
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_PROOF_NOT_ACCEPTED,
		} );
		expect( notices ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					kind: DISTRIBUTED_EDITING_NOTICE_KINDS.RETRY_SAVE,
					retrySaveHandoffStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
					retrySaveHandoffReason:
						DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_PROOF_NOT_ACCEPTED,
				} ),
			] )
		);
		expect( notices ).not.toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					kind: DISTRIBUTED_EDITING_NOTICE_KINDS.PENDING_CHANGES,
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
			'saveAuthority',
			'actionTranscriptSummary',
			'actionTranscriptReport',
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
			saveAuthority: {
				state: expect.any( String ),
				saveButtonStatus: expect.any( String ),
				pendingServerConfirmation: expect.any( Boolean ),
				authoritativePostUpdated: expect.any( Boolean ),
			},
			actionTranscriptSummary: {
				status: 'none',
				available: false,
				itemCount: 0,
				droppedItemCount: 0,
				entriesRedacted: true,
				exposesRawContent: false,
				exposesProofInternals: false,
				exposesActorIds: false,
			},
			actionTranscriptReport: {
				status: 'none',
				available: false,
				headline: 'No Distributed Editing activity transcript report',
				chronologyStatus: 'none',
				timelineItemCount: 0,
				canShareWithSupport: true,
				exposesRawContent: false,
				exposesProofInternals: false,
				exposesTokenMaterial: false,
				exposesActorIds: false,
				claimsSaved: false,
			},
			acceptedReviewApprovalProof: null,
		} );
		expect( Object.keys( payload.post ) ).toEqual( [ 'id', 'type' ] );
		expect( payload.distributedEditingSessionState ).toBeUndefined();
		expect( JSON.stringify( payload ) ).not.toContain( clientBaseContent );
		expect( JSON.stringify( payload ) ).not.toContain(
			refetchedServerContent
		);
		expect( JSON.stringify( payload.saveAuthority ) ).not.toContain(
			editedPostContent
		);
	} );

	it( 'exports content-free Save authority diagnostics with protected local updates', () => {
		const editedPostContent =
			'<!-- wp:paragraph --><p>Local authority update</p><!-- /wp:paragraph -->';
		const payload = getDistributedEditingLocalUpdatesExportPayload( {
			currentPost: {
				id: 45,
				type: 'post',
			},
			editedPostContent,
			sessionState: {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
				retrySaveHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
				retrySaveHandoffReason:
					DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS,
				retrySaveHandoffBlocksNormalSave: true,
				retrySaveReviewApprovalProofEnvelope: {
					proofSignature: 'must-not-export-through-save-authority',
				},
				retrySaveReviewApprovalReviewerUserId: '7',
			},
		} );

		expect( payload.saveAuthority ).toEqual( {
			state: DISTRIBUTED_EDITING_SAVE_AUTHORITY_STATES.AWAITING_SERVER_CONFIRMATION,
			saveButtonStatus:
				DISTRIBUTED_EDITING_SAVE_BUTTON_STATUSES.RETRY_SAVE_IN_PROGRESS,
			saveButtonSource: 'retry_save',
			saveButtonReason: 'retry_save_in_progress',
			saveButtonClickAction: null,
			pendingServerConfirmation: true,
			authoritativePostUpdated: false,
		} );
		expect( JSON.stringify( payload.saveAuthority ) ).not.toContain(
			'Local authority update'
		);
		expect( JSON.stringify( payload.saveAuthority ) ).not.toContain(
			'must-not-export-through-save-authority'
		);
		expect( JSON.stringify( payload.saveAuthority ) ).not.toContain(
			'"7"'
		);
	} );

	it( 'exports action transcript summaries with protected local updates', () => {
		const editedPostContent =
			'<!-- wp:paragraph --><p>Local transcript export update</p><!-- /wp:paragraph -->';
		const payload = getDistributedEditingLocalUpdatesExportPayload( {
			currentPost: {
				id: 46,
				type: 'post',
			},
			editedPostContent,
			sessionState: {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
				actionTranscriptItems: [
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED,
						reviewerId: 'turn0144-reviewer-id',
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_CONSUME_VALIDATED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED,
						proofSignature: 'turn0144-hidden-proof',
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_EDITOR_ACTION,
						rawContent: editedPostContent,
					},
				],
			},
		} );

		expect( payload.actionTranscriptSummary ).toMatchObject( {
			status: 'available',
			available: true,
			itemCount: 4,
			droppedItemCount: 3,
			latestEventType:
				DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED,
			latestEventSource: 'server',
			hasFreshReviewRequest: true,
			hasFreshReviewDecision: true,
			hasFreshReviewConsumeValidation: true,
			hasFreshReviewRetrySaveConfirmation: true,
			entriesRedacted: true,
			exposesRawContent: false,
			exposesProofInternals: false,
			exposesActorIds: false,
			callsRest: false,
			callsSave: false,
			mutatesEditorContent: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( JSON.stringify( payload.actionTranscriptSummary ) ).not.toMatch(
			/Local transcript export update|turn0144-hidden-proof|turn0144-reviewer-id|rawContent|proofSignature|reviewerId/
		);
		expect( payload.actionTranscriptReport ).toMatchObject( {
			status: 'available',
			available: true,
			chronologyStatus: 'fresh_review_guarded_save_confirmed',
			latestEventLabel: 'Fresh-review Save confirmed',
			timelineItemCount: 4,
			droppedItemCount: 3,
			canShareWithSupport: true,
			requiresSaveAuthorityForPersistence: true,
			entriesRedacted: true,
			exposesRawContent: false,
			exposesProofInternals: false,
			exposesTokenMaterial: false,
			exposesActorIds: false,
			callsRest: false,
			callsSave: false,
			mutatesEditorContent: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( JSON.stringify( payload.actionTranscriptReport ) ).not.toMatch(
			/Local transcript export update|turn0144-hidden-proof|turn0144-reviewer-id|rawContent|proofSignature|reviewerId/
		);
	} );

	it( 'exports renderer capability support summaries with protected fresh-review local updates', () => {
		const editedPostContent =
			'<!-- wp:paragraph --><p>Local renderer support export update</p><!-- /wp:paragraph -->';
		const rawContentToken =
			'fresh-review-renderer-support-export-raw-token';
		const requestedState =
			getDistributedEditingSessionStateForFreshReviewDecisionItems(
				{
					pendingChangeCount: 2,
					hasPendingChanges: true,
					mustOfferLocalCopy: true,
					canExportLocalUpdates: true,
					localUpdatesImportStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					localUpdatesImportReason:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
					localUpdatesImportReviewRequestStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
					localUpdatesImportFreshReviewRequestAccepted: true,
					localUpdatesImportFreshReviewRequestRequested: true,
				},
				{
					reviewItems: [
						{
							id: 'fresh-review-renderer-support-export-html',
							blockClientId: 'client-html-export',
							blockName: 'core/html',
							blockLabel: 'HTML support export',
							blockPath: [ 0 ],
							changeKind: 'modified_block',
							riskReason: 'kses_would_remove_script',
							baseContentHash:
								'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
							proposedContentHash:
								'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
							rawContent: `<script>${ rawContentToken }</script>`,
							proofSignature:
								'fresh-review-renderer-support-export-proof',
							reviewerId: 'fresh-review-renderer-reviewer-id',
						},
						{
							id: 'fresh-review-renderer-support-export-embed',
							blockClientId: 'client-embed-export',
							blockName: 'core/embed',
							blockLabel: 'Embed support export',
							blockPath: [ 1 ],
							changeKind: 'added_block',
							riskReason: 'kses_would_change_attribute',
							baseContentHash:
								'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
							proposedContentHash:
								'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
							rawContent: `<div>${ rawContentToken }</div>`,
						},
					],
				}
			);
		const payload = getDistributedEditingLocalUpdatesExportPayload( {
			currentPost: {
				id: 47,
				type: 'post',
			},
			editedPostContent,
			sessionState: requestedState,
		} );

		expect( payload.rendererCapabilitySupportSummary ).toMatchObject( {
			status: 'available',
			available: true,
			summaryKind:
				'fresh_review_comparison_renderer_capability_support_summary',
			resolutionCount: 2,
			candidateMapCount: 2,
			missingRequiredCapabilitiesCount: 2,
			partialRequiredCapabilitiesCount: 0,
			completeButDisabledCount: 0,
			unknownCandidateRendererCapabilityCount: 0,
			candidateRendererCapabilityKeyCount: 0,
			aggregateOnly: true,
			resolverOnly: true,
			descriptorOnly: true,
			statusOnly: true,
			redacted: true,
			hashValuesRedacted: true,
			candidateMapsStored: false,
			unknownCandidateKeyNamesIncluded: false,
			rendererCodeIncluded: false,
			rawContentIncluded: false,
			exposesHashValues: false,
			exposesRawContent: false,
			exposesProofSignature: false,
			exposesTokenMaterial: false,
			exposesUserIdentity: false,
			exposesReviewerIds: false,
			exposesActorIds: false,
			canShareWithSupport: true,
			supportExportReady: true,
			supportBundleSafe: true,
			supportDiagnosticsOnly: true,
			exportPayloadSummary: true,
			localUpdatesExportReady: true,
			registersRenderer: false,
			hasRegisteredRenderer: false,
			activatesRenderer: false,
			renderable: false,
			rendersPreview: false,
			rendersDiff: false,
			computesDiff: false,
			opensComparison: false,
			opensPanel: false,
			callsRestEndpoint: false,
			callsSave: false,
			callsNormalSavePost: false,
			callsRetrySaveEndpoint: false,
			dispatchesNotice: false,
			savesPost: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			selectsBlock: false,
			selectsReviewItem: false,
			marksSelected: false,
			movesFocus: false,
			createsRevision: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect(
			payload.rendererCapabilitySupportSummary
				.requiredRendererCapabilityKeys
		).toEqual( [ 'boundary_safe_diff_renderer', 'human_review_controls' ] );
		expect( payload.postContent ).toBe( editedPostContent );
		expect( payload.distributedEditingSessionState ).toBeUndefined();
		expect( payload.sessionState ).toBeUndefined();
		expect(
			JSON.stringify( payload.rendererCapabilitySupportSummary )
		).not.toMatch(
			/fresh-review-renderer-support-export-raw-token|fresh-review-renderer-support-export-proof|fresh-review-renderer-reviewer-id|client-html-export|client-embed-export/
		);
		expect( JSON.stringify( payload.saveAuthority ) ).not.toContain(
			editedPostContent
		);
	} );

	it( 'carries redacted action transcript reports into fresh-review import recovery state', () => {
		const postContent =
			'<!-- wp:html --><script>needs review</script><!-- /wp:html -->';
		const postContentHash =
			'7e479a6c51c9e8167f1542af0c730ae0009236c4936876ebbf85bcd7c3ab7dd0';
		const unsafeMarker = 'turn0146-fresh-review-import-hidden-proof';
		const payload = {
			version: 1,
			format: DISTRIBUTED_EDITING_LOCAL_UPDATES_EXPORT_FORMAT,
			post: {
				id: 44,
				type: 'post',
			},
			postContent,
			serverVersion: '12',
			clientBaseVersion: '7',
			pendingChangeCount: 1,
			proposedPostContentHash: postContentHash,
			acceptedReviewApprovalProof: null,
			actionTranscriptSummary: {
				status: 'available',
				items: [
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_CONSUME_VALIDATED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED,
					},
				],
				droppedItemCount: 2,
			},
			actionTranscriptReport: {
				headline: unsafeMarker,
				chronologyText: postContent,
				timelineItems: [
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED,
						label: 'turn0146-fresh-review-import-reviewer-id',
					},
				],
			},
			reviewTokenRecovery: {
				status: DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_STATUSES.FRESH_REVIEW_REQUIRED,
				reason: DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_REASONS.TOKEN_UNAVAILABLE,
				requiresFreshReview: true,
				canExportLocalUpdates: true,
				serverVersion: '12',
				clientBaseVersion: '7',
			},
		};

		const result = getDistributedEditingLocalUpdatesImportResult( {
			payload,
			currentPost: {
				id: 44,
				type: 'post',
			},
			currentSessionState: {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
			},
			computedPostContentHash: postContentHash,
		} );
		const reviewRequestState =
			getDistributedEditingLocalUpdatesImportReviewRequestStateForSessionState(
				result.sessionState
			);
		const descriptor =
			getDistributedEditingNoticeDescriptorsForSessionState(
				result.sessionState
			).find(
				( item ) =>
					item.kind ===
					DISTRIBUTED_EDITING_NOTICE_KINDS.LOCAL_UPDATES_IMPORT_BLOCKED
			);

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			reason: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			hasPostContent: false,
			hasActionTranscriptReport: true,
			actionTranscriptReport: {
				status: 'available',
				available: true,
				chronologyStatus: 'fresh_review_guarded_save_confirmed',
				timelineItemCount: 4,
				droppedItemCount: 2,
				canShareWithSupport: true,
				requiresSaveAuthorityForPersistence: true,
				callsSave: false,
				savesPost: false,
				claimsSaved: false,
			},
			sessionState: {
				localUpdatesImportStatus:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
				localUpdatesImportReason:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
				localUpdatesImportActionTranscriptReport: {
					available: true,
					chronologyStatus: 'fresh_review_guarded_save_confirmed',
					timelineItemCount: 4,
					droppedItemCount: 2,
				},
				localUpdatesImportHasPostContent: false,
			},
			mutatesEditorContent: false,
			callsRetrySaveEndpoint: false,
			callsNormalSavePost: false,
			dispatchesNotice: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( reviewRequestState ).toMatchObject( {
			requiresFreshReview: true,
			hasActionTranscriptReport: true,
			canShowActionTranscriptReport: true,
			actionTranscriptReport: {
				available: true,
				chronologyStatus: 'fresh_review_guarded_save_confirmed',
				requiresSaveAuthorityForPersistence: true,
			},
			shouldCallRetrySaveEndpoint: false,
			shouldCallNormalSavePost: false,
			mutatesEditorContent: false,
			claimsSaved: false,
		} );
		expect( descriptor ).toMatchObject( {
			kind: DISTRIBUTED_EDITING_NOTICE_KINDS.LOCAL_UPDATES_IMPORT_BLOCKED,
			localUpdatesImportHasActionTranscriptReport: true,
			localUpdatesImportCanShowActionTranscriptReport: true,
			localUpdatesImportActionTranscriptReport: {
				available: true,
				chronologyStatus: 'fresh_review_guarded_save_confirmed',
				requiresSaveAuthorityForPersistence: true,
			},
		} );
		expect(
			JSON.stringify( { result, reviewRequestState, descriptor } )
		).not.toMatch(
			/turn0146-fresh-review-import-hidden-proof|turn0146-fresh-review-import-reviewer-id|<script>|proofSignature|reviewerId/
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

	it( 'prefers opaque review approval proof token envelopes for local-updates handoff', () => {
		const postContent =
			'<!-- wp:html --><script>approved</script><!-- /wp:html -->';
		const proposedPostContentHash =
			'7e479a6c51c9e8167f1542af0c730ae0009236c4936876ebbf85bcd7c3ab7dd0';
		const opaqueTokenEnvelope = {
			proof_envelope_type:
				DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_ENVELOPE_TYPE,
			token: 'de-rtc-review-token.turn-0077',
			token_version: 1,
			issued_at: 1893456000,
			expires_at: 1893456300,
			post: {
				id: 44,
				type: 'post',
			},
		};
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
				retrySaveReviewApprovalProofEnvelope: opaqueTokenEnvelope,
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
				retrySaveReviewApprovalReviewedBlockItems: [
					{
						id: 'risk-html-approved',
						proposedContentHash: proposedPostContentHash,
						reviewedProposedContentHash: proposedPostContentHash,
						reviewStatus: 'approved_for_retry_save',
					},
				],
			},
		} );

		expect( Object.keys( payload ) ).toEqual( [
			'version',
			'format',
			'post',
			'postContent',
			'pendingChangeCount',
			'saveAuthority',
			'actionTranscriptSummary',
			'actionTranscriptReport',
			'serverVersion',
			'clientBaseVersion',
			'acceptedReviewApprovalProof',
		] );
		expect( payload.serverVersion ).toBe( '12' );
		expect( payload.clientBaseVersion ).toBe( '7' );
		expect( payload.acceptedReviewApprovalProof ).toEqual(
			opaqueTokenEnvelope
		);
		expect(
			JSON.stringify( payload.acceptedReviewApprovalProof )
		).not.toContain( 'proofSignature' );
		expect(
			JSON.stringify( payload.acceptedReviewApprovalProof )
		).not.toContain( 'reviewedBlockItems' );
		expect( payload.acceptedReviewApprovalProof.proof ).toBeUndefined();

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
			hasAcceptedReviewApprovalProof: true,
			acceptedReviewApprovalProof: opaqueTokenEnvelope,
			mutatesEditorContent: true,
			callsRetrySaveEndpoint: false,
			callsNormalSavePost: false,
			claimsSaved: false,
		} );
		expect( result.sessionState ).toMatchObject( {
			retrySaveReviewApprovalProofEnvelope: opaqueTokenEnvelope,
			retrySaveReviewApprovalProofStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
			retrySaveReviewApprovalAccepted: true,
			retrySaveReviewApprovalProofSignature: null,
			retrySaveReviewApprovalReviewedBlockItems: [],
			serverVersion: '12',
			clientBaseVersion: '7',
			localUpdatesImportHasAcceptedReviewApprovalProof: true,
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
			acceptedReviewApprovalReviewedBlockItemCount: 0,
			request: {
				clientBaseVersion: '12',
				acceptedProofServerVersion: '12',
				rebasedFromVersion: '7',
				acceptedReviewApprovalProof: opaqueTokenEnvelope,
			},
		} );

		expect(
			getDistributedEditingLocalUpdatesImportResult( {
				payload,
				currentPost: {
					id: 44,
					type: 'post',
				},
				computedPostContentHash: proposedPostContentHash,
				now: 1893456301,
			} )
		).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			reason: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.EXPIRED_REVIEW_APPROVAL_PROOF,
			hasPostContent: false,
			hasAcceptedReviewApprovalProof: false,
			mutatesEditorContent: false,
			callsRetrySaveEndpoint: false,
			claimsSaved: false,
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

	it( 'rebases distinct inline formatting changes in the same paragraph', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>This is bold and italicized.</p><!-- /wp:paragraph -->';
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
				'<!-- wp:paragraph --><p>This is <strong>bold</strong> and italicized.</p><!-- /wp:paragraph -->',
			localContent:
				'<!-- wp:paragraph --><p>This is bold and <em>italicized</em>.</p><!-- /wp:paragraph -->',
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
			hasCandidatePostContent: true,
			readyToRetrySubmit: true,
			requiresManualConflictResolution: false,
		} );
		expect( result.candidatePostContent ).toBe(
			'<!-- wp:paragraph --><p>This is <strong>bold</strong> and <em>italicized</em>.</p><!-- /wp:paragraph -->'
		);
	} );

	it( 'rebases local paragraph text insertion over remote inline formatting', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>Some pretext to a post.</p><!-- /wp:paragraph -->';
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
				'<!-- wp:paragraph --><p>Some <em>pretext</em> to a post.</p><!-- /wp:paragraph -->',
			localContent:
				'<!-- wp:paragraph --><p>Some pretext to a WordPress post.</p><!-- /wp:paragraph -->',
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
			hasCandidatePostContent: true,
			readyToRetrySubmit: true,
			requiresManualConflictResolution: false,
		} );
		expect( result.candidatePostContent ).toBe(
			'<!-- wp:paragraph --><p>Some <em>pretext</em> to a WordPress post.</p><!-- /wp:paragraph -->'
		);
	} );

	it( 'rebases non-overlapping word edits in one paragraph', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>The blue river meets the quiet forest.</p><!-- /wp:paragraph -->';
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
				'<!-- wp:paragraph --><p>The silver river meets the quiet forest.</p><!-- /wp:paragraph -->',
			localContent:
				'<!-- wp:paragraph --><p>The blue river meets the green forest.</p><!-- /wp:paragraph -->',
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
			hasCandidatePostContent: true,
			readyToRetrySubmit: true,
			requiresManualConflictResolution: false,
		} );
		expect( result.candidatePostContent ).toBe(
			'<!-- wp:paragraph --><p>The silver river meets the green forest.</p><!-- /wp:paragraph -->'
		);
	} );

	it( 'requires manual conflict for overlapping inline formatting changes', () => {
		const baseContent =
			'<!-- wp:paragraph --><p>This is bold.</p><!-- /wp:paragraph -->';
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
				'<!-- wp:paragraph --><p>This is <strong>bold</strong>.</p><!-- /wp:paragraph -->',
			localContent:
				'<!-- wp:paragraph --><p>This is <em>bold</em>.</p><!-- /wp:paragraph -->',
		} );

		expect( result ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
			reason: 'rich_text_format_ranges_overlap',
			hasCandidatePostContent: false,
			readyToRetrySubmit: false,
			requiresManualConflictResolution: true,
		} );
	} );

	it( 'preserves no-save stale-base conflict resolution choices without enabling proof or save', () => {
		const normalized = normalizeDistributedEditingSessionState( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
			pendingChangeCount: 1,
			localRebaseResultStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
			localRebaseResultReason: 'same_block_changed',
			requiresManualConflictResolution: true,
			staleBaseConflictResolutionStatus:
				DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LATEST_WORDPRESS_SELECTED,
			staleBaseConflictResolutionChoice:
				DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS,
			staleBaseConflictResolutionRequiresFreshProof: true,
			staleBaseConflictResolutionCallsRest: false,
			staleBaseConflictResolutionCallsSave: false,
			staleBaseConflictResolutionMutatesEditorContent: true,
			staleBaseConflictResolutionMutatesPersistedPostContent: false,
			staleBaseConflictResolutionCreatesRevision: false,
			staleBaseConflictResolutionChangesPostLock: false,
			staleBaseConflictResolutionClaimsSaved: false,
			readyToRetrySubmit: true,
			retrySubmitHandoffStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.READY,
		} );

		expect( normalized ).toMatchObject( {
			staleBaseConflictResolutionStatus:
				DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LATEST_WORDPRESS_SELECTED,
			staleBaseConflictResolutionChoice:
				DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS,
			staleBaseConflictResolutionRequiresFreshProof: true,
			staleBaseConflictResolutionCallsRest: false,
			staleBaseConflictResolutionCallsSave: false,
			staleBaseConflictResolutionMutatesEditorContent: true,
			staleBaseConflictResolutionMutatesPersistedPostContent: false,
			staleBaseConflictResolutionCreatesRevision: false,
			staleBaseConflictResolutionChangesPostLock: false,
			staleBaseConflictResolutionClaimsSaved: false,
			requiresManualConflictResolution: true,
			readyToRetrySubmit: false,
			retrySubmitHandoffStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.NONE,
		} );
	} );

	it( 'accepts fresh proof for a chosen same-block conflict without preparing retry-save', () => {
		const sessionState =
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
				{
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					reasonCode:
						DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
					clientBaseVersion: '7',
					serverVersion: '8',
					pendingChangeCount: 1,
					hasPendingChanges: true,
					requiresManualConflictResolution: true,
					canExportLocalUpdates: true,
					localRebaseResultStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
					localRebaseResultReason: 'same_block_changed',
					staleBaseConflictResolutionStatus:
						DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LOCAL_VERSION_SELECTED,
					staleBaseConflictResolutionChoice:
						DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL,
					staleBaseConflictResolutionRequiresFreshProof: true,
				}
			);
		const savePolicy = getDistributedEditingRetrySavePolicyForSessionState(
			sessionState,
			{
				postId: 44,
				restBase: 'posts',
				proposedPostContent:
					'<!-- wp:paragraph --><p>Chosen local version.</p><!-- /wp:paragraph -->',
			}
		);
		const editorSavePolicy =
			getDistributedEditingSavePolicyStateForSessionState( sessionState );
		const pendingDescriptor =
			getDistributedEditingNoticeDescriptorsForSessionState(
				sessionState
			).find(
				( descriptor ) =>
					descriptor.kind ===
					DISTRIBUTED_EDITING_NOTICE_KINDS.PENDING_CHANGES
			);

		expect( sessionState ).toMatchObject( {
			disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
			reasonCode: null,
			requiresManualConflictResolution: false,
			staleBaseConflictResolutionStatus:
				DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LOCAL_VERSION_SELECTED,
			staleBaseConflictResolutionChoice:
				DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL,
			staleBaseConflictResolutionRequiresFreshProof: false,
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
			retrySubmitAccepted: true,
			retrySubmitSavePathRequired: true,
			retrySubmitSavesPost: false,
			retrySubmitMutatesPostContent: false,
			retrySubmitCreatesRevision: false,
			retrySubmitClaimsSaved: false,
			retrySubmitSaveStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.NONE,
			retrySubmitSaveReady: false,
			canExportLocalUpdates: true,
		} );
		expect( savePolicy ).toMatchObject( {
			status: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_STATUSES.BLOCKED,
			reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_SAVE_NOT_READY,
			hasAcceptedProof: true,
			hasPreparedSavePath: false,
			shouldCallRetrySaveEndpoint: false,
			shouldCallNormalSavePost: false,
			protectsLocalChanges: true,
			canExportLocalUpdates: true,
			claimsSaved: false,
		} );
		expect( editorSavePolicy ).toMatchObject( {
			status: DISTRIBUTED_EDITING_SAVE_POLICY_STATUSES.READY_FOR_REVIEWED_RETRY_SAVE,
			reason: 'accepted_retry_submit_proof_needs_save_preparation',
			saveButtonLabel: 'Continue Save',
			blocksNormalSavePost: true,
			shouldCallNormalSavePost: false,
			shouldCallRetrySaveEndpoint: false,
			claimsSaved: false,
		} );
		expect( pendingDescriptor ).toMatchObject( {
			actionKeys: [
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.PREPARE_RETRY_SUBMIT_SAVE,
			],
			staleBaseConflictResolutionStatus:
				DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LOCAL_VERSION_SELECTED,
			staleBaseConflictResolutionChoice:
				DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL,
			staleBaseConflictResolutionRequiresFreshProof: false,
			conflictResolutionProofAccepted: true,
			conflictResolutionNeedsSavePreparation: true,
			conflictResolutionAuthoritativePostUpdated: false,
			retrySubmitSaveStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.NONE,
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
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
				],
			} ),
			expect.objectContaining( {
				id: DISTRIBUTED_EDITING_NOTICE_IDS.REMOTE_CHANGES_RECEIVED,
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.REMOTE_CHANGES_RECEIVED,
			} ),
		] );
	} );

	it( 'suppresses remote-review and export notice actions while Save is in flight', () => {
		const notices = getDistributedEditingNoticeDescriptorsForSessionState(
			normalizeDistributedEditingSessionState( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				pendingChangeCount: 1,
				remoteChangeCount: 1,
				refetchedServerState: true,
				canExportLocalUpdates: true,
				saveButtonClickInFlight: true,
			} )
		);
		const actionKeys = notices.flatMap( ( notice ) => notice.actionKeys );

		expect(
			notices.some(
				( notice ) =>
					notice.kind ===
					DISTRIBUTED_EDITING_NOTICE_KINDS.REMOTE_CHANGES_RECEIVED
			)
		).toBe( false );
		expect( actionKeys ).not.toContain(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.REVIEW_REMOTE_CHANGES
		);
		expect( actionKeys ).not.toContain(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES
		);
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
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.REBASE_LOCAL_UPDATES,
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
			],
		} );
		expect( JSON.stringify( notices[ 0 ] ) ).not.toContain( baseContent );
		expect( JSON.stringify( notices[ 0 ] ) ).not.toContain( serverContent );
	} );

	it( 'orders stale-base retry-submit preparation actions by the visible Save cue sequence', () => {
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
			readyToRetrySubmit: true,
			clientBaseContent: '',
			refetchedServerContent: '',
		} );

		expect( notices[ 0 ] ).toMatchObject( {
			kind: DISTRIBUTED_EDITING_NOTICE_KINDS.STALE_BASE_REJECTED,
			readyToRetrySubmit: true,
			actionKeys: [
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.PREPARE_RETRY_SUBMIT,
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
			],
		} );
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
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFRESH_RETRY_SUBMIT_PROOF,
				DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
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

async function createAcceptedBlockIdentitySyncMeta( blocks ) {
	ensureDistributedEditingTestCrypto();

	const blockLetters = [ 'a', 'b', 'c', 'd' ];

	return {
		schema: 'de-rtc-block-identity-v1',
		document_uuid: 'doc-turn-0366',
		version: '41',
		content_hash: await getDistributedEditingPostContentSha256Hash(
			blocks.join( '\n\n' )
		),
		blocks: await Promise.all(
			blocks.map( async ( serializedBlock, index ) => ( {
				block_uid: `block-${ blockLetters[ index ] ?? index }`,
				parent_uid: null,
				block_name: 'core/paragraph',
				ordinal_path: [ index ],
				serialized_hash:
					await getDistributedEditingPostContentSha256Hash(
						serializedBlock
					),
			} ) )
		),
	};
}

function ensureDistributedEditingTestCrypto() {
	if ( ! globalThis.crypto?.subtle ) {
		Object.defineProperty( globalThis, 'crypto', {
			configurable: true,
			value: webcrypto,
		} );
	}

	if ( typeof globalThis.TextEncoder !== 'function' ) {
		Object.defineProperty( globalThis, 'TextEncoder', {
			configurable: true,
			value: NodeTextEncoder,
		} );
	}
}

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

	it( 'selects content-free action transcript state', () => {
		const state = {
			distributedEditingSession: normalizeDistributedEditingSessionState(
				{
					actionTranscriptItems: [
						{
							eventType:
								DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_STATE_CHANGED,
						},
					],
				}
			),
		};

		expect(
			getDistributedEditingActionTranscriptState( state )
		).toMatchObject( {
			status: 'available',
			itemCount: 1,
			latestEventType:
				DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.SAVE_STATE_CHANGED,
			entriesRedacted: true,
			exposesRawContent: false,
			callsSave: false,
			claimsSaved: false,
		} );
	} );

	it( 'selects presence roster state without transport side effects', () => {
		const state = {
			distributedEditingSession: normalizeDistributedEditingSessionState(
				{
					presenceRosterEntries: [
						{
							key: 'presence-other-tab',
							relationship: 'same_user_other_tab',
							freshness: 'current',
						},
					],
				}
			),
		};

		expect(
			getDistributedEditingPresenceRosterState( state )
		).toMatchObject( {
			status: DISTRIBUTED_EDITING_PRESENCE_ROSTER_STATUSES.ACTIVE,
			copy: {
				summary: 'You have this post open in another tab.',
			},
			callsRestEndpoint: false,
			callsSave: false,
			mutatesEditorContent: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
	} );

	it( 'selects repeated presence cadence runtime state without transport side effects', () => {
		const state = {
			distributedEditingSession: normalizeDistributedEditingSessionState(
				{
					distributedEditingPresenceRepeatedRefreshRuntime: {
						explicitOptIn: true,
						hostProfile: 'cheap_shared_host',
						standardPollingIntervalSeconds: 30,
						cheapHostPollingIntervalSeconds: 120,
						heartbeatIntervalSeconds: 120,
					},
				}
			),
		};

		expect(
			getDistributedEditingPresenceRepeatedRefreshRuntimeState( state )
		).toMatchObject( {
			status: DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.SCHEDULED,
			localConnectionState:
				DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.CONNECTED,
			selectedIntervalSeconds: 120,
			selectedHeartbeatIntervalSeconds: 120,
			schedulesNextRefresh: true,
			schedulesNextHeartbeat: true,
			callsPresenceReadEndpointNow: false,
			callsHeartbeatEndpointNow: false,
			startsPollingImmediately: false,
			callsSave: false,
			mutatesEditorContent: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
	} );

	it( 'selects initial presence startup policy state without transport side effects', () => {
		const state = {
			distributedEditingSession: normalizeDistributedEditingSessionState(
				{
					distributedEditingPresenceStartupPolicy: {
						allowAutomaticInitialHeartbeat: true,
						allowSlowAutomaticInitialHeartbeat: true,
						hostProfile: 'cheap_shared_host',
						standardInitialHeartbeatDelaySeconds: 10,
						cheapHostInitialHeartbeatDelaySeconds: 120,
						minimumInitialHeartbeatDelaySeconds: 60,
					},
				}
			),
		};

		expect(
			getDistributedEditingPresenceStartupPolicyState( state )
		).toMatchObject( {
			status: DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.SLOW_AUTOMATIC_HEARTBEAT_ALLOWED,
			reason: 'cheap_host_slow_startup_allowed',
			maySendInitialHeartbeatAutomatically: true,
			slowAutomaticHeartbeatAllowed: true,
			selectedInitialHeartbeatDelaySeconds: 120,
			callsHeartbeatEndpointNow: false,
			writesPresenceNow: false,
			startsPollingNow: false,
			startsTimerNow: false,
			callsSave: false,
			mutatesEditorContent: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
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

	it( 'selects fresh-review token recovery state without side effects', () => {
		const state = {
			distributedEditingSession: normalizeDistributedEditingSessionState(
				{
					pendingChangeCount: 1,
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD,
					retrySaveReason:
						'unknown_retry_save_review_approval_proof_token',
				}
			),
		};

		expect(
			getDistributedEditingReviewTokenRecoveryState( state )
		).toEqual(
			expect.objectContaining( {
				status: DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_STATUSES.FRESH_REVIEW_REQUIRED,
				reason: DISTRIBUTED_EDITING_REVIEW_TOKEN_RECOVERY_REASONS.TOKEN_UNAVAILABLE,
				requiresFreshReview: true,
				canExportLocalUpdates: true,
				actionKey:
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
				shouldCallRetrySaveEndpoint: false,
				shouldCallNormalSavePost: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			} )
		);
	} );

	it( 'exposes fresh-review import review request state without proof internals or saves', () => {
		const sessionState = normalizeDistributedEditingSessionState( {
			localUpdatesImportStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			localUpdatesImportReason:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			localUpdatesImportPostId: '44',
			localUpdatesImportPostType: 'post',
			hasPendingChanges: true,
			canExportLocalUpdates: true,
		} );
		const state = {
			distributedEditingSession: sessionState,
		};

		const reviewRequestState =
			getDistributedEditingLocalUpdatesImportReviewRequestStateForSessionState(
				sessionState
			);

		expect( reviewRequestState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.FRESH_REVIEW_REQUIRED,
			reason: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			requiresFreshReview: true,
			actionKey: DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW,
			localUpdatesImportStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			localUpdatesImportReason:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			localUpdatesImportHasPostContent: false,
			localUpdatesImportHasAcceptedReviewApprovalProof: false,
			canExportLocalUpdates: true,
			hasProtectedLocalChanges: true,
			shouldCallRetrySaveEndpoint: false,
			shouldCallNormalSavePost: false,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			changesPostLock: false,
			claimsSaved: false,
			exposesTokenInternals: false,
			exposesProofSignature: false,
			exposesReviewedBlockItems: false,
			exposesReviewerIds: false,
			exposesRawContent: false,
		} );
		expect(
			getDistributedEditingLocalUpdatesImportReviewRequestState( state )
		).toEqual( reviewRequestState );
		expect(
			getDistributedEditingNoticeDescriptorsForSessionState(
				sessionState
			)
		).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					kind: DISTRIBUTED_EDITING_NOTICE_KINDS.LOCAL_UPDATES_IMPORT_BLOCKED,
					status: 'warning',
					actionKeys: [
						DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW,
					],
					localUpdatesImportRequiresFreshReview: true,
					localUpdatesImportReviewRequestStatus:
						DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.FRESH_REVIEW_REQUIRED,
					localUpdatesImportReviewActionKey:
						DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW,
					shouldCallRetrySaveEndpoint: false,
					shouldCallNormalSavePost: false,
					dispatchesNotice: false,
					mutatesEditorContent: false,
					mutatesPersistedPostContent: false,
					changesPostLock: false,
					claimsSaved: false,
					exposesTokenInternals: false,
					exposesProofSignature: false,
					exposesReviewedBlockItems: false,
					exposesReviewerIds: false,
					exposesRawContent: false,
				} ),
			] )
		);
	} );

	it( 'normalizes accepted fresh-review requests without saving or exposing proof internals', () => {
		const currentSessionState = normalizeDistributedEditingSessionState( {
			serverVersion: '12',
			clientBaseVersion: '7',
			pendingChangeCount: 1,
			localUpdatesImportStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			localUpdatesImportReason:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			localUpdatesImportPostId: '44',
			localUpdatesImportPostType: 'post',
			localUpdatesImportVerifiedPostContentHash:
				'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
			localUpdatesImportActionTranscriptReport: {
				available: true,
				timelineItems: [
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_CONSUME_VALIDATED,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED,
					},
				],
				droppedItemCount: 2,
				chronologyText: 'turn0147-accepted-request-raw-content-marker',
				headline: 'turn0147-accepted-request-hidden-proof',
			},
			hasPendingChanges: true,
			canExportLocalUpdates: true,
		} );
		const sessionState =
			getDistributedEditingSessionStateForFreshReviewRequestResult(
				{
					result: 'fresh_review_request_accepted_for_admin_review',
					fresh_review_request_status: 'requested',
					fresh_review_request_action: 'request_admin_review',
					rest_route: 'post_fresh_review_request',
					saves_post: false,
					mutates_post_content: false,
					creates_revision: false,
					claims_saved: false,
				},
				currentSessionState
			);
		const reviewRequestState =
			getDistributedEditingLocalUpdatesImportReviewRequestStateForSessionState(
				sessionState
			);
		const descriptor =
			getDistributedEditingNoticeDescriptorsForSessionState(
				sessionState
			).find(
				( item ) =>
					item.kind ===
					DISTRIBUTED_EDITING_NOTICE_KINDS.LOCAL_UPDATES_IMPORT_BLOCKED
			);
		const decisionState =
			getDistributedEditingFreshReviewDecisionStateForSessionState(
				sessionState
			);
		const decisionStateWithItems =
			getDistributedEditingFreshReviewDecisionStateForSessionState(
				getDistributedEditingSessionStateForFreshReviewDecisionItems(
					sessionState,
					{
						items: [
							{
								id: 'fresh-review-context-item',
								blockLabel: 'Fresh review context item',
								proposedContentHash:
									'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
								rawBlockContent:
									'<script>turn0148-hidden-item-content</script>',
							},
						],
					}
				)
			);

		expect( sessionState ).toMatchObject( {
			localUpdatesImportReviewRequestStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
			localUpdatesImportReviewActionKey: null,
			localUpdatesImportFreshReviewRequestAccepted: true,
			localUpdatesImportFreshReviewRequestRequested: true,
			localUpdatesImportFreshReviewRequestResult:
				'fresh_review_request_accepted_for_admin_review',
			localUpdatesImportFreshReviewRequestAction: 'request_admin_review',
			localUpdatesImportFreshReviewRequestRestRoute:
				'post_fresh_review_request',
			localUpdatesImportFreshReviewRequestSavesPost: false,
			localUpdatesImportFreshReviewRequestMutatesPostContent: false,
			localUpdatesImportFreshReviewRequestCreatesRevision: false,
			localUpdatesImportFreshReviewRequestClaimsSaved: false,
			localUpdatesImportActionTranscriptReport: {
				available: true,
				chronologyStatus: 'fresh_review_guarded_save_confirmed',
				timelineItemCount: 4,
				droppedItemCount: 2,
				canShareWithSupport: true,
				requiresSaveAuthorityForPersistence: true,
				callsSave: false,
				claimsSaved: false,
			},
			retrySaveClaimsSaved: false,
			canExportLocalUpdates: true,
			mustOfferLocalCopy: true,
		} );
		expect( reviewRequestState ).toMatchObject( {
			status: DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
			actionKey: null,
			requestAccepted: true,
			requestRequested: true,
			hasActionTranscriptReport: true,
			canShowActionTranscriptReport: true,
			actionTranscriptReport: {
				available: true,
				chronologyStatus: 'fresh_review_guarded_save_confirmed',
				requiresSaveAuthorityForPersistence: true,
			},
			shouldCallRetrySaveEndpoint: false,
			shouldCallNormalSavePost: false,
			mutatesEditorContent: false,
			claimsSaved: false,
			exposesTokenInternals: false,
			exposesProofSignature: false,
			exposesReviewedBlockItems: false,
			exposesReviewerIds: false,
			exposesRawContent: false,
		} );
		expect( descriptor ).toEqual(
			expect.objectContaining( {
				status: 'info',
				localUpdatesImportFreshReviewRequestAccepted: true,
				localUpdatesImportFreshReviewRequestRequested: true,
				localUpdatesImportFreshReviewRequestAction:
					'request_admin_review',
				localUpdatesImportFreshReviewRequestRestRoute:
					'post_fresh_review_request',
				localUpdatesImportFreshReviewRequestClaimsSaved: false,
				localUpdatesImportHasActionTranscriptReport: true,
				localUpdatesImportCanShowActionTranscriptReport: true,
				localUpdatesImportActionTranscriptReport:
					expect.objectContaining( {
						available: true,
						chronologyStatus: 'fresh_review_guarded_save_confirmed',
						requiresSaveAuthorityForPersistence: true,
					} ),
				actionKeys: [],
			} )
		);
		expect( decisionState ).toMatchObject( {
			requestStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
			accepted: true,
			hasActionTranscriptReport: true,
			canShowActionTranscriptReport: true,
			actionTranscriptReport: {
				available: true,
				chronologyStatus: 'fresh_review_guarded_save_confirmed',
				timelineItemCount: 4,
				droppedItemCount: 2,
				requiresSaveAuthorityForPersistence: true,
				callsSave: false,
				claimsSaved: false,
			},
			callsNormalSavePost: false,
			callsRetrySaveEndpoint: false,
			mutatesEditorContent: false,
			claimsSaved: false,
		} );
		expect( decisionStateWithItems.reviewItems ).toEqual( [
			expect.objectContaining( {
				id: 'fresh-review-context-item',
				hasActionTranscriptReportContext: true,
				canShowActionTranscriptReportContext: true,
				actionTranscriptReportContext: expect.objectContaining( {
					available: true,
					chronologyStatus: 'fresh_review_guarded_save_confirmed',
					latestEventLabel: 'Fresh-review Save confirmed',
					timelineItemCount: 4,
					droppedItemCount: 2,
					canShareWithSupport: true,
					requiresSaveAuthorityForPersistence: true,
					entriesRedacted: true,
					exposesRawContent: false,
					exposesProofInternals: false,
					exposesTokenMaterial: false,
					exposesActorIds: false,
					dispatchesNotice: false,
					callsRest: false,
					callsSave: false,
					callsRetrySaveEndpoint: false,
					callsNormalSavePost: false,
					savesPost: false,
					mutatesEditorContent: false,
					mutatesPersistedPostContent: false,
					createsRevision: false,
					changesPostLock: false,
					claimsSaved: false,
				} ),
				rawContentIncluded: false,
				exposesRawContent: false,
				exposesProofSignature: false,
				exposesReviewerIds: false,
			} ),
		] );
		expect( JSON.stringify( descriptor ) ).not.toMatch(
			/proof_signature|reviewer_user_id|low_privileged_saver_user_id|reviewed_block_items|postContent|post_content|turn0147-accepted-request-hidden-proof|turn0147-accepted-request-raw-content-marker|turn0148-hidden-item-content/
		);
		expect( JSON.stringify( decisionState ) ).not.toMatch(
			/proof_signature|reviewer_user_id|low_privileged_saver_user_id|reviewed_block_items|postContent|post_content|turn0147-accepted-request-hidden-proof|turn0147-accepted-request-raw-content-marker|turn0148-hidden-item-content/
		);
		expect( JSON.stringify( decisionStateWithItems ) ).not.toMatch(
			/proof_signature|reviewer_user_id|low_privileged_saver_user_id|reviewed_block_items|postContent|post_content|turn0147-accepted-request-hidden-proof|turn0147-accepted-request-raw-content-marker|turn0148-hidden-item-content/
		);
	} );

	it( 'prepares content-free block identity request proof without Gutenberg clientId', async () => {
		const baseBlocks = [
			'<!-- wp:paragraph -->\n<p>Alpha</p>\n<!-- /wp:paragraph -->',
			'<!-- wp:paragraph -->\n<p>Bravo</p>\n<!-- /wp:paragraph -->',
		];
		const insertedBlock =
			'<!-- wp:paragraph -->\n<p>Inserted</p>\n<!-- /wp:paragraph -->';
		const acceptedSyncMeta =
			await createAcceptedBlockIdentitySyncMeta( baseBlocks );
		const descriptor =
			await getDistributedEditingBlockIdentityRequestProofDescriptor( {
				acceptedSyncMeta,
				proposedPostContent: [
					baseBlocks[ 0 ],
					insertedBlock,
					baseBlocks[ 1 ],
				].join( '\n\n' ),
			} );
		const insertedHash =
			await getDistributedEditingPostContentSha256Hash( insertedBlock );

		expect( descriptor ).toMatchObject( {
			status: DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES.READY,
			reason: null,
			contentFree: true,
			usesGutenbergClientId: false,
			exposesRawContent: false,
			callsRest: false,
			callsSave: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			createsRevision: false,
			changesPostLock: false,
			claimsSaved: false,
			proposedBlockCount: 3,
			retainedBlockCount: 2,
			insertedBlockCount: 1,
			deletedBlockCount: 0,
			movedBlockCount: 1,
		} );
		expect( descriptor.requestProof ).toMatchObject( {
			client_base_version: '41',
			retained_block_uids: [ 'block-a', 'block-b' ],
			inserted_block_nonces: [
				`inserted-1-${ insertedHash.slice( 0, 16 ) }`,
			],
			deleted_block_uids: [],
			moved_block_uids: [ 'block-b' ],
		} );
		expect( descriptor.requestProof.proposed_block_map ).toEqual( [
			expect.objectContaining( {
				block_uid: 'block-a',
				block_name: 'core/paragraph',
				ordinal_path: [ 0 ],
			} ),
			expect.objectContaining( {
				inserted_block_nonce: `inserted-1-${ insertedHash.slice(
					0,
					16
				) }`,
				block_name: 'core/paragraph',
				ordinal_path: [ 1 ],
			} ),
			expect.objectContaining( {
				block_uid: 'block-b',
				block_name: 'core/paragraph',
				ordinal_path: [ 2 ],
			} ),
		] );
		expect( JSON.stringify( descriptor.requestProof ) ).not.toMatch(
			/Alpha|Bravo|Inserted|postContent|proposedPostContent|rawPostContent|clientId|client_id/
		);
	} );

	it( 'recognizes content-free distinct-gap block identity insertions', async () => {
		const baseBlocks = [
			'<!-- wp:paragraph -->\n<p>Alpha</p>\n<!-- /wp:paragraph -->',
			'<!-- wp:paragraph -->\n<p>Bravo</p>\n<!-- /wp:paragraph -->',
			'<!-- wp:paragraph -->\n<p>Charlie</p>\n<!-- /wp:paragraph -->',
		];
		const serverInsertedBlock =
			'<!-- wp:paragraph -->\n<p>Server insert</p>\n<!-- /wp:paragraph -->';
		const localInsertedBlock =
			'<!-- wp:paragraph -->\n<p>Local insert</p>\n<!-- /wp:paragraph -->';
		const acceptedSyncMeta =
			await createAcceptedBlockIdentitySyncMeta( baseBlocks );
		const descriptor =
			await getDistributedEditingBlockIdentityDistinctGapInsertionDescriptor(
				{
					acceptedSyncMeta,
					serverPostContent: [
						baseBlocks[ 0 ],
						serverInsertedBlock,
						baseBlocks[ 1 ],
						baseBlocks[ 2 ],
					].join( '\n\n' ),
					proposedPostContent: [
						baseBlocks[ 0 ],
						baseBlocks[ 1 ],
						baseBlocks[ 2 ],
						localInsertedBlock,
					].join( '\n\n' ),
				}
			);

		expect( descriptor ).toMatchObject( {
			status: DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES.READY,
			reason: null,
			requestProof: null,
			acceptedBlockCount: 3,
			serverBlockCount: 4,
			proposedBlockCount: 4,
			serverInsertedBlockCount: 1,
			proposedInsertedBlockCount: 1,
			serverInsertedGapIndexes: [ 1 ],
			proposedInsertedGapIndexes: [ 3 ],
			conflictingGapIndex: null,
			contentFree: true,
			usesGutenbergClientId: false,
			exposesRawContent: false,
			callsRest: false,
			callsSave: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			createsRevision: false,
			changesPostLock: false,
			claimsSaved: false,
		} );
		expect( JSON.stringify( descriptor ) ).not.toMatch(
			/Alpha|Bravo|Charlie|Server insert|Local insert|postContent|proposedPostContent|rawPostContent|clientId|client_id/
		);
	} );

	it( 'blocks same-gap block identity insertions before retry-save handoff', async () => {
		const baseBlocks = [
			'<!-- wp:paragraph -->\n<p>Alpha</p>\n<!-- /wp:paragraph -->',
			'<!-- wp:paragraph -->\n<p>Bravo</p>\n<!-- /wp:paragraph -->',
		];
		const serverInsertedBlock =
			'<!-- wp:paragraph -->\n<p>Server insert</p>\n<!-- /wp:paragraph -->';
		const localInsertedBlock =
			'<!-- wp:paragraph -->\n<p>Local insert</p>\n<!-- /wp:paragraph -->';
		const acceptedSyncMeta =
			await createAcceptedBlockIdentitySyncMeta( baseBlocks );
		const descriptor =
			await getDistributedEditingBlockIdentityDistinctGapInsertionDescriptor(
				{
					acceptedSyncMeta,
					serverPostContent: [
						baseBlocks[ 0 ],
						serverInsertedBlock,
						baseBlocks[ 1 ],
					].join( '\n\n' ),
					proposedPostContent: [
						baseBlocks[ 0 ],
						localInsertedBlock,
						baseBlocks[ 1 ],
					].join( '\n\n' ),
				}
			);

		expect( descriptor ).toMatchObject( {
			status: DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES.BLOCKED,
			reason: 'inserted_block_gap_conflict',
			requestProof: null,
			conflictingGapIndex: 1,
			serverInsertedBlockCount: 1,
			proposedInsertedBlockCount: 1,
			contentFree: true,
			callsRest: false,
			callsSave: false,
			mutatesPersistedPostContent: false,
			claimsSaved: false,
		} );
		expect( JSON.stringify( descriptor ) ).not.toMatch(
			/Alpha|Bravo|Server insert|Local insert|postContent|proposedPostContent|rawPostContent|clientId|client_id/
		);
	} );

	it( 'blocks block identity request proof when accepted sync meta uses clientId', async () => {
		const baseBlocks = [
			'<!-- wp:paragraph -->\n<p>Alpha</p>\n<!-- /wp:paragraph -->',
		];
		const acceptedSyncMeta =
			await createAcceptedBlockIdentitySyncMeta( baseBlocks );
		acceptedSyncMeta.blocks[ 0 ].clientId = 'transient-editor-client-id';

		const descriptor =
			await getDistributedEditingBlockIdentityRequestProofDescriptor( {
				acceptedSyncMeta,
				proposedPostContent: baseBlocks.join( '\n\n' ),
			} );

		expect( descriptor ).toMatchObject( {
			status: DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES.BLOCKED,
			reason: 'accepted_sync_meta_invalid',
			invalidDetail: 'block_identity_client_id_rejected',
			requestProof: null,
			contentFree: true,
			usesGutenbergClientId: false,
			exposesRawContent: false,
			callsSave: false,
			mutatesPersistedPostContent: false,
			claimsSaved: false,
		} );
	} );

	it( 'prepares retained block identity proof for same-count block edits', async () => {
		const baseBlocks = [
			'<!-- wp:paragraph -->\n<p>Alpha</p>\n<!-- /wp:paragraph -->',
			'<!-- wp:paragraph -->\n<p>Bravo</p>\n<!-- /wp:paragraph -->',
		];
		const editedBlock =
			'<!-- wp:paragraph -->\n<p><strong>Alpha</strong></p>\n<!-- /wp:paragraph -->';
		const acceptedSyncMeta =
			await createAcceptedBlockIdentitySyncMeta( baseBlocks );
		const descriptor =
			await getDistributedEditingBlockIdentityRequestProofDescriptor( {
				acceptedSyncMeta,
				proposedPostContent: [ editedBlock, baseBlocks[ 1 ] ].join(
					'\n\n'
				),
			} );

		expect( descriptor ).toMatchObject( {
			status: DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES.READY,
			reason: null,
			proposedBlockCount: 2,
			retainedBlockCount: 2,
			insertedBlockCount: 0,
			deletedBlockCount: 0,
			movedBlockCount: 0,
			callsRest: false,
			callsSave: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			claimsSaved: false,
		} );
		expect( descriptor.requestProof ).toMatchObject( {
			client_base_version: '41',
			retained_block_uids: [ 'block-a', 'block-b' ],
			inserted_block_nonces: [],
			deleted_block_uids: [],
			moved_block_uids: [],
		} );
		expect( descriptor.requestProof.proposed_block_map ).toEqual( [
			expect.objectContaining( {
				block_uid: 'block-a',
				block_name: 'core/paragraph',
				ordinal_path: [ 0 ],
			} ),
			expect.objectContaining( {
				block_uid: 'block-b',
				block_name: 'core/paragraph',
				ordinal_path: [ 1 ],
			} ),
		] );
		expect( JSON.stringify( descriptor.requestProof ) ).not.toMatch(
			/Alpha|Bravo|strong|postContent|proposedPostContent|rawPostContent|clientId|client_id/
		);
	} );

	it( 'recognizes content-free retained block edits on different blocks', async () => {
		const baseBlocks = [
			'<!-- wp:paragraph -->\n<p>Alpha</p>\n<!-- /wp:paragraph -->',
			'<!-- wp:paragraph -->\n<p>Bravo</p>\n<!-- /wp:paragraph -->',
		];
		const serverEditedBlock =
			'<!-- wp:paragraph -->\n<p><em>Alpha</em></p>\n<!-- /wp:paragraph -->';
		const localEditedBlock =
			'<!-- wp:paragraph -->\n<p><strong>Bravo</strong></p>\n<!-- /wp:paragraph -->';
		const acceptedSyncMeta =
			await createAcceptedBlockIdentitySyncMeta( baseBlocks );
		const descriptor =
			await getDistributedEditingBlockIdentityRetainedEditsServerMergeDescriptor(
				{
					acceptedSyncMeta,
					serverPostContent: [
						serverEditedBlock,
						baseBlocks[ 1 ],
					].join( '\n\n' ),
					proposedPostContent: [
						baseBlocks[ 0 ],
						localEditedBlock,
					].join( '\n\n' ),
				}
			);

		expect( descriptor ).toMatchObject( {
			status: DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES.READY,
			reason: null,
			requestProof: null,
			acceptedBlockCount: 2,
			serverBlockCount: 2,
			proposedBlockCount: 2,
			serverChangedBlockCount: 1,
			proposedChangedBlockCount: 1,
			serverChangedBlockIndexes: [ 0 ],
			proposedChangedBlockIndexes: [ 1 ],
			conflictingBlockIndex: null,
			contentFree: true,
			callsRest: false,
			callsSave: false,
			mutatesPersistedPostContent: false,
			claimsSaved: false,
		} );
		expect( JSON.stringify( descriptor ) ).not.toMatch(
			/Alpha|Bravo|strong|em|postContent|proposedPostContent|rawPostContent|clientId|client_id/
		);
	} );

	it( 'recognizes content-free table-cell edits in distinct cells on the same retained block', async () => {
		const baseTable =
			'<!-- wp:table --><figure class="wp-block-table"><table><tbody><tr><td>A1</td><td>A2</td></tr><tr><td>B1</td><td>B2</td></tr></tbody></table></figure><!-- /wp:table -->';
		const serverTable =
			'<!-- wp:table --><figure class="wp-block-table"><table><tbody><tr><td>A1 server</td><td>A2</td></tr><tr><td>B1</td><td>B2</td></tr></tbody></table></figure><!-- /wp:table -->';
		const localTable =
			'<!-- wp:table --><figure class="wp-block-table"><table><tbody><tr><td>A1</td><td>A2</td></tr><tr><td>B1</td><td>B2 local</td></tr></tbody></table></figure><!-- /wp:table -->';
		const acceptedSyncMeta = await createAcceptedBlockIdentitySyncMeta( [
			baseTable,
		] );
		acceptedSyncMeta.blocks[ 0 ].block_name = 'core/table';
		const descriptor =
			await getDistributedEditingBlockIdentityRetainedEditsServerMergeDescriptor(
				{
					acceptedSyncMeta,
					acceptedPostContent: baseTable,
					serverPostContent: serverTable,
					proposedPostContent: localTable,
				}
			);

		expect( descriptor ).toMatchObject( {
			status: DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES.READY,
			reason: null,
			requestProof: null,
			acceptedBlockCount: 1,
			serverBlockCount: 1,
			proposedBlockCount: 1,
			serverChangedBlockCount: 1,
			proposedChangedBlockCount: 1,
			serverChangedBlockIndexes: [ 0 ],
			proposedChangedBlockIndexes: [ 0 ],
			conflictingBlockIndex: null,
			tableCellMergedIndexes: [ 0 ],
			tableCellMergedBlockCount: 1,
			tableCellServerChangedCells: [
				{
					blockIndex: 0,
					cellIndex: 0,
					rowIndex: 0,
					columnIndex: 0,
				},
			],
			tableCellLocalChangedCells: [
				{
					blockIndex: 0,
					cellIndex: 3,
					rowIndex: 1,
					columnIndex: 1,
				},
			],
			contentFree: true,
			callsRest: false,
			callsSave: false,
			mutatesPersistedPostContent: false,
			claimsSaved: false,
		} );
		expect( JSON.stringify( descriptor ) ).not.toMatch(
			/A1|A2|B1|B2|postContent|proposedPostContent|rawPostContent|clientId|client_id/
		);
	} );

	it( 'blocks retained block edits on the same block before retry-save handoff', async () => {
		const baseBlocks = [
			'<!-- wp:paragraph -->\n<p>Alpha</p>\n<!-- /wp:paragraph -->',
			'<!-- wp:paragraph -->\n<p>Bravo</p>\n<!-- /wp:paragraph -->',
		];
		const serverEditedBlock =
			'<!-- wp:paragraph -->\n<p><em>Alpha</em></p>\n<!-- /wp:paragraph -->';
		const localEditedBlock =
			'<!-- wp:paragraph -->\n<p><strong>Alpha</strong></p>\n<!-- /wp:paragraph -->';
		const acceptedSyncMeta =
			await createAcceptedBlockIdentitySyncMeta( baseBlocks );
		const descriptor =
			await getDistributedEditingBlockIdentityRetainedEditsServerMergeDescriptor(
				{
					acceptedSyncMeta,
					serverPostContent: [
						serverEditedBlock,
						baseBlocks[ 1 ],
					].join( '\n\n' ),
					proposedPostContent: [
						localEditedBlock,
						baseBlocks[ 1 ],
					].join( '\n\n' ),
				}
			);

		expect( descriptor ).toMatchObject( {
			status: DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES.BLOCKED,
			reason: 'retained_block_edit_conflict',
			requestProof: null,
			conflictingBlockIndex: 0,
			serverChangedBlockCount: 1,
			proposedChangedBlockCount: 1,
			contentFree: true,
			callsRest: false,
			callsSave: false,
			mutatesPersistedPostContent: false,
			claimsSaved: false,
		} );
		expect( JSON.stringify( descriptor ) ).not.toMatch(
			/Alpha|Bravo|strong|em|postContent|proposedPostContent|rawPostContent|clientId|client_id/
		);
	} );

	it( 'blocks ambiguous repeated accepted serialized block hashes', async () => {
		const baseBlocks = [
			'<!-- wp:paragraph -->\n<p>Alpha</p>\n<!-- /wp:paragraph -->',
			'<!-- wp:paragraph -->\n<p>Bravo</p>\n<!-- /wp:paragraph -->',
		];
		const acceptedSyncMeta =
			await createAcceptedBlockIdentitySyncMeta( baseBlocks );
		acceptedSyncMeta.blocks[ 1 ].serialized_hash =
			acceptedSyncMeta.blocks[ 0 ].serialized_hash;

		const descriptor =
			await getDistributedEditingBlockIdentityRequestProofDescriptor( {
				acceptedSyncMeta,
				proposedPostContent: baseBlocks.join( '\n\n' ),
			} );

		expect( descriptor ).toMatchObject( {
			status: DISTRIBUTED_EDITING_BLOCK_IDENTITY_REQUEST_PROOF_STATUSES.BLOCKED,
			reason: 'accepted_repeated_serialized_hash_ambiguous',
			requestProof: null,
			acceptedBlockCount: 2,
			contentFree: true,
			callsRest: false,
			callsSave: false,
			mutatesPersistedPostContent: false,
			claimsSaved: false,
		} );
	} );

	it( 'normalizes rejected fresh-review requests while preserving exportable local state', () => {
		const currentSessionState = normalizeDistributedEditingSessionState( {
			pendingChangeCount: 1,
			localUpdatesImportStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
			localUpdatesImportReason:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			canExportLocalUpdates: true,
		} );
		const sessionState =
			getDistributedEditingSessionStateForFreshReviewRequestResult(
				{
					code: DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
					data: {
						rest_route: 'post_fresh_review_request',
						fresh_review_request_action: 'request_admin_review',
					},
				},
				currentSessionState
			);

		expect( sessionState ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
			reasonCode: DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
			localUpdatesImportReviewRequestStatus:
				DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REJECTED_PERMISSION_DENIED,
			localUpdatesImportReviewRequestReason:
				DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
			localUpdatesImportFreshReviewRequestAccepted: false,
			localUpdatesImportFreshReviewRequestRequested: false,
			localUpdatesImportFreshReviewRequestRestRoute:
				'post_fresh_review_request',
			localUpdatesImportFreshReviewRequestClaimsSaved: false,
			canExportLocalUpdates: true,
			mustOfferLocalCopy: true,
		} );
		expect(
			getDistributedEditingLocalUpdatesImportReviewRequestStateForSessionState(
				sessionState
			)
		).toMatchObject( {
			actionKey: DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW,
			requestAccepted: false,
			requestRequested: false,
			canExportLocalUpdates: true,
			shouldCallRetrySaveEndpoint: false,
			shouldCallNormalSavePost: false,
			mutatesEditorContent: false,
			claimsSaved: false,
		} );
	} );
} );
