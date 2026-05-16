/**
 * External dependencies
 */
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DistributedEditingStatus, {
	DistributedEditingLocalRebaseStateInspector,
	DistributedEditingFreshReviewDecisionPanel,
	DistributedEditingFreshReviewPrePublishPanel,
	DistributedEditingRetrySaveControls,
	DistributedEditingStatusChrome,
	DistributedEditingStatusInspector,
	DistributedEditingRecoveryDryRunControls,
	DistributedEditingStatusTestControls,
	DistributedEditingStatusSurface,
	getDistributedEditingStatusControlStates,
	getDistributedEditingStatusSurfaceItems,
	shouldRenderDistributedEditingStatus,
} from '../';
import PluginPrePublishPanel from '../../plugin-pre-publish-panel';
import {
	DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES,
	DISTRIBUTED_EDITING_DISPOSITIONS,
	DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES,
	DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS,
	DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES,
	DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES,
	DISTRIBUTED_EDITING_NOTICE_ACTIONS,
	DISTRIBUTED_EDITING_NOTICE_KINDS,
	DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES,
	DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES,
	DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES,
	DISTRIBUTED_EDITING_REASON_CODES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS,
	DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES,
	DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES,
	DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES,
	DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS,
	getDistributedEditingLocalUpdatesExportPayload,
	getDistributedEditingSessionStateForPresenceHeartbeatResult,
	getDistributedEditingSessionStateForPresenceSnapshotRefreshResult,
	getDistributedEditingNoticeDescriptorsForSessionState,
	getDistributedEditingUnloadWarningStateForSessionState,
} from '../../../store/distributed-editing';

jest.mock( '@wordpress/data', () => {
	const path = require( 'path' );
	const packageJsonPath = require.resolve( '@wordpress/data/package.json' );
	const actual = jest.requireActual(
		path.join( path.dirname( packageJsonPath ), 'build/index.cjs' )
	);

	return {
		...actual,
		useDispatch: jest.fn(),
		useSelect: jest.fn(),
	};
} );
jest.mock( '../../../store', () => ( {
	store: { name: 'core/editor' },
} ) );

function setupDistributedEditingStatusSelect( {
	currentPost = { id: 1, type: 'post' },
	editedPostContent = '',
	editorSettings = {},
	sessionState = {},
	noticeDescriptors = getDistributedEditingNoticeDescriptorsForSessionState(
		sessionState
	),
	unloadWarningState = getDistributedEditingUnloadWarningStateForSessionState(
		sessionState
	),
} = {} ) {
	useSelect.mockImplementation( ( mapSelect ) =>
		mapSelect( () => ( {
			getCurrentPost: () => currentPost,
			getDistributedEditingSessionState: () => sessionState,
			getDistributedEditingNoticeDescriptors: () => noticeDescriptors,
			getDistributedEditingUnloadWarningState: () => unloadWarningState,
			getEditedPostContent: () => editedPostContent,
			getEditorSettings: () => editorSettings,
		} ) )
	);
}

function setupDistributedEditingStatusDispatch() {
	const actions = {
		__experimentalRefreshDistributedEditingRecoveryDryRun: jest
			.fn()
			.mockResolvedValue( {
				result: 'candidate_update_valid',
			} ),
		__experimentalRefreshDistributedEditingPresenceSnapshot: jest
			.fn()
			.mockResolvedValue( {
				result: 'presence_roster_snapshot',
			} ),
		__experimentalRefreshDistributedEditingPresenceStorageReadiness: jest
			.fn()
			.mockResolvedValue( {
				result: 'presence_storage_ready',
				status: 'ready',
				tableExists: true,
				schemaCurrent: true,
				expectedStartupHeartbeatStatus: 'sent',
				setupRequired: false,
				setupAction: 'call_wp_de_rtc_install_presence_table',
				diagnosticOnly: true,
				contentFree: true,
				installsPresenceTable: false,
				automaticPerRequestInstall: false,
				writesPresence: false,
				recordsPresenceHeartbeat: false,
				startsPolling: false,
				callsSave: false,
				mutatesPostContent: false,
				mutatesPersistedPostContent: false,
				createsRevision: false,
				changesPostLock: false,
				claimsAbsence: false,
				claimsSaved: false,
				exposesRawContent: false,
				exposesUserIds: false,
				exposesCursorOffset: false,
				exposesSelection: false,
				correctnessIndependentOfTransport: true,
				transportRequiredForCorrectness: false,
			} ),
		__experimentalSendDistributedEditingPresenceHeartbeat: jest
			.fn()
			.mockResolvedValue( {
				result: 'presence_heartbeat_recorded',
			} ),
		__experimentalSaveDistributedEditingRetryAfterProof: jest
			.fn()
			.mockResolvedValue( {
				result: 'retry_save_applied',
			} ),
		__experimentalPlanDistributedEditingLocalRebaseAfterStaleBase: jest
			.fn()
			.mockResolvedValue( {
				status: 'ready',
			} ),
		__experimentalPrepareDistributedEditingRetrySubmitAfterLocalRebase: jest
			.fn()
			.mockResolvedValue( {
				status: 'prepared',
			} ),
		__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof: jest
			.fn()
			.mockResolvedValue( {
				status: 'ready',
			} ),
		__experimentalRequestDistributedEditingFreshReviewForImportedLocalUpdates:
			jest.fn().mockResolvedValue( {
				status: DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
				result: 'fresh_review_request_accepted_for_admin_review',
				accepted: true,
				requested: true,
			} ),
		__experimentalResolveDistributedEditingFreshReviewDecisionItem: jest
			.fn()
			.mockResolvedValue( {
				status: 'fresh_review_decision_item_resolved',
				reviewStatus: 'approved_for_retry_save',
				decisionReady: false,
			} ),
		__experimentalSubmitDistributedEditingFreshReviewDecision: jest
			.fn()
			.mockResolvedValue( {
				status: 'recorded',
				result: 'fresh_review_decision_approved_for_retry_save',
				accepted: true,
			} ),
		__experimentalRefreshDistributedEditingRetrySubmitProof: jest
			.fn()
			.mockResolvedValue( {
				result: 'retry_submit_accepted_for_future_save',
			} ),
		__experimentalRebaseDistributedEditingLocalUpdatesAfterStaleBase: jest
			.fn()
			.mockResolvedValue( {
				status: 'rebased',
			} ),
		__experimentalRefreshDistributedEditingServerStateAfterStaleBase: jest
			.fn()
			.mockResolvedValue( {
				result: 'server_state_refetched',
			} ),
		__experimentalImportDistributedEditingLocalUpdates: jest
			.fn()
			.mockResolvedValue( {
				status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.IMPORTED_FOR_RETRY_SAVE,
			} ),
		editPost: jest.fn(),
		resetDistributedEditingSessionState: jest.fn(),
		setDistributedEditingSessionState: jest.fn(),
	};

	useDispatch.mockReturnValue( actions );

	return actions;
}

afterEach( () => {
	if (
		Object.prototype.hasOwnProperty.call(
			globalThis.navigator,
			'clipboard'
		)
	) {
		delete globalThis.navigator.clipboard;
	}

	useDispatch.mockReset();
	useSelect.mockReset();
} );

function expectClipboardExportPayload(
	writeText,
	{ currentPost, editedPostContent, sessionState }
) {
	const payload = JSON.parse( writeText.mock.calls[ 0 ][ 0 ] );

	expect( payload ).toEqual(
		getDistributedEditingLocalUpdatesExportPayload( {
			currentPost,
			editedPostContent,
			sessionState,
		} )
	);
	expect( payload ).toMatchObject( {
		version: 1,
		format: 'wp/de-rtc-local-updates',
		post: {
			id: currentPost.id,
			type: currentPost.type,
		},
		postContent: editedPostContent,
		pendingChangeCount: sessionState.pendingChangeCount,
		saveAuthority: {
			state: expect.any( String ),
			saveButtonStatus: expect.any( String ),
			pendingServerConfirmation: expect.any( Boolean ),
			authoritativePostUpdated: expect.any( Boolean ),
		},
	} );
	expect( payload ).toHaveProperty( 'acceptedReviewApprovalProof' );
	expect( payload ).not.toHaveProperty( 'distributedEditingSessionState' );
	expect( JSON.stringify( payload.saveAuthority ) ).not.toContain(
		editedPostContent
	);

	return payload;
}

describe( 'getDistributedEditingStatusControlStates', () => {
	it( 'returns copyable representative internal control states', () => {
		const states = getDistributedEditingStatusControlStates();
		const nextStates = getDistributedEditingStatusControlStates();

		expect( Object.keys( states ) ).toEqual( [
			'idle',
			'pendingLocalChanges',
			'degradedConnection',
			'remoteChanges',
			'serverStateConflict',
			'staleBaseRejected',
			'staleBaseRebaseReady',
			'staleBaseRebaseMissingInputs',
			'staleBaseRebased',
			'staleBaseRebaseConflict',
			'staleBaseRebaseBlockInserted',
			'staleBaseRebaseBlockReordered',
			'staleBaseRebaseFreeformHtml',
			'staleBaseRetryPrepared',
			'staleBaseRetryProofAccepted',
			'staleBaseRetryProofStale',
			'staleBaseRetrySaveReady',
			'staleBaseRetrySaveBlockedPermission',
			'staleBaseRetrySaveSaving',
			'staleBaseRetrySaveSaved',
			'staleBaseRetrySaveStale',
			'staleBaseRetrySaveTampered',
			'staleBaseRetrySaveUnfilteredHtml',
			'staleBaseRetrySaveHandoffBlockedProof',
			'staleBaseRetrySaveHandoffRefetch',
			'staleBaseRetrySaveHandoffMissingRoute',
			'staleBaseRetrySaveHandoffMissingContent',
			'staleBaseRetrySaveHandoffInProgress',
			'manualResolution',
		] );
		expect( states.pendingLocalChanges ).toEqual( {
			pendingChangeCount: 2,
		} );
		expect( states.pendingLocalChanges ).not.toBe(
			nextStates.pendingLocalChanges
		);
		expect( states.degradedConnection ).toEqual( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.ACCEPTED_WITH_DEGRADED_LIVE_FEEDBACK,
			isConnectionDegraded: true,
		} );
		expect( states.serverStateConflict ).toEqual( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.CONFLICT_REQUIRES_SERVER_STATE_ACCEPTANCE,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_RESTORED_FROM_REVISION_CONFLICT,
			pendingChangeCount: 1,
		} );
		expect( states.staleBaseRejected ).toEqual( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
			pendingChangeCount: 1,
			remoteChangeCount: 1,
		} );
		expect( states.staleBaseRebaseReady ).toEqual( {
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
			clientBaseContent: '',
			refetchedServerContent: '',
		} );
		expect( states.staleBaseRebased ).toMatchObject( {
			localRebasePlanStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
			localRebaseResultStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
			readyToRetrySubmit: true,
			clientBaseContent: '',
			refetchedServerContent: '',
		} );
		expect( states.staleBaseRebaseBlockInserted ).toMatchObject( {
			localRebaseResultStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
			localRebaseResultReason: 'block_inserted',
			requiresManualConflictResolution: true,
		} );
		expect( states.staleBaseRebaseFreeformHtml ).toMatchObject( {
			localRebaseResultStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.UNSAFE_CONTENT_BOUNDARY,
			localRebaseResultReason: 'freeform_html',
			requiresManualConflictResolution: true,
		} );
		expect( states.staleBaseRetryPrepared ).toMatchObject( {
			localRebaseResultStatus:
				DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
			retrySubmitHandoffStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
			retrySubmitPrepared: true,
		} );
		expect( states.staleBaseRetryProofAccepted ).toMatchObject( {
			pendingChangeCount: 1,
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
			retrySubmitAccepted: true,
			retrySubmitSavePathRequired: true,
			canExportLocalUpdates: true,
		} );
		expect( states.staleBaseRetryProofStale ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.STALE_BASE_REJECTED,
			retrySubmitProofReason:
				DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
			requiresServerStateRefetch: true,
			canExportLocalUpdates: true,
		} );
		expect( states.staleBaseRetrySaveReady ).toMatchObject( {
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
			retrySubmitSaveStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
			retrySubmitSavePrepared: true,
			retrySubmitSaveReady: true,
			canExportLocalUpdates: true,
		} );
		expect( states.staleBaseRetrySaveBlockedPermission ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
			retrySubmitProofStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.REJECTED_PERMISSION_DENIED,
			retrySubmitSaveStatus:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.BLOCKED,
			retrySubmitSaveReason:
				DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS.PERMISSION_DENIED,
			canExportLocalUpdates: true,
		} );
		expect( states.staleBaseRetrySaveSaving ).toMatchObject( {
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
			pendingChangeCount: 1,
			canExportLocalUpdates: true,
		} );
		expect( states.staleBaseRetrySaveSaved ).toMatchObject( {
			retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
			retrySaveAccepted: true,
			retrySaveClaimsSaved: true,
			retrySaveCreatedRevisionIds: [ 7002 ],
		} );
		expect( states.staleBaseRetrySaveStale ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
			retrySaveStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED,
			requiresServerStateRefetch: true,
			canExportLocalUpdates: true,
		} );
		expect( states.staleBaseRetrySaveTampered ).toMatchObject( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_SYNC_META_TAMPERED,
			retrySaveStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED,
			canExportLocalUpdates: true,
		} );
		expect( states.staleBaseRetrySaveHandoffBlockedProof ).toMatchObject( {
			retrySaveHandoffStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
			retrySaveHandoffReason:
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_PROOF_NOT_ACCEPTED,
			retrySaveHandoffBlocksNormalSave: true,
			canExportLocalUpdates: true,
		} );
		expect( states.staleBaseRetrySaveHandoffRefetch ).toMatchObject( {
			requiresServerStateRefetch: true,
			retrySaveHandoffStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
			retrySaveHandoffReason:
				DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
			canExportLocalUpdates: true,
		} );
		expect( states.manualResolution ).toEqual( {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REQUIRES_MANUAL_RESOLUTION_NO_SYNC_META,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_UNAVAILABLE_AFTER_REVISION_SCAN,
			canExportLocalUpdates: true,
		} );
	} );
} );

describe( 'DistributedEditingStatusTestControls', () => {
	it( 'sets representative non-idle session state without transport', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		const onSelect = jest.fn();

		render(
			<DistributedEditingStatusTestControls onSelect={ onSelect } />
		);

		await user.click(
			screen.getByRole( 'button', {
				name: 'Pending local changes',
			} )
		);

		expect(
			actions.setDistributedEditingSessionState
		).toHaveBeenCalledWith( {
			pendingChangeCount: 2,
		} );
		expect(
			actions.resetDistributedEditingSessionState
		).not.toHaveBeenCalled();
		expect( onSelect ).toHaveBeenCalledWith( 'pendingLocalChanges', {
			pendingChangeCount: 2,
		} );
	} );

	it( 'resets representative idle state without transport', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		const onSelect = jest.fn();

		render(
			<DistributedEditingStatusTestControls onSelect={ onSelect } />
		);

		await user.click(
			screen.getByRole( 'button', {
				name: 'Idle',
			} )
		);

		expect(
			actions.resetDistributedEditingSessionState
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.setDistributedEditingSessionState
		).not.toHaveBeenCalled();
		expect( onSelect ).toHaveBeenCalledWith( 'idle', {} );
	} );
} );

describe( 'DistributedEditingStatusInspector', () => {
	it( 'renders internal controls with the selector-backed status surface', () => {
		setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			sessionState: {
				remoteChangeCount: 1,
			},
		} );

		render( <DistributedEditingStatusInspector /> );

		expect(
			screen.getByRole( 'group', {
				name: 'Distributed editing status inspection',
			} )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', {
				name: 'Pending local changes',
			} )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', {
				name: 'Run recovery dry run',
			} )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', {
				name: 'Run guarded retry save',
			} )
		).toBeVisible();
		expect( screen.getByText( 'Local rebase plan' ) ).toBeVisible();
		expect( screen.getByText( 'Local rebase result' ) ).toBeVisible();
		expect(
			screen.getByRole( 'region', {
				name: 'Distributed editing status',
			} )
		).toBeVisible();
		expect(
			screen.getByRole( 'region', {
				name: 'Distributed editing status',
			} )
		).toHaveAttribute(
			'data-distributed-editing-placement',
			'internal-inspector'
		);
		expect( screen.getByText( 'Remote changes received' ) ).toBeVisible();
	} );
} );

describe( 'DistributedEditingLocalRebaseStateInspector', () => {
	it( 'exposes local rebase status and input readiness without raw content', () => {
		setupDistributedEditingStatusSelect( {
			sessionState: {
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base</p><!-- /wp:paragraph -->',
				refetchedServerContent:
					'<!-- wp:paragraph --><p>Server</p><!-- /wp:paragraph -->',
				readyToRetrySubmit: true,
			},
		} );

		render( <DistributedEditingLocalRebaseStateInspector /> );

		expect( screen.getByText( 'Local rebase plan' ) ).toBeVisible();
		expect( screen.getAllByText( 'ready' ) ).toHaveLength( 2 );
		expect( screen.getByText( 'Local rebase result' ) ).toBeVisible();
		expect( screen.getByText( 'rebased' ) ).toBeVisible();
		expect( screen.getByText( 'Local rebase reason' ) ).toBeVisible();
		expect( screen.getAllByText( 'None' ) ).toHaveLength( 3 );
		expect( screen.getByText( 'Client base input' ) ).toBeVisible();
		expect( screen.getByText( 'Refetched server input' ) ).toBeVisible();
		expect( screen.getAllByText( 'Available' ) ).toHaveLength( 2 );
		expect( screen.getByText( 'Retry submit' ) ).toBeVisible();
		expect( screen.getByText( 'Ready' ) ).toBeVisible();
		expect( screen.getByText( 'Retry handoff' ) ).toBeVisible();
		expect( screen.getByText( 'Retry proof' ) ).toBeVisible();
		expect( screen.getByText( 'Retry accepted' ) ).toBeVisible();
		expect( screen.getByText( 'Retry save' ) ).toBeVisible();
		expect( screen.getByText( 'Retry save reason' ) ).toBeVisible();
		expect( screen.getByText( 'Guarded retry save' ) ).toBeVisible();
		expect( screen.getByText( 'Guarded retry save reason' ) ).toBeVisible();
		expect( screen.queryByText( /wp:paragraph/ ) ).not.toBeInTheDocument();
	} );

	it( 'marks missing local rebase inputs in the internal inspector', () => {
		setupDistributedEditingStatusSelect( {
			sessionState: {
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
				refetchedServerContent: '',
			},
		} );

		render( <DistributedEditingLocalRebaseStateInspector /> );

		expect( screen.getByText( 'ready' ) ).toBeVisible();
		expect( screen.getAllByText( 'none' ) ).toHaveLength( 5 );
		expect( screen.getByText( 'Missing' ) ).toBeVisible();
		expect( screen.getByText( 'Available' ) ).toBeVisible();
		expect( screen.getByText( 'Not ready' ) ).toBeVisible();
	} );
} );

describe( 'DistributedEditingRecoveryDryRunControls', () => {
	it( 'runs the dry-run action and records command success', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		const onResult = jest.fn();
		setupDistributedEditingStatusSelect();

		render(
			<DistributedEditingRecoveryDryRunControls onResult={ onResult } />
		);

		expect( screen.getByText( 'Command' ) ).toBeVisible();
		expect( screen.getByText( 'Disposition' ) ).toBeVisible();
		expect( screen.getByText( 'Reason' ) ).toBeVisible();
		expect( screen.getByText( 'Idle' ) ).toBeVisible();
		expect( screen.getByText( 'idle' ) ).toBeVisible();
		expect( screen.getByText( 'None' ) ).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Run recovery dry run',
			} )
		);

		expect(
			actions.__experimentalRefreshDistributedEditingRecoveryDryRun
		).toHaveBeenCalledTimes( 1 );
		await waitFor( () =>
			expect( screen.getByText( 'Succeeded' ) ).toBeVisible()
		);
		expect( onResult ).toHaveBeenCalledWith( {
			result: 'candidate_update_valid',
		} );
	} );

	it( 'records command failure without swallowing the normalized state display', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		const error = { code: 'rest_cannot_edit' };
		const onError = jest.fn();
		actions.__experimentalRefreshDistributedEditingRecoveryDryRun.mockRejectedValue(
			error
		);
		setupDistributedEditingStatusSelect( {
			sessionState: {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
				reasonCode: DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
			},
		} );

		render(
			<DistributedEditingRecoveryDryRunControls onError={ onError } />
		);

		expect(
			screen.getByText( 'rejected_permission_denied' )
		).toBeVisible();
		expect( screen.getByText( 'rest_cannot_edit' ) ).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Run recovery dry run',
			} )
		);

		await waitFor( () =>
			expect( screen.getByText( 'Failed' ) ).toBeVisible()
		);
		expect( onError ).toHaveBeenCalledWith( error );
	} );
} );

describe( 'DistributedEditingRetrySaveControls', () => {
	it( 'runs the guarded retry-save action and records command success', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		const onResult = jest.fn();
		setupDistributedEditingStatusSelect();

		render( <DistributedEditingRetrySaveControls onResult={ onResult } /> );

		expect( screen.getByText( 'Command' ) ).toBeVisible();
		expect( screen.getByText( 'Guarded retry save' ) ).toBeVisible();
		expect( screen.getByText( 'Guarded retry save reason' ) ).toBeVisible();
		expect( screen.getByText( 'Idle' ) ).toBeVisible();
		expect( screen.getByText( 'none' ) ).toBeVisible();
		expect( screen.getByText( 'None' ) ).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Run guarded retry save',
			} )
		);

		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).toHaveBeenCalledTimes( 1 );
		await waitFor( () =>
			expect( screen.getByText( 'Succeeded' ) ).toBeVisible()
		);
		expect( onResult ).toHaveBeenCalledWith( {
			result: 'retry_save_applied',
		} );
	} );

	it( 'records command failure while preserving normalized retry-save state', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		const error = { code: 'de_rtc_sync_meta_tampered' };
		const onError = jest.fn();
		actions.__experimentalSaveDistributedEditingRetryAfterProof.mockRejectedValue(
			error
		);
		setupDistributedEditingStatusSelect( {
			sessionState: {
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED,
				retrySaveReason:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
			},
		} );

		render( <DistributedEditingRetrySaveControls onError={ onError } /> );

		expect(
			screen.getByText( 'rejected_sync_meta_tampered' )
		).toBeVisible();
		expect( screen.getByText( 'de_rtc_sync_meta_tampered' ) ).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Run guarded retry save',
			} )
		);

		await waitFor( () =>
			expect( screen.getByText( 'Failed' ) ).toBeVisible()
		);
		expect( onError ).toHaveBeenCalledWith( error );
	} );
} );

describe( 'shouldRenderDistributedEditingStatus', () => {
	it( 'does not render for idle internal state', () => {
		expect( shouldRenderDistributedEditingStatus() ).toBe( false );
	} );

	it( 'renders for non-idle, pending, remote, and unload-warning states', () => {
		expect(
			shouldRenderDistributedEditingStatus( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.ACCEPTED_WITH_DEGRADED_LIVE_FEEDBACK,
			} )
		).toBe( true );
		expect(
			shouldRenderDistributedEditingStatus( {
				pendingChangeCount: 1,
			} )
		).toBe( true );
		expect(
			shouldRenderDistributedEditingStatus( {
				remoteChangeCount: 1,
			} )
		).toBe( true );
		expect(
			shouldRenderDistributedEditingStatus( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.CONFLICT_REQUIRES_SERVER_STATE_ACCEPTANCE,
			} )
		).toBe( true );
		expect(
			shouldRenderDistributedEditingStatus( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
			} )
		).toBe( true );
		expect(
			shouldRenderDistributedEditingStatus( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REQUIRES_MANUAL_RESOLUTION_NO_SYNC_META,
			} )
		).toBe( true );
		expect(
			shouldRenderDistributedEditingStatus( {
				retrySaveHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
			} )
		).toBe( true );
		expect(
			shouldRenderDistributedEditingStatus( {
				localUpdatesImportStatus:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
				localUpdatesImportReason:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			} )
		).toBe( true );
		expect(
			shouldRenderDistributedEditingStatus( {
				actionTranscriptItems: [
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_EDITOR_ACTION,
					},
				],
			} )
		).toBe( true );
		expect(
			shouldRenderDistributedEditingStatus( {}, { shouldWarn: true } )
		).toBe( true );
	} );
} );

describe( 'DistributedEditingStatus', () => {
	it( 'does not mount the status surface for an idle session', () => {
		setupDistributedEditingStatusSelect();

		const { container } = render( <DistributedEditingStatus /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'mounts the status surface for pending local changes', () => {
		setupDistributedEditingStatusSelect( {
			sessionState: {
				pendingChangeCount: 1,
			},
		} );

		render( <DistributedEditingStatus /> );

		expect(
			screen.getByRole( 'region', {
				name: 'Distributed editing status',
			} )
		).toBeVisible();
		expect( screen.getByText( 'Changes pending' ) ).toBeVisible();
		expect(
			screen.getByText( '1 local change is awaiting confirmation.' )
		).toBeVisible();
	} );

	it( 'renders a read-only same-block conflict comparison from safe text excerpts', () => {
		setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editedPostContent:
				'<!-- wp:paragraph --><p>Local paragraph edit &amp; draft.</p><!-- /wp:paragraph -->',
			sessionState: {
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
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				localRebaseResultReason: 'same_block_changed',
				requiresManualConflictResolution: true,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base paragraph edit &amp; seed.</p><!-- /wp:paragraph -->',
				refetchedServerContent:
					'<!-- wp:paragraph --><p>Server paragraph edit &amp; update.</p><!-- /wp:paragraph -->',
			},
		} );

		render( <DistributedEditingStatus /> );

		const status = screen.getByRole( 'region', {
			name: 'Distributed editing status',
		} );
		const comparison = screen.getByRole( 'region', {
			name: 'Distributed editing conflict comparison',
		} );

		expect(
			screen.getByText( 'Conflicting update not saved' )
		).toBeVisible();
		expect(
			screen.getByText(
				'WordPress did not save the conflicting update. Your local changes are protected in this editor. Compare the local and WordPress versions below, then choose which one to keep.'
			)
		).toBeVisible();
		expect( screen.getByText( 'Compare changes' ) ).toBeVisible();
		expect(
			screen.getByText(
				'This editor and WordPress changed the same block. Choose the local version or the latest WordPress version before trying Save again.'
			)
		).toBeVisible();
		expect( screen.getByText( 'Choose a version to keep' ) ).toBeVisible();
		expect(
			screen.getByText(
				'WordPress is waiting because this editor and the saved post changed the same block. Choosing here does not save yet.'
			)
		).toBeVisible();
		expect( screen.getByText( 'Choose version' ) ).toBeVisible();
		expect( screen.getByText( 'Check choice' ) ).toBeVisible();
		expect( screen.getByText( 'Prepare Save' ) ).toBeVisible();
		expect( screen.getByText( 'Use Save' ) ).toBeVisible();
		expect( screen.getByText( 'Choose version' ) ).toHaveAttribute(
			'aria-current',
			'step'
		);
		expect( screen.getByText( 'Choose version' ) ).toHaveAttribute(
			'aria-label',
			'Choose version, current step'
		);
		expect( screen.getByText( 'Choose version' ) ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-step-status',
			'current'
		);
		expect( screen.getByText( 'Check choice' ) ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-step-status',
			'upcoming'
		);
		expect(
			within( status ).getByRole( 'button', {
				name: 'Get latest post',
			} )
		).toBeVisible();
		expect(
			within( status ).getByRole( 'button', {
				name: 'Export local changes',
			} )
		).toBeVisible();
		expect(
			screen.queryByText( /Review changes tracks remote activity/ )
		).not.toBeInTheDocument();
		expect( screen.queryByText( /Save now:/ ) ).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Saved by WordPress' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'WordPress confirmed Save.' )
		).not.toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-node-access
		const actionGroups = comparison.querySelectorAll(
			'.editor-distributed-editing-status__conflict-comparison-action-group'
		);
		expect( actionGroups ).toHaveLength( 2 );
		const keepLocalButton = within( actionGroups[ 0 ] ).getByRole(
			'button',
			{
				name: 'Keep your local version',
			}
		);
		const useLatestButton = within( actionGroups[ 0 ] ).getByRole(
			'button',
			{
				name: 'Use latest from WordPress',
			}
		);
		expect( keepLocalButton ).toBeVisible();
		expect( keepLocalButton ).toHaveAttribute(
			'data-distributed-editing-conflict-choice-selection-does-not-save',
			'true'
		);
		expect( keepLocalButton ).toHaveAttribute(
			'title',
			'Select your local version. This does not save until WordPress checks the choice and Save confirms.'
		);
		expect( useLatestButton ).toBeVisible();
		expect( useLatestButton ).toHaveAttribute(
			'data-distributed-editing-conflict-choice-selection-does-not-save',
			'true'
		);
		expect( useLatestButton ).toHaveAttribute(
			'title',
			'Select the latest WordPress version. This does not save until WordPress checks the choice and Save confirms.'
		);
		expect(
			within( actionGroups[ 1 ] ).getByRole( 'button', {
				name: 'Export for review',
			} )
		).toBeVisible();
		expect(
			within( actionGroups[ 1 ] ).getByRole( 'button', {
				name: 'Get latest post',
			} )
		).toBeVisible();
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison',
			'same-block'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-read-only',
			'true'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-calls-rest',
			'false'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-calls-save',
			'false'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-mutates-editor-content',
			'false'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-has-base',
			'true'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-has-server',
			'true'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-has-local',
			'true'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-header-mode',
			'compare_versions'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-guide-steps-visible',
			'true'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-guide-visible',
			'true'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-choice-control-mode',
			'choose_between_versions'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-prepared-compact',
			'false'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-visible-choice-count',
			'2'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-actions-layout',
			'standard_grouped'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-support-actions-mode',
			'standard_recovery'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-visible-row-count',
			'3'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-guide-status',
			'choose_version'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-prepare-save-ready',
			'false'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-save-prepared',
			'false'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-save-ready',
			'false'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-next-step',
			'choose_conflict_version'
		);
		expect( screen.queryByText( 'Selected' ) ).not.toBeInTheDocument();
		expect( screen.getByLabelText( 'Base version' ) ).toHaveValue(
			'Base paragraph edit & seed.'
		);
		expect( screen.getByLabelText( 'Latest from WordPress' ) ).toHaveValue(
			'Server paragraph edit & update.'
		);
		expect( screen.getByLabelText( 'Your local version' ) ).toHaveValue(
			'Local paragraph edit & draft.'
		);
		expect( comparison ).not.toHaveTextContent( '<p>' );
		expect( comparison ).not.toHaveTextContent( '<!-- wp:paragraph' );
		expect(
			within( comparison ).getByRole( 'button', {
				name: 'Keep your local version',
			} )
		).toHaveAttribute( 'aria-pressed', 'false' );
		expect(
			within( comparison ).getByRole( 'button', {
				name: 'Use latest from WordPress',
			} )
		).toHaveAttribute( 'aria-pressed', 'false' );
		expect(
			within( comparison ).getByRole( 'button', {
				name: 'Keep your local version',
			} )
		).toBeVisible();
		expect(
			within( comparison ).getByRole( 'button', {
				name: 'Use latest from WordPress',
			} )
		).toBeVisible();
		expect(
			within( comparison ).getByRole( 'button', {
				name: 'Export for review',
			} )
		).toHaveAttribute(
			'data-distributed-editing-conflict-support-action-emphasis',
			'standard_recovery'
		);
		expect(
			within( comparison ).getByRole( 'button', {
				name: 'Get latest post',
			} )
		).toHaveAttribute(
			'data-distributed-editing-conflict-support-action-emphasis',
			'standard_recovery'
		);
	} );

	it( 'keeps same-block conflict actions explicit without saving by default', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		const writeText = jest.fn().mockResolvedValue();

		Object.defineProperty( globalThis.navigator, 'clipboard', {
			configurable: true,
			value: { writeText },
		} );

		setupDistributedEditingStatusSelect( {
			currentPost: { id: 42, type: 'post' },
			editedPostContent:
				'<!-- wp:paragraph --><p>Local same block change.</p><!-- /wp:paragraph -->',
			sessionState: {
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
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				localRebaseResultReason: 'same_block_changed',
				requiresManualConflictResolution: true,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base same block change.</p><!-- /wp:paragraph -->',
				refetchedServerContent:
					'<!-- wp:paragraph --><p>Server same block change.</p><!-- /wp:paragraph -->',
			},
		} );

		render( <DistributedEditingStatus /> );

		const comparison = screen.getByRole( 'region', {
			name: 'Distributed editing conflict comparison',
		} );

		await user.click(
			within( comparison ).getByRole( 'button', {
				name: 'Keep your local version',
			} )
		);

		expect(
			screen.getByText(
				'Keeping your local text in this editor. Save is still paused until WordPress checks this choice again.'
			)
		).toBeVisible();
		expect( actions.editPost ).not.toHaveBeenCalled();
		expect(
			actions.setDistributedEditingSessionState
		).toHaveBeenCalledWith(
			expect.objectContaining( {
				requiresManualConflictResolution: true,
				readyToRetrySubmit: false,
				retrySubmitHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.NONE,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.NONE,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
				staleBaseConflictResolutionStatus:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LOCAL_VERSION_SELECTED,
				staleBaseConflictResolutionChoice:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL,
				staleBaseConflictResolutionRequiresFreshProof: true,
				staleBaseConflictResolutionCallsRest: false,
				staleBaseConflictResolutionCallsSave: false,
				staleBaseConflictResolutionMutatesEditorContent: false,
				staleBaseConflictResolutionMutatesPersistedPostContent: false,
				staleBaseConflictResolutionCreatesRevision: false,
				staleBaseConflictResolutionChangesPostLock: false,
				staleBaseConflictResolutionClaimsSaved: false,
			} )
		);
		expect( writeText ).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();

		await user.click(
			within( comparison ).getByRole( 'button', {
				name: 'Export for review',
			} )
		);

		await waitFor( () => expect( writeText ).toHaveBeenCalledTimes( 1 ) );
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();

		await user.click(
			within( comparison ).getByRole( 'button', {
				name: 'Get latest post',
			} )
		);

		await waitFor( () =>
			expect(
				actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
			).toHaveBeenCalledTimes( 1 )
		);
	} );

	it( 'can choose the latest WordPress text for the local working copy without saving', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		const latestWordPressContent =
			'<!-- wp:paragraph --><p>Server same block choice.</p><!-- /wp:paragraph -->';

		setupDistributedEditingStatusSelect( {
			currentPost: { id: 42, type: 'post' },
			editedPostContent:
				'<!-- wp:paragraph --><p>Local same block choice.</p><!-- /wp:paragraph -->',
			sessionState: {
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
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				localRebaseResultReason: 'same_block_changed',
				requiresManualConflictResolution: true,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base same block choice.</p><!-- /wp:paragraph -->',
				refetchedServerContent: latestWordPressContent,
			},
		} );

		render( <DistributedEditingStatus /> );

		const comparison = screen.getByRole( 'region', {
			name: 'Distributed editing conflict comparison',
		} );

		await user.click(
			within( comparison ).getByRole( 'button', {
				name: 'Use latest from WordPress',
			} )
		);

		expect( actions.editPost ).toHaveBeenCalledWith(
			{ content: latestWordPressContent },
			{ undoIgnore: true }
		);
		expect(
			actions.setDistributedEditingSessionState
		).toHaveBeenCalledWith(
			expect.objectContaining( {
				requiresManualConflictResolution: true,
				readyToRetrySubmit: false,
				retrySubmitHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.NONE,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.NONE,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
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
			} )
		);
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			screen.getByText(
				'Using the latest WordPress text in this editor. Save is still paused until WordPress checks this choice again.'
			)
		).toBeVisible();
	} );

	it( 'requests fresh proof for a selected same-block conflict choice without saving', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			currentPost: { id: 42, type: 'post' },
			editedPostContent:
				'<!-- wp:paragraph --><p>Local same block proof choice.</p><!-- /wp:paragraph -->',
			sessionState: {
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
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				localRebaseResultReason: 'same_block_changed',
				requiresManualConflictResolution: true,
				staleBaseConflictResolutionStatus:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LOCAL_VERSION_SELECTED,
				staleBaseConflictResolutionChoice:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL,
				staleBaseConflictResolutionRequiresFreshProof: true,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base same block proof choice.</p><!-- /wp:paragraph -->',
				refetchedServerContent:
					'<!-- wp:paragraph --><p>Server same block proof choice.</p><!-- /wp:paragraph -->',
			},
		} );

		render( <DistributedEditingStatus /> );

		const comparison = screen.getByRole( 'region', {
			name: 'Distributed editing conflict comparison',
		} );

		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-proof-action',
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFRESH_RETRY_SUBMIT_PROOF
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-proof-ready',
			'true'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-guide-status',
			'local_version_selected'
		);
		expect(
			screen.getByText( 'Your local version is selected' )
		).toBeVisible();
		expect(
			screen.getByText(
				'Check this choice with WordPress before using Save. The WordPress post has not changed yet.'
			)
		).toBeVisible();
		expect( screen.getByText( 'Prepare Save' ) ).toBeVisible();
		expect( screen.getByText( 'Use Save' ) ).toBeVisible();
		expect( screen.getByText( 'Choose version' ) ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-step-status',
			'complete'
		);
		expect( screen.getByText( 'Choose version' ) ).toHaveAttribute(
			'aria-label',
			'Choose version, complete'
		);
		expect( screen.getByText( 'Check choice' ) ).toHaveAttribute(
			'aria-current',
			'step'
		);
		expect( screen.getByText( 'Check choice' ) ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-step-status',
			'current'
		);
		expect(
			within( comparison ).getByRole( 'button', {
				name: 'Keep your local version',
			} )
		).toHaveAttribute( 'aria-pressed', 'true' );
		expect(
			within( comparison ).getByRole( 'button', {
				name: 'Use latest from WordPress',
			} )
		).toHaveAttribute( 'aria-pressed', 'false' );
		expect( screen.getByText( 'Selected' ) ).toBeVisible();
		const checkChoiceButton = within( comparison ).getByRole( 'button', {
			name: 'Check this choice',
		} );
		expect( checkChoiceButton ).toBeVisible();
		expect( checkChoiceButton ).toHaveAttribute(
			'data-distributed-editing-conflict-action',
			'check_choice'
		);
		expect( checkChoiceButton ).toHaveAttribute(
			'data-distributed-editing-conflict-action-does-not-save',
			'true'
		);
		expect( checkChoiceButton ).toHaveAttribute(
			'title',
			'Ask WordPress to check this choice. This does not save the post.'
		);

		await user.click( checkChoiceButton );

		expect(
			actions.__experimentalRefreshDistributedEditingRetrySubmitProof
		).toHaveBeenCalledTimes( 1 );
		expect( actions.editPost ).not.toHaveBeenCalled();
		expect(
			actions.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			await screen.findByText(
				'WordPress checked this choice. Prepare Save before updating the post.'
			)
		).toBeVisible();
	} );

	it( 'prepares Save from a checked same-block conflict choice without saving', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			currentPost: { id: 42, type: 'post' },
			editedPostContent:
				'<!-- wp:paragraph --><p>Local checked conflict choice.</p><!-- /wp:paragraph -->',
			sessionState: {
				disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
				reasonCode: null,
				pendingChangeCount: 1,
				remoteChangeCount: 0,
				requiresServerStateRefetch: false,
				refetchedServerState: true,
				canExportLocalUpdates: true,
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				localRebaseResultReason: 'same_block_changed',
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
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base checked conflict choice.</p><!-- /wp:paragraph -->',
				refetchedServerContent:
					'<!-- wp:paragraph --><p>Server checked conflict choice.</p><!-- /wp:paragraph -->',
			},
		} );

		render( <DistributedEditingStatus /> );

		const comparison = screen.getByRole( 'region', {
			name: 'Distributed editing conflict comparison',
		} );

		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-guide-status',
			'choice_checked'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-prepare-save-ready',
			'true'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-save-prepared',
			'false'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-save-ready',
			'false'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-next-step',
			'prepare_guarded_save'
		);
		expect(
			screen.getByText( 'WordPress checked this choice' )
		).toBeVisible();
		expect(
			screen.getByText(
				'Prepare Save before using the editor Save button. WordPress has not changed the post yet.'
			)
		).toBeVisible();
		expect( screen.getByText( 'Choose version' ) ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-step-status',
			'complete'
		);
		expect( screen.getByText( 'Check choice' ) ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-step-status',
			'complete'
		);
		const prepareSaveStep = within( comparison )
			.getAllByText( 'Prepare Save' )
			.find(
				( element ) =>
					element.getAttribute(
						'data-distributed-editing-conflict-resolution-step'
					) === 'prepare'
			);
		expect( prepareSaveStep ).toHaveAttribute( 'aria-current', 'step' );
		expect( prepareSaveStep ).toHaveAttribute(
			'aria-label',
			'Prepare Save, current step'
		);
		expect( screen.getByText( 'Use Save' ) ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-step-status',
			'upcoming'
		);
		expect(
			within( comparison ).queryByRole( 'button', {
				name: 'Check this choice',
			} )
		).not.toBeInTheDocument();
		const prepareSaveButton = within( comparison ).getByRole( 'button', {
			name: 'Prepare Save',
		} );
		expect( prepareSaveButton ).toHaveAttribute(
			'data-distributed-editing-conflict-action',
			'prepare_save'
		);
		expect( prepareSaveButton ).toHaveAttribute(
			'data-distributed-editing-conflict-action-does-not-save',
			'true'
		);
		expect( prepareSaveButton ).toHaveAttribute(
			'title',
			'Prepare this checked choice for the editor Save button. This does not save the post.'
		);

		await user.click( prepareSaveButton );

		expect(
			actions.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingRetrySubmitProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			await screen.findByText(
				'Save prepared. Use Save to send these changes to WordPress.'
			)
		).toBeVisible();
	} );

	it( 'keeps final Save readiness visible after preparing a checked same-block conflict choice', () => {
		setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			currentPost: { id: 42, type: 'post' },
			editedPostContent:
				'<!-- wp:paragraph --><p>Local prepared conflict choice.</p><!-- /wp:paragraph -->',
			sessionState: {
				disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
				reasonCode: null,
				pendingChangeCount: 1,
				remoteChangeCount: 0,
				requiresServerStateRefetch: false,
				refetchedServerState: true,
				canExportLocalUpdates: true,
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				localRebaseResultReason: 'same_block_changed',
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
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				retrySubmitSavePrepared: true,
				retrySubmitSaveReady: true,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base prepared conflict choice.</p><!-- /wp:paragraph -->',
				refetchedServerContent:
					'<!-- wp:paragraph --><p>Server prepared conflict choice.</p><!-- /wp:paragraph -->',
			},
		} );

		render( <DistributedEditingStatus /> );

		const comparison = screen.getByRole( 'region', {
			name: 'Distributed editing conflict comparison',
		} );
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-guide-status',
			'save_prepared'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-prepare-save-ready',
			'false'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-save-prepared',
			'true'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-save-ready',
			'true'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-next-step',
			'save_guarded_update'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-header-mode',
			'selected_version_ready_to_save'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-guide-steps-visible',
			'false'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-guide-visible',
			'false'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-prepared-compact',
			'true'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-choice-control-mode',
			'change_only'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-selected-row',
			'local'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-visible-choice-count',
			'1'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-actions-layout',
			'prepared_recovery_inline'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-support-actions-mode',
			'quiet_recovery'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-visible-row-count',
			'1'
		);
		expect(
			within( comparison ).queryByText( 'Choose version' )
		).not.toBeInTheDocument();
		expect(
			within( comparison ).queryByText( 'Check choice' )
		).not.toBeInTheDocument();
		expect(
			within( comparison ).queryByText( 'Use Save' )
		).not.toBeInTheDocument();
		expect(
			within( comparison ).getByText(
				'Selected version is ready to Save'
			)
		).toBeVisible();
		expect(
			within( comparison ).getByText(
				'The selected version is shown below. Use Save to update WordPress, or change to the other version before saving.'
			)
		).toBeVisible();
		expect(
			within( comparison ).queryByText( 'Compare changes' )
		).not.toBeInTheDocument();
		expect(
			within( comparison ).queryByText(
				'This editor and WordPress changed the same block. Choose the local version or the latest WordPress version before trying Save again.'
			)
		).not.toBeInTheDocument();
		expect( screen.getByText( 'Save prepared' ) ).toBeVisible();
		expect(
			screen.queryByText(
				'Use the editor Save button to update WordPress. Local changes remain pending until WordPress confirms.'
			)
		).not.toBeInTheDocument();
		expect(
			within( comparison ).queryByText( 'Save is prepared' )
		).not.toBeInTheDocument();
		expect(
			within( comparison ).queryByText( 'Editor Save is ready' )
		).not.toBeInTheDocument();
		expect(
			within( comparison ).queryByText(
				'Use the editor Save button to send this guarded update. This conflict choice has not changed the WordPress post yet.'
			)
		).not.toBeInTheDocument();
		expect(
			within( comparison ).queryByRole( 'button', {
				name: 'Prepare Save',
			} )
		).not.toBeInTheDocument();
		expect(
			within( comparison ).queryByRole( 'button', {
				name: 'Keep your local version',
			} )
		).not.toBeInTheDocument();
		expect(
			within( comparison ).queryByRole( 'button', {
				name: 'Use latest from WordPress',
			} )
		).not.toBeInTheDocument();
		const changeVersionButton = within( comparison ).getByRole( 'button', {
			name: 'Change to latest from WordPress',
		} );
		expect( changeVersionButton ).toHaveAttribute(
			'data-distributed-editing-conflict-choice-compact-change',
			'true'
		);
		expect( changeVersionButton ).toHaveAttribute(
			'data-distributed-editing-conflict-choice-selection-does-not-save',
			'true'
		);
		expect( changeVersionButton ).toHaveAttribute(
			'title',
			'Change the selected version. This does not save until WordPress checks the choice and Save confirms.'
		);
		expect(
			within( comparison )
				.getAllByRole( 'button' )
				.map( ( button ) => button.textContent )
		).toEqual( [
			'Change to latest from WordPress',
			'Export for review',
			'Get latest post',
		] );
		expect(
			within( comparison ).getByRole( 'button', {
				name: 'Export for review',
			} )
		).toHaveAttribute(
			'data-distributed-editing-conflict-support-action-emphasis',
			'quiet_recovery'
		);
		expect(
			within( comparison ).getByRole( 'button', {
				name: 'Get latest post',
			} )
		).toHaveAttribute(
			'data-distributed-editing-conflict-support-action-emphasis',
			'quiet_recovery'
		);
		expect(
			within( comparison ).getByLabelText( 'Your local version' )
		).toHaveValue( 'Local prepared conflict choice.' );
		expect(
			within( comparison ).queryByLabelText( 'Base version' )
		).not.toBeInTheDocument();
		expect(
			within( comparison ).queryByLabelText( 'Latest from WordPress' )
		).not.toBeInTheDocument();
	} );

	it( 'hides stale same-block conflict comparison after WordPress confirms Save', () => {
		setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			currentPost: { id: 42, type: 'post' },
			editedPostContent:
				'<!-- wp:paragraph --><p>Saved conflict choice.</p><!-- /wp:paragraph -->',
			sessionState: {
				disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
				reasonCode: null,
				pendingChangeCount: 0,
				hasPendingChanges: false,
				canExportLocalUpdates: false,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				localRebaseResultReason: 'same_block_changed',
				staleBaseConflictResolutionStatus:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LOCAL_VERSION_SELECTED,
				staleBaseConflictResolutionChoice:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL,
				staleBaseConflictResolutionRequiresFreshProof: false,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
				retrySubmitAccepted: true,
				retrySubmitSavePathRequired: true,
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				retrySubmitSavePrepared: true,
				retrySubmitSaveReady: true,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				retrySaveServerVersion: '8',
				retrySavePreviousServerVersion: '7',
				retrySaveSavesPost: true,
				retrySaveMutatesPostContent: true,
				retrySaveCreatesRevision: true,
				retrySaveClaimsSaved: true,
				retrySaveRevisionCreated: true,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base stale comparison evidence.</p><!-- /wp:paragraph -->',
				refetchedServerContent:
					'<!-- wp:paragraph --><p>Server stale comparison evidence.</p><!-- /wp:paragraph -->',
			},
		} );

		render( <DistributedEditingStatus /> );

		expect(
			screen.queryByRole( 'region', {
				name: 'Distributed editing conflict comparison',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Compare changes' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Editor Save is ready' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(
				'Use the editor Save button to send this guarded update. This conflict choice has not changed the WordPress post yet.'
			)
		).not.toBeInTheDocument();
		expect( screen.getByText( 'Save confirmed' ) ).toBeVisible();
		expect(
			screen.getByText(
				'WordPress saved the prepared changes, advanced the sync version from 7 to 8, and recorded 1 revision. Protected local changes are no longer pending for this save.'
			)
		).toBeVisible();
	} );

	it( 'mounts a content-free action transcript status entry', () => {
		setupDistributedEditingStatusSelect( {
			sessionState: {
				actionTranscriptItems: [
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.LOCAL_EDITOR_ACTION,
						rawContent:
							'<!-- wp:paragraph --><p>Hidden draft</p><!-- /wp:paragraph -->',
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REMOTE_CHANGE_RECEIVED,
					},
				],
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const status = screen.getByRole( 'region', {
			name: 'Distributed editing status',
		} );
		const transcriptItem = screen.getByTestId(
			'distributed-editing-action-transcript-status'
		);

		expect( status ).toHaveAttribute(
			'data-distributed-editing-placement',
			'editor-interface-notices'
		);
		expect( transcriptItem ).toHaveAttribute(
			'data-distributed-editing-transcript-event-type',
			DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REMOTE_CHANGE_RECEIVED
		);
		expect( transcriptItem ).toHaveAttribute(
			'data-distributed-editing-transcript-item-count',
			'1'
		);
		expect( transcriptItem ).toHaveAttribute(
			'data-distributed-editing-transcript-redacted',
			'true'
		);
		expect( transcriptItem ).toHaveAttribute(
			'data-distributed-editing-transcript-support-report',
			'true'
		);
		expect( transcriptItem ).toHaveAttribute(
			'data-distributed-editing-transcript-support-shareable',
			'true'
		);
		expect( transcriptItem ).toHaveAttribute(
			'data-distributed-editing-transcript-support-save-authority-required',
			'true'
		);
		expect(
			screen.getByText(
				'Remote editing activity was recorded for review without exposing post content.'
			)
		).toBeVisible();
		expect(
			screen.getByText(
				'Distributed Editing activity was recorded; no fresh-review chronology is complete. Recorded 1 redacted transcript event; 1 unsafe entry was dropped. This transcript is diagnostic only; save authority evidence is still required before treating these changes as saved.'
			)
		).toBeVisible();
		const timeline = screen.getByRole( 'list', {
			name: 'Distributed editing transcript timeline',
		} );
		expect( timeline ).toHaveAttribute(
			'data-distributed-editing-transcript-timeline-count',
			'1'
		);
		expect(
			screen.getByText( 'Remote editing activity recorded' )
		).toBeVisible();
		expect(
			screen.getByText( 'Remote editing activity recorded' )
		).toHaveAttribute(
			'data-distributed-editing-transcript-timeline-event-type',
			DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.REMOTE_CHANGE_RECEIVED
		);
		expect(
			screen.getByText( 'Remote editing activity recorded' )
		).toHaveAttribute(
			'data-distributed-editing-transcript-timeline-redacted',
			'true'
		);
		expect( status ).not.toHaveTextContent( 'Hidden draft' );
	} );

	it( 'describes a fresh-review request transcript without raw content', () => {
		setupDistributedEditingStatusSelect( {
			sessionState: {
				actionTranscriptItems: [
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED,
						proofSignature: 'hidden-fresh-review-proof',
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED,
					},
				],
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const transcriptItem = screen.getByTestId(
			'distributed-editing-action-transcript-status'
		);

		expect( transcriptItem ).toHaveAttribute(
			'data-distributed-editing-transcript-event-type',
			DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_REQUESTED
		);
		expect( transcriptItem ).toHaveAttribute(
			'data-distributed-editing-transcript-redacted',
			'true'
		);
		expect(
			screen.getByText(
				'The editor requested fresh review and kept the activity record content-free.'
			)
		).toBeVisible();
		expect(
			screen.queryByText( 'hidden-fresh-review-proof' )
		).not.toBeInTheDocument();
	} );

	it( 'describes a fresh-review decision transcript without proof internals', () => {
		setupDistributedEditingStatusSelect( {
			sessionState: {
				actionTranscriptItems: [
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED,
						reviewerId: 123,
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED,
					},
				],
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const transcriptItem = screen.getByTestId(
			'distributed-editing-action-transcript-status'
		);

		expect( transcriptItem ).toHaveAttribute(
			'data-distributed-editing-transcript-event-type',
			DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_DECISION_SUBMITTED
		);
		expect( transcriptItem ).toHaveAttribute(
			'data-distributed-editing-transcript-redacted',
			'true'
		);
		expect(
			screen.getByText(
				'The editor submitted a fresh-review decision and kept the activity record content-free.'
			)
		).toBeVisible();
		expect( screen.queryByText( '123' ) ).not.toBeInTheDocument();
	} );

	it( 'describes a fresh-review consume-validation transcript without proof internals', () => {
		setupDistributedEditingStatusSelect( {
			sessionState: {
				actionTranscriptItems: [
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_CONSUME_VALIDATED,
						proofSignature: 'hidden-consume-validation-proof',
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_CONSUME_VALIDATED,
					},
				],
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const transcriptItem = screen.getByTestId(
			'distributed-editing-action-transcript-status'
		);

		expect( transcriptItem ).toHaveAttribute(
			'data-distributed-editing-transcript-event-type',
			DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_CONSUME_VALIDATED
		);
		expect( transcriptItem ).toHaveAttribute(
			'data-distributed-editing-transcript-redacted',
			'true'
		);
		expect(
			screen.getByText(
				'The editor validated fresh-review handoff proof and kept the activity record content-free.'
			)
		).toBeVisible();
		expect(
			screen.queryByText( 'hidden-consume-validation-proof' )
		).not.toBeInTheDocument();
	} );

	it( 'describes a fresh-review confirmed save transcript without proof internals', () => {
		setupDistributedEditingStatusSelect( {
			sessionState: {
				actionTranscriptItems: [
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED,
						proofSignature: 'hidden-fresh-review-save-proof',
					},
					{
						eventType:
							DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED,
					},
				],
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const transcriptItem = screen.getByTestId(
			'distributed-editing-action-transcript-status'
		);

		expect( transcriptItem ).toHaveAttribute(
			'data-distributed-editing-transcript-event-type',
			DISTRIBUTED_EDITING_ACTION_TRANSCRIPT_EVENT_TYPES.FRESH_REVIEW_RETRY_SAVE_CONFIRMED
		);
		expect( transcriptItem ).toHaveAttribute(
			'data-distributed-editing-transcript-redacted',
			'true'
		);
		expect(
			screen.getByText(
				'WordPress confirmed the fresh-review Save and kept the activity record content-free.'
			)
		).toBeVisible();
		expect(
			screen.queryByText( 'hidden-fresh-review-save-proof' )
		).not.toBeInTheDocument();
	} );

	it( 'mounts production editor chrome with explicit placement', () => {
		setupDistributedEditingStatusSelect( {
			sessionState: {
				pendingChangeCount: 1,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		expect(
			screen.getByRole( 'region', {
				name: 'Distributed editing status',
			} )
		).toHaveAttribute(
			'data-distributed-editing-placement',
			'editor-interface-notices'
		);
		expect( screen.getByText( 'Changes pending' ) ).toBeVisible();
	} );

	it( 'mounts the enabled editor shell from production chrome', () => {
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
				},
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const shell = screen.getByRole( 'region', {
			name: 'Distributed editing enabled status',
		} );
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-shell',
			'enabled'
		);
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-shell-placement',
			'editor-interface-notices'
		);
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-server-contact',
			'nominal'
		);
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-local-protection',
			'idle'
		);
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-save-state',
			'update_ready'
		);
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-save-action',
			'continue_save'
		);
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-authority-state',
			'ready_to_update_authoritative_post'
		);
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-human-loop-step',
			'ready_to_edit'
		);
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-human-loop-action',
			'edit'
		);
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-enabled-shell-scan-layout',
			'compact-summary-row'
		);
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-enabled-shell-visible-labels',
			'false'
		);
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-enabled-shell-save-guidance-visible',
			'false'
		);
		expect( within( shell ).getByText( 'Editing together' ) ).toBeVisible();
		expect(
			screen.getByText( 'Other editors in this post appear below.' )
		).toBeVisible();
		expect(
			screen.queryByText( 'Save checks WordPress before updating.' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Distributed Editing enabled' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Save is available' )
		).not.toBeInTheDocument();
		expect( screen.queryByText( 'Current step' ) ).not.toBeInTheDocument();
		expect( within( shell ).getByText( 'Mode' ) ).toHaveClass(
			'screen-reader-text'
		);
		expect( within( shell ).getByText( 'Local protection' ) ).toHaveClass(
			'screen-reader-text'
		);
		expect( within( shell ).getByText( 'Save' ) ).toHaveClass(
			'screen-reader-text'
		);
		// eslint-disable-next-line testing-library/no-node-access
		const humanLoop = shell.querySelector(
			'[data-distributed-editing-human-loop-step-status]'
		);
		// eslint-disable-next-line testing-library/no-node-access
		const saveJourney = shell.querySelector(
			'[data-distributed-editing-save-journey-status]'
		);
		expect( saveJourney ).toHaveAttribute(
			'data-distributed-editing-save-journey-status',
			'ready_to_edit'
		);
		expect( saveJourney ).toHaveAttribute(
			'data-distributed-editing-save-journey-status-summary',
			'Save can update the authoritative WordPress post.'
		);
		expect( saveJourney ).toHaveAttribute(
			'data-distributed-editing-save-journey-authority-state',
			'ready_to_update_authoritative_post'
		);
		expect( saveJourney ).toHaveAttribute(
			'data-distributed-editing-save-journey-authority-summary',
			'Save can update the authoritative WordPress post.'
		);
		expect( saveJourney ).toHaveAttribute(
			'data-distributed-editing-save-journey-descriptor-only',
			'true'
		);
		expect( saveJourney ).toHaveAttribute(
			'data-distributed-editing-save-journey-calls-normal-save',
			'false'
		);
		expect( saveJourney ).toHaveAttribute(
			'data-distributed-editing-save-journey-calls-retry-save',
			'false'
		);
		expect( saveJourney ).toHaveAttribute(
			'data-distributed-editing-save-journey-claims-saved-without-evidence',
			'false'
		);
		expect( humanLoop ).toHaveAttribute(
			'data-distributed-editing-human-loop-descriptor-only',
			'true'
		);
		expect( humanLoop ).toHaveAttribute(
			'data-distributed-editing-human-loop-calls-normal-save',
			'false'
		);
		expect( humanLoop ).toHaveAttribute(
			'data-distributed-editing-human-loop-calls-retry-save',
			'false'
		);
		expect( humanLoop ).toHaveAttribute(
			'data-distributed-editing-human-loop-claims-saved-without-evidence',
			'false'
		);
		expect( screen.queryByText( 'Active now' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'No other editors shown.' ) ).toBeVisible();
		expect( screen.getByText( 'No other editors shown.' ) ).toHaveAttribute(
			'aria-label',
			'Presence: No other editors shown.'
		);
		expect(
			screen.queryByText( 'Editor activity has not been shown yet.' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Use Refresh editing list to check again.' )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} )
		).toHaveAttribute(
			'data-distributed-editing-presence-summary-scan-layout',
			'single-line-primary-cue'
		);
		expect(
			screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} )
		).toHaveAttribute(
			'data-distributed-editing-presence-summary-live-region',
			'polite'
		);
		expect(
			screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} )
		).toHaveAttribute(
			'data-distributed-editing-presence-summary-has-accessible-name',
			'true'
		);
		expect(
			screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} )
		).toHaveAttribute(
			'data-distributed-editing-presence-claims-absence',
			'false'
		);
		expect(
			screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} )
		).toHaveAttribute(
			'data-distributed-editing-presence-summary-current-count',
			'0'
		);
		expect(
			screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} )
		).toHaveAttribute(
			'data-distributed-editing-presence-summary-delayed-count',
			'0'
		);
		expect(
			screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} )
		).toHaveAttribute(
			'data-distributed-editing-presence-summary-claims-absence',
			'false'
		);
		expect(
			screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} )
		).toHaveAttribute(
			'data-distributed-editing-presence-refresh-hint-visible',
			'false'
		);
		expect(
			screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} )
		).toHaveAttribute(
			'data-distributed-editing-presence-refresh-hint',
			'Use Refresh editing list to check again.'
		);
		expect(
			screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} )
		).toHaveAttribute(
			'data-distributed-editing-presence-actions-visible',
			'false'
		);
		expect(
			screen.queryByRole( 'button', {
				name: 'Refresh editing list',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', {
				name: 'Update my presence',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'region', {
				name: 'Distributed editing status',
			} )
		).not.toBeInTheDocument();
	} );

	it( 'summarizes confirmed Save state in the enabled editor shell and then returns to quiet ready state', () => {
		const originalConfirmedSaveShellHoldMs =
			globalThis.__experimentalDistributedEditingConfirmedSaveShellHoldMs;
		globalThis.__experimentalDistributedEditingConfirmedSaveShellHoldMs = 1000;
		jest.useFakeTimers();

		try {
			setupDistributedEditingStatusSelect( {
				editorSettings: {
					distributedEditing: {
						enabled: true,
					},
				},
				sessionState: {
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
					retrySaveAccepted: true,
					retrySaveServerVersion: '232',
					retrySavePreviousServerVersion: '231',
					retrySaveSavesPost: true,
					retrySaveMutatesPostContent: true,
					retrySaveCreatesRevision: true,
					retrySaveClaimsSaved: true,
					retrySaveRevisionCreated: true,
				},
			} );

			render( <DistributedEditingStatusChrome /> );

			const shell = screen.getByRole( 'region', {
				name: 'Distributed editing enabled status',
			} );
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-server-contact',
				'nominal'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-local-protection',
				'idle'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-save-state',
				'retry_save_confirmed'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-save-action',
				'none'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-authority-state',
				'authoritative_update_confirmed'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-human-loop-step',
				'save_confirmed'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-human-loop-action',
				'none'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-confirmed-save-evidence-retained',
				'true'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-confirmed-save-shell-quieted',
				'false'
			);
			expect( within( shell ).getByText( 'Saved' ) ).toBeVisible();
			expect(
				screen.queryByText(
					'WordPress will protect local changes and show sync status here when review, refresh, or server confirmation is needed.'
				)
			).not.toBeInTheDocument();
			expect(
				screen.queryByText(
					'WordPress accepted this Distributed Editing Save. You can keep editing; WordPress will protect any new local changes.'
				)
			).not.toBeInTheDocument();
			expect(
				within( shell ).getByText( 'Ready for new edits.' )
			).toBeVisible();
			expect(
				screen.queryByText( 'WordPress confirmed Save.' )
			).not.toBeInTheDocument();
			// eslint-disable-next-line testing-library/no-node-access
			let saveJourney = shell.querySelector(
				'[data-distributed-editing-save-journey-status]'
			);
			// eslint-disable-next-line testing-library/no-node-access
			const saveSummaryItem = shell.querySelector(
				'[data-distributed-editing-enabled-shell-summary-item="save"]'
			);
			// eslint-disable-next-line testing-library/no-node-access
			let humanLoop = shell.querySelector(
				'[data-distributed-editing-human-loop-step-status]'
			);
			expect( saveJourney ).toHaveAttribute(
				'data-distributed-editing-save-journey-status',
				'save_confirmed'
			);
			expect( saveSummaryItem ).toHaveAttribute(
				'data-distributed-editing-enabled-shell-summary-item-visible',
				'false'
			);
			expect( saveJourney ).toHaveAttribute(
				'data-distributed-editing-save-journey-status-summary',
				'Ready for new edits.'
			);
			expect( saveJourney ).toHaveAttribute(
				'data-distributed-editing-save-journey-claims-saved-without-evidence',
				'false'
			);
			expect( humanLoop ).toHaveAttribute(
				'data-distributed-editing-human-loop-confirmed-by-wordpress',
				'true'
			);
			expect( humanLoop ).toHaveAttribute(
				'data-distributed-editing-human-loop-claims-saved-without-evidence',
				'false'
			);

			act( () => {
				jest.advanceTimersByTime( 1000 );
			} );

			expect( shell ).toHaveAttribute(
				'data-distributed-editing-save-state',
				'update_ready'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-save-action',
				'continue_save'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-authority-state',
				'ready_to_update_authoritative_post'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-human-loop-step',
				'ready_to_edit'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-human-loop-action',
				'edit'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-confirmed-save-evidence-retained',
				'true'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-confirmed-save-shell-quieted',
				'true'
			);
			expect(
				within( shell ).getByText( 'Editing together' )
			).toBeVisible();
			expect(
				within( shell ).getByText(
					'Other editors in this post appear below.'
				)
			).toBeVisible();
			expect(
				within( shell ).queryByText( 'Saved' )
			).not.toBeInTheDocument();
			expect(
				within( shell ).queryByText( 'Ready for new edits.' )
			).not.toBeInTheDocument();
			// eslint-disable-next-line testing-library/no-node-access
			saveJourney = shell.querySelector(
				'[data-distributed-editing-save-journey-status]'
			);
			// eslint-disable-next-line testing-library/no-node-access
			humanLoop = shell.querySelector(
				'[data-distributed-editing-human-loop-step-status]'
			);
			expect( saveJourney ).toHaveAttribute(
				'data-distributed-editing-save-journey-status',
				'ready_to_edit'
			);
			expect( saveJourney ).toHaveAttribute(
				'data-distributed-editing-save-journey-status-summary',
				'Save can update the authoritative WordPress post.'
			);
			expect( saveJourney ).toHaveAttribute(
				'data-distributed-editing-save-journey-claims-saved-without-evidence',
				'false'
			);
			expect( humanLoop ).toHaveAttribute(
				'data-distributed-editing-human-loop-confirmed-by-wordpress',
				'false'
			);
			expect( humanLoop ).toHaveAttribute(
				'data-distributed-editing-human-loop-claims-saved-without-evidence',
				'false'
			);
		} finally {
			jest.useRealTimers();

			if ( originalConfirmedSaveShellHoldMs === undefined ) {
				delete globalThis.__experimentalDistributedEditingConfirmedSaveShellHoldMs;
			} else {
				globalThis.__experimentalDistributedEditingConfirmedSaveShellHoldMs =
					originalConfirmedSaveShellHoldMs;
			}
		}
	} );

	it( 'shows a latency-tolerant presence roster in the enabled editor shell', () => {
		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
				},
			},
			sessionState: {
				presenceRosterEntries: [
					{
						key: 'presence-mira',
						displayName: 'Mira',
						freshness: 'current',
					},
					{
						key: 'presence-hidden',
						identityVisibility: 'anonymous',
						freshness: 'current',
						userId: 42,
						selection: { anchor: 9 },
					},
				],
				presenceRosterTotalKnownCount: 2,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const presence = screen.getByRole( 'group', {
			name: 'Distributed editing presence',
		} );
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-status',
			'active'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-visible-count',
			'2'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-current-count',
			'2'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-delayed-count',
			'0'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-calls-save',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-changes-post-lock',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-exposes-private-fields',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-row-visual-treatment',
			'subtle-status-stripe'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-row-visual-treatment-accessible',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-row-visual-treatment-color-only',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-row-visual-treatment-layout-stable',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-calls-rest',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-calls-save',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-mutates-editor-content',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-changes-post-lock',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-claims-saved',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-exposes-selection',
			'false'
		);
		expect(
			screen.queryByText(
				'Mira and Another editor are also editing this post.'
			)
		).not.toBeInTheDocument();
		expect(
			screen.getByText( '2 other editors are active now.' )
		).toBeVisible();
		expect(
			screen.getByText( '2 other editors are active now.' )
		).toHaveAttribute(
			'aria-label',
			'Presence: 2 other editors are active now.'
		);
		expect(
			screen.queryByText( '2 editors are active now.' )
		).not.toBeInTheDocument();
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-other-editor-cue',
			'2 other editors are active now.'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-other-editor-cue-visible',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-other-editor-cue-claims-absence',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-other-editor-cue-content-free',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-other-editor-cue-tone',
			'current'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-other-editor-cue-exposes-private-fields',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-other-editor-cue-calls-save',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-other-editor-cue-changes-post-lock',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-other-editor-cue-blocks-editing',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-other-editor-cue-treats-delayed-as-error',
			'false'
		);
		expect(
			screen.getByText( '2 other editors are active now.' )
		).toHaveClass(
			'editor-distributed-editing-status__presence-other-editor-cue--current'
		);
		const rowList = screen.getByRole( 'list', {
			name: 'Visible editors',
		} );
		const rows = within( rowList ).getAllByRole( 'listitem' );

		expect( rowList ).toHaveAttribute(
			'data-distributed-editing-presence-row-treatment-list',
			'compact-status-badges'
		);
		expect( rowList ).toHaveAttribute(
			'data-distributed-editing-presence-row-visual-treatment-list',
			'subtle-status-stripe'
		);
		expect( rows ).toHaveLength( 2 );
		expect( rows[ 0 ] ).toHaveClass(
			'editor-distributed-editing-status__presence-roster-item--current'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-treatment',
			'compact-status-badge'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-visual-treatment',
			'subtle-status-stripe'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-current',
			'true'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-status-tone',
			'current'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-status-affordance',
			'dot-and-label'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-has-avatar-initial',
			'true'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-has-status-affordance',
			'true'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'other_user'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-scan-treatment',
			'avatar-name-status-chip'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-visual-treatment-color-only',
			'false'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-visual-treatment-layout-stable',
			'true'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-freshness',
			'current'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-exposes-private-fields',
			'false'
		);
		expect( rows[ 0 ] ).toHaveAttribute( 'aria-label', 'Mira, Active now' );
		expect( rows[ 1 ] ).toHaveAttribute(
			'aria-label',
			'Another editor, Active now'
		);
		expect( rows[ 1 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'other_user'
		);
		expect( screen.getByText( 'Mira' ) ).toBeVisible();
		expect( screen.getAllByText( 'Another editor' ) ).toHaveLength( 1 );
		expect(
			screen.queryByText( /userId|anchor|selection/i )
		).not.toBeInTheDocument();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
	} );

	it( 'shows delayed remote presence as distinct but non-blocking in the enabled shell', () => {
		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
				},
			},
			sessionState: {
				presenceRosterEntries: [
					{
						key: 'presence-sam',
						displayName: 'Sam',
						freshness: 'recent',
					},
				],
				presenceRosterTotalKnownCount: 1,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const presence = screen.getByRole( 'group', {
			name: 'Distributed editing presence',
		} );
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-status',
			'recent'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-current-count',
			'0'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-delayed-count',
			'1'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-remote-delayed-count',
			'1'
		);
		expect(
			screen.queryByText(
				'Sam was here recently. Presence may be delayed.'
			)
		).not.toBeInTheDocument();
		expect(
			screen.getByText( '1 other editor may be delayed.' )
		).toBeVisible();
		expect(
			screen.getByText( '1 other editor may be delayed.' )
		).toHaveAttribute(
			'aria-label',
			'Presence: 1 other editor may be delayed.'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-other-editor-cue',
			'1 other editor may be delayed.'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-other-editor-cue-tone',
			'delayed'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-other-editor-cue-blocks-editing',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-other-editor-cue-treats-delayed-as-error',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-other-editor-cue-calls-save',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-other-editor-cue-changes-post-lock',
			'false'
		);
		expect(
			screen.getByText( '1 other editor may be delayed.' )
		).toHaveClass(
			'editor-distributed-editing-status__presence-other-editor-cue--delayed'
		);
		const row = screen.getByRole( 'listitem', {
			name: 'Sam, Presence may be delayed',
		} );
		expect( row ).toHaveClass(
			'editor-distributed-editing-status__presence-roster-item--delayed'
		);
		expect( row ).toHaveAttribute(
			'data-distributed-editing-presence-row-current',
			'false'
		);
		expect( row ).toHaveAttribute(
			'data-distributed-editing-presence-row-status-tone',
			'delayed'
		);
		expect( row ).toHaveAttribute(
			'data-distributed-editing-presence-row-exposes-selection',
			'false'
		);
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
	} );

	it( 'shows presence storage readiness without installing storage or weakening save safety', () => {
		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
					presenceStorageReadiness: {
						status: 'setup_required',
						tableExists: false,
						schemaCurrent: false,
						expectedStartupHeartbeatStatus: 'degraded',
						setupRequired: true,
						setupAction: 'call_wp_de_rtc_install_presence_table',
						automaticPerRequestInstall: false,
						installsPresenceTable: false,
						diagnosticOnly: true,
						contentFree: true,
						callsSave: false,
						changesPostLock: false,
						claimsAbsence: false,
						claimsSaved: false,
						exposesRawContent: false,
						exposesUserIds: false,
						exposesCursorOffset: false,
						exposesSelection: false,
						correctnessIndependentOfTransport: true,
						transportRequiredForCorrectness: false,
					},
				},
			},
			sessionState: {
				presenceRosterStatus: 'empty',
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const presence = screen.getByRole( 'group', {
			name: 'Distributed editing presence',
		} );

		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-status',
			'setup_required'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-table-ready',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-schema-current',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-expected-startup-heartbeat',
			'degraded'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-setup-required',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-setup-action',
			'call_wp_de_rtc_install_presence_table'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-diagnostic-only',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-content-free',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-installs-table',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-automatic-install',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-calls-save',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-changes-post-lock',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-claims-absence',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-claims-saved',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-exposes-private-fields',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-exposes-raw-content',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-correctness-independent',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-transport-required-for-correctness',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-visible',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-status',
			'setup_required'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-href',
			'options-writing.php#wp_de_rtc_enabled'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-opens-settings-new-tab',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-navigates-to-writing-settings',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-settings-opened',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-reload-prompt-visible',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-reload-action-available',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-reload-requires-protected-local-changes',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-refresh-instruction-visible',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-runs-setup-from-editor',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-reloads-editor-now',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-calls-save',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-changes-post-lock',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-mutates-editor-content',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-mutates-persisted-post-content',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-exposes-raw-content',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-exposes-private-fields',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-correctness-independent',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-recheck-status',
			'idle'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-recheck-available',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-recheck-calls-rest-on-click',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-recheck-installs-table',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-recheck-records-heartbeat',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-recheck-calls-save',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-recheck-mutates-editor-content',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-recheck-changes-post-lock',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-freshness-indicator-state',
			'degraded'
		);
		expect(
			screen.getByText( 'Presence storage setup needed' )
		).toBeVisible();
		expect(
			screen.getByText(
				'Presence storage is not set up yet. Automatic startup presence may be delayed until setup is run deliberately.'
			)
		).toBeVisible();
		expect(
			screen.getByText( 'Presence live updates degraded' )
		).toBeVisible();
		expect(
			screen.getByText(
				'Presence storage is not ready. Editing can continue; saves do not depend on presence.'
			)
		).toBeVisible();
		expect(
			screen.getByText( 'Presence setup in Writing settings' )
		).toBeVisible();
		expect(
			screen.getByText(
				'Open Writing settings to run the deliberate presence storage setup. After setup completes, check status here or reload this editor after protecting local changes.'
			)
		).toBeVisible();
		expect(
			screen.getByRole( 'link', {
				name: 'Open Writing settings',
			} )
		).toHaveAttribute( 'href', 'options-writing.php#wp_de_rtc_enabled' );
		expect(
			screen.getByRole( 'link', {
				name: 'Open Writing settings',
			} )
		).toHaveAttribute( 'target', '_blank' );
		expect(
			screen.getByRole( 'link', {
				name: 'Open Writing settings',
			} )
		).toHaveAttribute( 'rel', 'noreferrer' );
		expect(
			screen.getByRole( 'button', {
				name: 'Check setup status',
			} )
		).toBeVisible();
		expect(
			actions.__experimentalRefreshDistributedEditingPresenceStorageReadiness
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSendDistributedEditingPresenceHeartbeat
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			screen.queryByText( /post_content|userId|cursor|selection/i )
		).not.toBeInTheDocument();
	} );

	it( 'shows a local reload prompt after opening Writing settings for presence setup', () => {
		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
					presenceStorageReadiness: {
						status: 'setup_required',
						tableExists: false,
						schemaCurrent: false,
						expectedStartupHeartbeatStatus: 'degraded',
						setupRequired: true,
						setupAction: 'call_wp_de_rtc_install_presence_table',
						diagnosticOnly: true,
						contentFree: true,
						callsSave: false,
						changesPostLock: false,
						claimsAbsence: false,
						claimsSaved: false,
						correctnessIndependentOfTransport: true,
						transportRequiredForCorrectness: false,
					},
				},
			},
			sessionState: {
				presenceRosterStatus: 'empty',
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const presence = screen.getByRole( 'group', {
			name: 'Distributed editing presence',
		} );
		const settingsLink = screen.getByRole( 'link', {
			name: 'Open Writing settings',
		} );

		fireEvent.click( settingsLink );

		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-status',
			'settings_opened_reload_recommended'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-settings-opened',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-reload-prompt-visible',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-reload-action-available',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-reloads-editor-now',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-runs-setup-from-editor',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-calls-save',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-mutates-editor-content',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-mutates-persisted-post-content',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-changes-post-lock',
			'false'
		);
		expect(
			screen.getByText( 'Check after setup finishes' )
		).toBeVisible();
		expect(
			screen.getByText(
				'When setup completes in Writing settings, check setup status here. If local changes are sensitive, reload only after protecting them.'
			)
		).toBeVisible();
		expect(
			actions.__experimentalRefreshDistributedEditingPresenceStorageReadiness
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingPresenceSnapshot
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSendDistributedEditingPresenceHeartbeat
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			screen.queryByText( /post_content|userId|cursor|selection/i )
		).not.toBeInTheDocument();
	} );

	it( 'can re-check presence storage readiness after setup without saving or writing presence', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
					presenceStorageReadiness: {
						status: 'setup_required',
						tableExists: false,
						schemaCurrent: false,
						expectedStartupHeartbeatStatus: 'degraded',
						setupRequired: true,
						setupAction: 'call_wp_de_rtc_install_presence_table',
						diagnosticOnly: true,
						contentFree: true,
						callsSave: false,
						changesPostLock: false,
						claimsAbsence: false,
						claimsSaved: false,
						correctnessIndependentOfTransport: true,
						transportRequiredForCorrectness: false,
					},
				},
			},
			sessionState: {
				presenceRosterStatus: 'empty',
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const presence = screen.getByRole( 'group', {
			name: 'Distributed editing presence',
		} );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Check setup status',
			} )
		);

		await waitFor( () =>
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-storage-readiness-status',
				'ready'
			)
		);

		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-table-ready',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-schema-current',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-recheck-status',
			'ready'
		);

		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-recheck-calls-rest-on-click',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-recheck-installs-table',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-recheck-records-heartbeat',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-recheck-writes-presence',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-recheck-starts-polling',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-recheck-calls-save',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-recheck-mutates-editor-content',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-readiness-recheck-changes-post-lock',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-storage-setup-affordance-visible',
			'false'
		);
		expect(
			actions.__experimentalRefreshDistributedEditingPresenceStorageReadiness
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.__experimentalRefreshDistributedEditingPresenceSnapshot
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSendDistributedEditingPresenceHeartbeat
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect( screen.getByText( 'Presence setup confirmed' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Presence storage is ready in this editor. Startup presence can proceed when enabled.'
			)
		).toBeVisible();
		expect(
			screen.queryByText( /post_content|userId|cursor|selection/i )
		).not.toBeInTheDocument();
	} );

	it( 'schedules the startup heartbeat after readiness re-check confirms storage', async () => {
		jest.useFakeTimers();

		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
					presenceStorageReadiness: {
						status: 'setup_required',
						tableExists: false,
						schemaCurrent: false,
						expectedStartupHeartbeatStatus: 'degraded',
						setupRequired: true,
						setupAction: 'call_wp_de_rtc_install_presence_table',
						diagnosticOnly: true,
						contentFree: true,
						callsSave: false,
						changesPostLock: false,
						claimsAbsence: false,
						claimsSaved: false,
						correctnessIndependentOfTransport: true,
						transportRequiredForCorrectness: false,
					},
				},
			},
			sessionState: {
				presenceRosterStatus: 'empty',
				presenceStartupPolicyStatus:
					DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.SLOW_AUTOMATIC_HEARTBEAT_ALLOWED,
				presenceStartupPolicyReason: 'cheap_host_slow_startup_allowed',
				presenceStartupPolicyRequiresExplicitEnablement: true,
				presenceStartupPolicyMaySendInitialHeartbeatAutomatically: true,
				presenceStartupPolicySlowAutomaticHeartbeatAllowed: true,
				presenceStartupPolicyHostProfile: 'cheap_shared_host',
				presenceStartupPolicyServerContact: 'nominal',
				presenceStartupPolicySelectedInitialHeartbeatDelaySeconds: 2,
				presenceStartupPolicyCallsHeartbeatEndpointNow: false,
				presenceStartupPolicyWritesPresenceNow: false,
				presenceStartupPolicyStartsPollingNow: false,
				presenceStartupPolicyStartsTimerNow: false,
				presenceStartupPolicyCallsSave: false,
				presenceStartupPolicyChangesPostLock: false,
				presenceStartupPolicyClaimsAbsence: false,
				presenceStartupPolicyClaimsSaved: false,
				presenceStartupPolicyExposesRawContent: false,
				presenceStartupPolicyRawSessionKeyIncluded: false,
			},
		} );

		const { unmount } = render( <DistributedEditingStatusChrome /> );

		try {
			const presence = screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} );

			await waitFor( () =>
				expect( presence ).toHaveAttribute(
					'data-distributed-editing-presence-startup-heartbeat-runtime-status',
					'degraded_storage_setup_required'
				)
			);

			fireEvent.click(
				screen.getByRole( 'button', {
					name: 'Check setup status',
				} )
			);

			await waitFor( () =>
				expect( presence ).toHaveAttribute(
					'data-distributed-editing-presence-storage-readiness-status',
					'ready'
				)
			);

			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-status',
				'scheduled'
			);

			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-delay-ms',
				'2000'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-storage-ready',
				'true'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-blocked-by-storage-readiness',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-timer-active',
				'true'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-calls-presence-read-endpoint',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-starts-polling',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-calls-save',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-changes-post-lock',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-freshness-indicator-state',
				'ready'
			);
			expect(
				screen.queryByText( 'Presence startup scheduled' )
			).not.toBeInTheDocument();
			expect(
				screen.queryByText(
					'Presence storage is ready and the startup update is waiting on its configured delay. Saves do not depend on presence.'
				)
			).not.toBeInTheDocument();
			expect(
				screen.queryByText(
					'Initial presence will update after about 2 seconds.'
				)
			).not.toBeInTheDocument();
			expect(
				actions.__experimentalRefreshDistributedEditingPresenceStorageReadiness
			).toHaveBeenCalledTimes( 1 );
			expect(
				actions.__experimentalSendDistributedEditingPresenceHeartbeat
			).not.toHaveBeenCalled();
			expect(
				actions.__experimentalRefreshDistributedEditingPresenceSnapshot
			).not.toHaveBeenCalled();
			expect(
				actions.__experimentalSaveDistributedEditingRetryAfterProof
			).not.toHaveBeenCalled();

			await act( async () => {
				jest.advanceTimersByTime( 2000 );
				await Promise.resolve();
				await Promise.resolve();
			} );

			expect(
				actions.__experimentalSendDistributedEditingPresenceHeartbeat
			).toHaveBeenCalledTimes( 1 );
			expect(
				actions.__experimentalRefreshDistributedEditingPresenceSnapshot
			).not.toHaveBeenCalled();
			expect(
				actions.__experimentalSaveDistributedEditingRetryAfterProof
			).not.toHaveBeenCalled();
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-status',
				'sent'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-heartbeat-command-status',
				'sent'
			);

			await act( async () => {
				jest.advanceTimersByTime( 1000 );
				await Promise.resolve();
				await Promise.resolve();
			} );

			expect(
				actions.__experimentalRefreshDistributedEditingPresenceSnapshot
			).toHaveBeenCalledTimes( 1 );
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-refresh-command-status',
				'refreshed'
			);
			expect(
				actions.__experimentalSaveDistributedEditingRetryAfterProof
			).not.toHaveBeenCalled();
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-status',
				'sent'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-heartbeat-command-status',
				'sent'
			);
			expect(
				screen.queryByText(
					/session_key|rawSessionKey|userId|cursor|selection/i
				)
			).not.toBeInTheDocument();
		} finally {
			unmount();
			jest.clearAllTimers();
			jest.useRealTimers();
		}
	} );

	it( 'keeps automatic startup presence degraded until storage setup is ready', async () => {
		jest.useFakeTimers();

		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
					presenceStorageReadiness: {
						status: 'setup_required',
						tableExists: false,
						schemaCurrent: false,
						expectedStartupHeartbeatStatus: 'degraded',
						setupRequired: true,
						setupAction: 'call_wp_de_rtc_install_presence_table',
						diagnosticOnly: true,
						contentFree: true,
						callsSave: false,
						changesPostLock: false,
						claimsAbsence: false,
						claimsSaved: false,
						correctnessIndependentOfTransport: true,
						transportRequiredForCorrectness: false,
					},
				},
			},
			sessionState: {
				presenceRosterStatus: 'empty',
				presenceStartupPolicyStatus:
					DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.SLOW_AUTOMATIC_HEARTBEAT_ALLOWED,
				presenceStartupPolicyReason: 'cheap_host_slow_startup_allowed',
				presenceStartupPolicyMaySendInitialHeartbeatAutomatically: true,
				presenceStartupPolicySlowAutomaticHeartbeatAllowed: true,
				presenceStartupPolicyHostProfile: 'cheap_shared_host',
				presenceStartupPolicyServerContact: 'nominal',
				presenceStartupPolicySelectedInitialHeartbeatDelaySeconds: 1,
				presenceStartupPolicyCallsHeartbeatEndpointNow: false,
				presenceStartupPolicyWritesPresenceNow: false,
				presenceStartupPolicyStartsPollingNow: false,
				presenceStartupPolicyStartsTimerNow: false,
				presenceStartupPolicyCallsSave: false,
				presenceStartupPolicyChangesPostLock: false,
				presenceStartupPolicyClaimsAbsence: false,
				presenceStartupPolicyClaimsSaved: false,
				presenceStartupPolicyExposesRawContent: false,
				presenceStartupPolicyRawSessionKeyIncluded: false,
			},
		} );

		const { unmount } = render( <DistributedEditingStatusChrome /> );

		try {
			const presence = screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} );

			await waitFor( () =>
				expect( presence ).toHaveAttribute(
					'data-distributed-editing-presence-startup-heartbeat-runtime-status',
					'degraded_storage_setup_required'
				)
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-blocked-by-storage-readiness',
				'true'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-can-retry-after-install',
				'true'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-storage-ready',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-timer-active',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-calls-heartbeat-endpoint',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-writes-presence',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-freshness-indicator-state',
				'degraded'
			);
			expect(
				screen.getByText( 'Presence startup delayed' )
			).toBeVisible();
			expect(
				screen.getByText(
					'Presence storage setup is required before automatic startup presence can begin.'
				)
			).toBeVisible();

			await act( async () => {
				jest.advanceTimersByTime( 1000 );
				await Promise.resolve();
			} );

			expect(
				actions.__experimentalSendDistributedEditingPresenceHeartbeat
			).not.toHaveBeenCalled();
			expect(
				actions.__experimentalRefreshDistributedEditingPresenceSnapshot
			).not.toHaveBeenCalled();
			expect(
				actions.__experimentalSaveDistributedEditingRetryAfterProof
			).not.toHaveBeenCalled();
		} finally {
			unmount();
			jest.clearAllTimers();
			jest.useRealTimers();
		}
	} );

	it( 'summarizes current and delayed editor counts without stronger claims', () => {
		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
				},
			},
			sessionState: {
				presenceRosterEntries: [
					{
						key: 'presence-mira',
						displayName: 'Mira',
						freshness: 'current',
					},
					{
						key: 'presence-hidden',
						identityVisibility: 'anonymous',
						freshness: 'current',
						userId: 42,
						selection: { anchor: 9 },
					},
					{
						key: 'presence-sam',
						displayName: 'Sam',
						freshness: 'recent',
					},
				],
				presenceRosterHiddenCount: 1,
				presenceRosterTotalKnownCount: 4,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const presence = screen.getByRole( 'group', {
			name: 'Distributed editing presence',
		} );
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-current-count',
			'2'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-delayed-count',
			'1'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-hidden-count',
			'1'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-claims-absence',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-correctness-independent',
			'true'
		);
		expect(
			screen.queryByText(
				'2 editors are active now; 1 editor may be delayed. Some editor activity is hidden by roster limits or privacy settings.'
			)
		).not.toBeInTheDocument();
		expect(
			screen.getByText( '2 other editors are active now.' )
		).toBeVisible();
		const rowList = screen.getByRole( 'list', {
			name: 'Visible editors',
		} );
		const rows = within( rowList ).getAllByRole( 'listitem' );

		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-row-treatment',
			'compact-status-badges'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-row-treatment-accessible',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-row-treatment-calls-save',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-row-treatment-changes-post-lock',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-row-treatment-exposes-private-fields',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-row-visual-treatment',
			'subtle-status-stripe'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-row-visual-treatment-color-only',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-row-visual-treatment-content-free',
			'true'
		);
		expect( rows ).toHaveLength( 3 );
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-current',
			'true'
		);
		expect( rows[ 0 ] ).toHaveClass(
			'editor-distributed-editing-status__presence-roster-item--current'
		);
		expect( rows[ 1 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-current',
			'true'
		);
		expect( rows[ 2 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-current',
			'false'
		);
		expect( rows[ 2 ] ).toHaveClass(
			'editor-distributed-editing-status__presence-roster-item--delayed'
		);
		expect( rows[ 2 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-freshness',
			'delayed'
		);
		expect( rows[ 2 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-status-tone',
			'delayed'
		);
		expect( rows[ 2 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-status-affordance',
			'dot-and-label'
		);
		expect( rows[ 2 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-visual-treatment',
			'subtle-status-stripe'
		);
		expect( rows[ 2 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-visual-treatment-color-only',
			'false'
		);
		expect( rows[ 2 ] ).toHaveAttribute(
			'aria-label',
			'Sam, Presence may be delayed'
		);
		expect(
			screen.queryByText( /userId|anchor|selection/i )
		).not.toBeInTheDocument();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
	} );

	it( 'summarizes mixed local, duplicate-tab, current remote, and delayed remote rows', () => {
		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
				},
			},
			sessionState: {
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
				presenceRosterTotalKnownCount: 5,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const presence = screen.getByRole( 'group', {
			name: 'Distributed editing presence',
		} );
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-status',
			'recent'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-visible-count',
			'4'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-current-count',
			'2'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-delayed-count',
			'2'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-local-current-tab-visible',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-same-user-other-tab-visible',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-remote-current-count',
			'1'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-remote-delayed-count',
			'1'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-hidden-count',
			'1'
		);
		expect( presence ).not.toHaveTextContent(
			'Your presence may be delayed. You have this post open in another tab. Mira is also editing this post. Sam was here recently. Presence may be delayed.'
		);
		expect(
			screen.queryByText(
				'2 editors are active now; 2 editors may be delayed. Some editor activity is hidden by roster limits or privacy settings.'
			)
		).not.toBeInTheDocument();
		expect(
			screen.getByText( '1 other editor is active now.' )
		).toBeVisible();

		const rows = within(
			screen.getByRole( 'list', { name: 'Visible editors' } )
		).getAllByRole( 'listitem' );

		expect( rows ).toHaveLength( 4 );
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-current',
			'false'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'current_user_current_tab'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'aria-label',
			'This tab, Presence may be delayed'
		);
		expect( rows[ 1 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-current',
			'true'
		);
		expect( rows[ 1 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'same_user_other_tab'
		);
		expect( rows[ 1 ] ).toHaveAttribute(
			'aria-label',
			'Another tab, Active now'
		);
		expect( rows[ 2 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-current',
			'true'
		);
		expect( rows[ 2 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'other_user'
		);
		expect( rows[ 2 ] ).toHaveAttribute( 'aria-label', 'Mira, Active now' );
		expect( rows[ 3 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-current',
			'false'
		);
		expect( rows[ 3 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'other_user'
		);
		expect( rows[ 3 ] ).toHaveAttribute(
			'aria-label',
			'Sam, Presence may be delayed'
		);
		expect(
			screen.queryByText(
				/session_key|rawSessionKey|userId|cursor|selection/i
			)
		).not.toBeInTheDocument();
		expect(
			actions.__experimentalRefreshDistributedEditingPresenceSnapshot
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
	} );

	it( 'renders sustained remote freshness and anonymous labels without exposing hidden names', () => {
		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
				},
			},
			sessionState: {
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
						displayName: 'Hidden Current Name',
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
						displayName: 'Hidden Delayed Name',
						identityVisibility: 'anonymous',
						relationship: 'other_user',
						freshness: 'recent',
					},
				],
				presenceRosterExpiredCount: 2,
				presenceRosterTotalKnownCount: 8,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const presence = screen.getByRole( 'group', {
			name: 'Distributed editing presence',
		} );
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-status',
			'recent'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-visible-count',
			'6'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-current-count',
			'4'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-delayed-count',
			'2'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-remote-current-count',
			'2'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-remote-delayed-count',
			'2'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-expired-count',
			'2'
		);
		expect( presence ).not.toHaveTextContent(
			'You are visible in this editing session. You have this post open in another tab. Mira and Another editor are also editing this post. Sam and Another editor were here recently. Presence may be delayed.'
		);
		expect(
			screen.queryByText(
				'4 editors are active now; 2 editors may be delayed. Some editor activity expired before this refresh.'
			)
		).not.toBeInTheDocument();
		expect(
			screen.getByText( '2 other editors are active now.' )
		).toBeVisible();

		const rows = within(
			screen.getByRole( 'list', { name: 'Visible editors' } )
		).getAllByRole( 'listitem' );

		expect( rows ).toHaveLength( 6 );
		expect( rows[ 0 ] ).toHaveAttribute(
			'aria-label',
			'This tab, Active now'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'current_user_current_tab'
		);
		expect( rows[ 1 ] ).toHaveAttribute(
			'aria-label',
			'Another tab, Active now'
		);
		expect( rows[ 1 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'same_user_other_tab'
		);
		expect( rows[ 2 ] ).toHaveAttribute( 'aria-label', 'Mira, Active now' );
		expect( rows[ 3 ] ).toHaveAttribute(
			'aria-label',
			'Another editor, Active now'
		);
		expect( rows[ 4 ] ).toHaveAttribute(
			'aria-label',
			'Sam, Presence may be delayed'
		);
		expect( rows[ 5 ] ).toHaveAttribute(
			'aria-label',
			'Another editor, Presence may be delayed'
		);
		expect( screen.getAllByText( 'Another editor' ) ).toHaveLength( 2 );
		expect(
			screen.queryByText(
				/Hidden Current Name|Hidden Delayed Name|session_key|rawSessionKey|userId|cursor|selection/i
			)
		).not.toBeInTheDocument();
		expect(
			actions.__experimentalRefreshDistributedEditingPresenceSnapshot
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
	} );

	it( 'renders high-count roster summaries with hidden aggregate activity', () => {
		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
				},
			},
			sessionState: {
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
						displayName: 'Hidden High Count Current',
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
						displayName: 'Hidden High Count Delayed',
						identityVisibility: 'anonymous',
						relationship: 'other_user',
						freshness: 'recent',
					},
				],
				presenceRosterHiddenCount: 4,
				presenceRosterExpiredCount: 2,
				presenceRosterTotalKnownCount: 15,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const presence = screen.getByRole( 'group', {
			name: 'Distributed editing presence',
		} );
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-visible-count',
			'9'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-current-count',
			'6'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-delayed-count',
			'3'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-remote-current-count',
			'4'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-remote-delayed-count',
			'3'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-hidden-count',
			'4'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-expired-count',
			'2'
		);
		expect( presence ).not.toHaveTextContent(
			'You are visible in this editing session. You have this post open in another tab. Mira, Quinn, and 2 others are also editing this post. Sam, Priya, and 1 other were here recently. Presence may be delayed.'
		);
		expect(
			screen.queryByText(
				'6 editors are active now; 3 editors may be delayed. Some editor activity is hidden by roster limits or privacy settings. Some editor activity expired before this refresh.'
			)
		).not.toBeInTheDocument();
		expect(
			screen.getByText( '4 other editors are active now.' )
		).toBeVisible();

		const rows = within(
			screen.getByRole( 'list', { name: 'Visible editors' } )
		).getAllByRole( 'listitem' );

		expect( rows ).toHaveLength( 9 );
		expect( rows[ 4 ] ).toHaveAttribute(
			'aria-label',
			'Another editor, Active now'
		);
		expect( rows[ 8 ] ).toHaveAttribute(
			'aria-label',
			'Another editor, Presence may be delayed'
		);
		expect(
			screen.queryByText(
				/Hidden High Count|session_key|rawSessionKey|userId|cursor|selection/i
			)
		).not.toBeInTheDocument();
		expect(
			actions.__experimentalRefreshDistributedEditingPresenceSnapshot
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
	} );

	it( 'hydrates the enabled editor shell from initial WordPress presence settings', () => {
		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
					initialPresenceRoster: {
						status: 'recent',
						freshness: 'recent',
						serverContact: 'nominal',
						visibleCount: 1,
						totalKnownCount: 1,
						hiddenCount: 0,
						claimsAbsence: false,
						entries: [
							{
								key: 'presence-wp-lock-mira',
								displayName: 'Mira',
								identityVisibility: 'named',
								relationship: 'other_user',
								freshness: 'recent',
								source: 'wordpress_post_lock_snapshot',
								userId: 42,
								selection: { anchor: 9 },
							},
						],
					},
				},
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const presence = screen.getByRole( 'group', {
			name: 'Distributed editing presence',
		} );
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-status',
			'recent'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-visible-count',
			'1'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-current-count',
			'0'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-delayed-count',
			'1'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-claims-absence',
			'false'
		);
		expect(
			screen.queryByText(
				'Mira was here recently. Presence may be delayed.'
			)
		).not.toBeInTheDocument();
		expect(
			screen.getByText( '1 other editor may be delayed.' )
		).toBeVisible();
		const rows = within(
			screen.getByRole( 'list', { name: 'Visible editors' } )
		).getAllByRole( 'listitem' );

		expect( rows ).toHaveLength( 1 );
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-current',
			'false'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-freshness',
			'delayed'
		);
		expect( screen.getByText( 'Mira' ) ).toBeVisible();
		expect(
			screen.queryByText( /userId|anchor|selection/i )
		).not.toBeInTheDocument();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
	} );

	it( 'refreshes the presence roster on explicit user command with local feedback', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
					presenceStorageReadiness: {
						status: 'ready',
						tableExists: true,
						schemaCurrent: true,
						expectedStartupHeartbeatStatus: 'sent',
						setupRequired: false,
						diagnosticOnly: true,
						contentFree: true,
						callsSave: false,
						changesPostLock: false,
						claimsAbsence: false,
						claimsSaved: false,
						correctnessIndependentOfTransport: true,
						transportRequiredForCorrectness: false,
					},
				},
			},
			sessionState: {
				presenceRosterStatus: 'degraded',
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const presence = screen.getByRole( 'group', {
			name: 'Distributed editing presence',
		} );
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-refresh-command-status',
			'idle'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-actions-visible',
			'true'
		);

		await user.click(
			screen.getByRole( 'button', {
				name: 'Refresh editing list',
			} )
		);

		expect(
			actions.__experimentalRefreshDistributedEditingPresenceSnapshot
		).toHaveBeenCalledTimes( 1 );
		expect( await screen.findByRole( 'status' ) ).toHaveTextContent(
			'Editing list refreshed.'
		);
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			screen.queryByText( /userId|anchor|selection/i )
		).not.toBeInTheDocument();
	} );

	it( 'sends a one-shot presence heartbeat from production chrome with local feedback', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
				},
			},
			sessionState: {
				isConnectionDegraded: true,
				presenceRosterEntries: [
					{
						key: 'presence-local-heartbeat-current-tab',
						identityVisibility: 'self',
						relationship: 'current_user_current_tab',
						freshness: 'current',
					},
				],
				presenceRosterStatus: 'degraded',
				presenceHeartbeatStatus: 'sent',
				presenceHeartbeatCallsRestEndpoint: true,
				presenceHeartbeatRecordsPresenceHeartbeat: true,
				presenceHeartbeatWritesPresence: true,
				presenceHeartbeatCallsSave: false,
				presenceHeartbeatMutatesEditorContent: false,
				presenceHeartbeatChangesPostLock: false,
				presenceHeartbeatClaimsSaved: false,
				presenceHeartbeatRawSessionKeyIncluded: false,
				presenceHeartbeatMarksLocalEditorCurrent: true,
				presenceHeartbeatMarksLocalEditorDelayed: false,
				presenceHeartbeatLocalRosterEntryVisible: true,
				presenceHeartbeatLocalRosterEntryFreshness: 'current',
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const presence = screen.getByRole( 'group', {
			name: 'Distributed editing presence',
		} );
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-heartbeat-status',
			'sent'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-heartbeat-command-status',
			'idle'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-heartbeat-calls-rest',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-heartbeat-records-heartbeat',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-heartbeat-calls-save',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-heartbeat-changes-post-lock',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-heartbeat-claims-saved',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-heartbeat-raw-session-key',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-heartbeat-marks-local-editor-current',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-heartbeat-local-roster-entry-visible',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-heartbeat-local-roster-entry-freshness',
			'current'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-visible-count',
			'1'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-actions-visible',
			'true'
		);
		expect( presence ).toHaveTextContent(
			'Presence may be delayed. Save checks still use WordPress.'
		);
		expect(
			screen.getByRole( 'listitem', {
				name: 'This tab, Active now',
			} )
		).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Update my presence',
			} )
		);

		expect(
			actions.__experimentalSendDistributedEditingPresenceHeartbeat
		).toHaveBeenCalledTimes( 1 );
		expect( await screen.findByText( 'Presence updated.' ) ).toBeVisible();
		expect(
			actions.__experimentalRefreshDistributedEditingPresenceSnapshot
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			screen.queryByText( /session_key|rawSessionKey|userId|anchor/i )
		).not.toBeInTheDocument();
	} );

	it( 'downgrades the local heartbeat row when presence updates are delayed', () => {
		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
				},
			},
			sessionState: {
				presenceRosterEntries: [
					{
						key: 'presence-local-heartbeat-current-tab',
						identityVisibility: 'self',
						relationship: 'current_user_current_tab',
						freshness: 'recent',
					},
				],
				presenceHeartbeatStatus: 'storage_unavailable',
				presenceHeartbeatCallsRestEndpoint: true,
				presenceHeartbeatRecordsPresenceHeartbeat: false,
				presenceHeartbeatWritesPresence: false,
				presenceHeartbeatCallsSave: false,
				presenceHeartbeatMutatesEditorContent: false,
				presenceHeartbeatChangesPostLock: false,
				presenceHeartbeatClaimsSaved: false,
				presenceHeartbeatRawSessionKeyIncluded: false,
				presenceHeartbeatMarksLocalEditorCurrent: false,
				presenceHeartbeatMarksLocalEditorDelayed: true,
				presenceHeartbeatLocalRosterEntryVisible: true,
				presenceHeartbeatLocalRosterEntryFreshness: 'recent',
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const presence = screen.getByRole( 'group', {
			name: 'Distributed editing presence',
		} );

		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-status',
			'recent'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-current-count',
			'0'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-delayed-count',
			'1'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-heartbeat-marks-local-editor-current',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-heartbeat-marks-local-editor-delayed',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-heartbeat-local-roster-entry-freshness',
			'recent'
		);
		expect( presence ).toHaveTextContent( 'Your presence may be delayed.' );
		expect(
			screen.getByRole( 'listitem', {
				name: 'This tab, Presence may be delayed',
			} )
		).toBeVisible();
		expect(
			actions.__experimentalRefreshDistributedEditingPresenceSnapshot
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			screen.queryByText(
				/session_key|rawSessionKey|userId|cursor|selection/i
			)
		).not.toBeInTheDocument();
	} );

	it( 'exposes repeated presence cadence runtime status without starting commands', () => {
		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
				},
			},
			sessionState: {
				presenceRosterStatus: 'empty',
				presenceRepeatedRefreshRuntimeStatus:
					DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.PAUSED_DEGRADED_TRANSPORT,
				presenceRepeatedRefreshLocalConnectionState:
					DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.DEGRADED,
				presenceRepeatedRefreshExplicitOptIn: true,
				presenceRepeatedRefreshRuntimeEnabledByDefault: false,
				presenceRepeatedRefreshSelectedIntervalSeconds: 120,
				presenceRepeatedRefreshSelectedHeartbeatIntervalSeconds: 120,
				presenceRepeatedRefreshServerContact: 'degraded',
				presenceRepeatedRefreshSchedulesNextRefresh: false,
				presenceRepeatedRefreshSchedulesNextHeartbeat: false,
				presenceRepeatedRefreshCallsPresenceReadEndpointNow: false,
				presenceRepeatedRefreshCallsHeartbeatEndpointNow: false,
				presenceRepeatedRefreshStartsPollingImmediately: false,
				presenceRepeatedRefreshCallsSave: false,
				presenceRepeatedRefreshChangesPostLock: false,
				presenceRepeatedRefreshClaimsSaved: false,
				presenceRepeatedRefreshExposesRawContent: false,
				presenceRepeatedRefreshRawSessionKeyIncluded: false,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const presence = screen.getByRole( 'group', {
			name: 'Distributed editing presence',
		} );
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-repeated-refresh-status',
			DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.PAUSED_DEGRADED_TRANSPORT
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-repeated-refresh-local-connection-state',
			DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.DEGRADED
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-repeated-refresh-explicit-opt-in',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-repeated-refresh-runtime-enabled-by-default',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-repeated-refresh-selected-interval',
			'120'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-repeated-refresh-selected-heartbeat-interval',
			'120'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-repeated-refresh-schedules-next-refresh',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-repeated-refresh-schedules-next-heartbeat',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-repeated-refresh-calls-rest-now',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-repeated-refresh-calls-heartbeat-now',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-repeated-refresh-starts-polling',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-repeated-refresh-calls-save',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-repeated-refresh-changes-post-lock',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-repeated-refresh-claims-saved',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-repeated-refresh-exposes-raw-content',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-repeated-refresh-raw-session-key',
			'false'
		);
		expect(
			actions.__experimentalRefreshDistributedEditingPresenceSnapshot
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSendDistributedEditingPresenceHeartbeat
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			screen.queryByText(
				/session_key|rawSessionKey|userId|cursor|selection/i
			)
		).not.toBeInTheDocument();
	} );

	it( 'exposes initial presence startup policy and schedules the bounded startup heartbeat runtime', async () => {
		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
					presenceStorageReadiness: {
						status: 'ready',
						tableExists: true,
						schemaCurrent: true,
						expectedStartupHeartbeatStatus: 'sent',
						setupRequired: false,
						diagnosticOnly: true,
						contentFree: true,
						callsSave: false,
						changesPostLock: false,
						claimsAbsence: false,
						claimsSaved: false,
						correctnessIndependentOfTransport: true,
						transportRequiredForCorrectness: false,
					},
				},
			},
			sessionState: {
				presenceRosterStatus: 'empty',
				presenceStartupPolicyStatus:
					DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.SLOW_AUTOMATIC_HEARTBEAT_ALLOWED,
				presenceStartupPolicyReason: 'cheap_host_slow_startup_allowed',
				presenceStartupPolicyRequiresExplicitEnablement: true,
				presenceStartupPolicyMaySendInitialHeartbeatAutomatically: true,
				presenceStartupPolicySlowAutomaticHeartbeatAllowed: true,
				presenceStartupPolicyHostProfile: 'cheap_shared_host',
				presenceStartupPolicyServerContact: 'nominal',
				presenceStartupPolicySelectedInitialHeartbeatDelaySeconds: 120,
				presenceStartupPolicyCallsHeartbeatEndpointNow: false,
				presenceStartupPolicyWritesPresenceNow: false,
				presenceStartupPolicyStartsPollingNow: false,
				presenceStartupPolicyStartsTimerNow: false,
				presenceStartupPolicyCallsSave: false,
				presenceStartupPolicyChangesPostLock: false,
				presenceStartupPolicyClaimsAbsence: false,
				presenceStartupPolicyClaimsSaved: false,
				presenceStartupPolicyExposesRawContent: false,
				presenceStartupPolicyRawSessionKeyIncluded: false,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const presence = screen.getByRole( 'group', {
			name: 'Distributed editing presence',
		} );

		await waitFor( () =>
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-status',
				'scheduled'
			)
		);

		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-policy-status',
			DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.SLOW_AUTOMATIC_HEARTBEAT_ALLOWED
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-policy-reason',
			'cheap_host_slow_startup_allowed'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-policy-host-profile',
			'cheap_shared_host'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-policy-selected-delay',
			'120'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-policy-may-auto-heartbeat',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-policy-slow-auto-heartbeat',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-policy-calls-heartbeat-now',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-policy-writes-presence-now',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-policy-starts-polling-now',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-policy-starts-timer-now',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-heartbeat-runtime-delay-ms',
			'120000'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-heartbeat-runtime-timer-active',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-heartbeat-runtime-storage-ready',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-heartbeat-runtime-blocked-by-storage-readiness',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-heartbeat-runtime-calls-heartbeat-endpoint',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-heartbeat-runtime-calls-presence-read-endpoint',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-heartbeat-runtime-starts-polling',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-heartbeat-runtime-calls-save',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-heartbeat-runtime-changes-post-lock',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-heartbeat-runtime-mutates-editor-content',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-heartbeat-runtime-claims-saved',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-heartbeat-runtime-exposes-raw-content',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-heartbeat-runtime-raw-session-key',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-heartbeat-runtime-correctness-independent',
			'true'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-policy-calls-save',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-policy-changes-post-lock',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-policy-claims-saved',
			'false'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-startup-policy-visible',
			'false'
		);
		expect(
			screen.queryByText(
				'Initial presence may start automatically after about 120 seconds on cheap hosts.'
			)
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(
				'Initial presence will update after about 120 seconds.'
			)
		).not.toBeInTheDocument();
		expect(
			actions.__experimentalSendDistributedEditingPresenceHeartbeat
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingPresenceSnapshot
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
	} );

	it( 'runs the startup heartbeat once after the selected delay without polling or saving', async () => {
		jest.useFakeTimers();

		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
					presenceStorageReadiness: {
						status: 'ready',
						tableExists: true,
						schemaCurrent: true,
						expectedStartupHeartbeatStatus: 'sent',
						setupRequired: false,
						diagnosticOnly: true,
						contentFree: true,
						callsSave: false,
						changesPostLock: false,
						claimsAbsence: false,
						claimsSaved: false,
						correctnessIndependentOfTransport: true,
						transportRequiredForCorrectness: false,
					},
				},
			},
			sessionState: {
				presenceRosterStatus: 'empty',
				presenceStartupPolicyStatus:
					DISTRIBUTED_EDITING_PRESENCE_STARTUP_POLICY_STATUSES.SLOW_AUTOMATIC_HEARTBEAT_ALLOWED,
				presenceStartupPolicyReason: 'cheap_host_slow_startup_allowed',
				presenceStartupPolicyRequiresExplicitEnablement: true,
				presenceStartupPolicyMaySendInitialHeartbeatAutomatically: true,
				presenceStartupPolicySlowAutomaticHeartbeatAllowed: true,
				presenceStartupPolicyHostProfile: 'cheap_shared_host',
				presenceStartupPolicyServerContact: 'nominal',
				presenceStartupPolicySelectedInitialHeartbeatDelaySeconds: 1,
				presenceStartupPolicyCallsHeartbeatEndpointNow: false,
				presenceStartupPolicyWritesPresenceNow: false,
				presenceStartupPolicyStartsPollingNow: false,
				presenceStartupPolicyStartsTimerNow: false,
				presenceStartupPolicyCallsSave: false,
				presenceStartupPolicyChangesPostLock: false,
				presenceStartupPolicyClaimsAbsence: false,
				presenceStartupPolicyClaimsSaved: false,
				presenceStartupPolicyExposesRawContent: false,
				presenceStartupPolicyRawSessionKeyIncluded: false,
			},
		} );

		const { unmount } = render( <DistributedEditingStatusChrome /> );

		try {
			const presence = screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} );

			await act( async () => {
				await Promise.resolve();
			} );

			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-status',
				'scheduled'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-delay-ms',
				'1000'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-timer-active',
				'true'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-storage-ready',
				'true'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-blocked-by-storage-readiness',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-calls-presence-read-endpoint',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-starts-polling',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-calls-save',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-changes-post-lock',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-mutates-editor-content',
				'false'
			);
			expect(
				actions.__experimentalSendDistributedEditingPresenceHeartbeat
			).not.toHaveBeenCalled();
			expect(
				actions.__experimentalRefreshDistributedEditingPresenceSnapshot
			).not.toHaveBeenCalled();

			await act( async () => {
				jest.advanceTimersByTime( 1000 );
				await Promise.resolve();
				await Promise.resolve();
			} );

			expect(
				actions.__experimentalSendDistributedEditingPresenceHeartbeat
			).toHaveBeenCalledTimes( 1 );
			expect(
				actions.__experimentalRefreshDistributedEditingPresenceSnapshot
			).not.toHaveBeenCalled();
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-status',
				'sent'
			);

			await act( async () => {
				jest.advanceTimersByTime( 1000 );
				await Promise.resolve();
				await Promise.resolve();
			} );

			expect(
				actions.__experimentalRefreshDistributedEditingPresenceSnapshot
			).toHaveBeenCalledTimes( 1 );
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-refresh-command-status',
				'refreshed'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-timer-active',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-heartbeat-command-status',
				'sent'
			);
			expect(
				screen.queryByText( 'Editing list refreshed.' )
			).not.toBeInTheDocument();
			expect(
				screen.queryByText( 'Presence updated.' )
			).not.toBeInTheDocument();
			expect(
				actions.__experimentalSaveDistributedEditingRetryAfterProof
			).not.toHaveBeenCalled();
			expect(
				screen.queryByText(
					/session_key|rawSessionKey|userId|cursor|selection/i
				)
			).not.toBeInTheDocument();
		} finally {
			unmount();
			jest.clearAllTimers();
			jest.useRealTimers();
		}
	} );

	it( 'uses editor settings to start presence automatically without manual buttons', async () => {
		jest.useFakeTimers();

		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
					presenceStorageReadiness: {
						status: 'ready',
						tableExists: true,
						schemaCurrent: true,
						expectedStartupHeartbeatStatus: 'sent',
						setupRequired: false,
						diagnosticOnly: true,
						contentFree: true,
						callsSave: false,
						changesPostLock: false,
						claimsAbsence: false,
						claimsSaved: false,
						correctnessIndependentOfTransport: true,
						transportRequiredForCorrectness: false,
					},
					presenceStartupPolicy: {
						allowAutomaticInitialHeartbeat: true,
						allowSlowAutomaticInitialHeartbeat: true,
						hostProfile: 'cheap_shared_host',
						selectedInitialHeartbeatDelaySeconds: 3,
						cheapHostInitialHeartbeatDelaySeconds: 3,
						minimumInitialHeartbeatDelaySeconds: 3,
					},
					presenceRepeatedRefreshRuntime: {
						explicitOptIn: true,
						hostProfile: 'cheap_shared_host',
						standardPollingIntervalSeconds: 30,
						cheapHostPollingIntervalSeconds: 120,
						heartbeatIntervalSeconds: 120,
					},
				},
			},
			sessionState: {
				presenceRosterStatus: 'empty',
			},
		} );

		const { unmount } = render( <DistributedEditingStatusChrome /> );

		try {
			const presence = screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} );

			await act( async () => {
				await Promise.resolve();
			} );

			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-startup-heartbeat-runtime-status',
				'scheduled'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-repeated-refresh-scheduler-status',
				'scheduled'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-repeated-refresh-scheduler-delay-ms',
				'120000'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-actions-visible',
				'false'
			);
			expect(
				screen.queryByText( 'Editing list refreshed.' )
			).not.toBeInTheDocument();
			expect(
				screen.queryByText( 'Presence updated.' )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', {
					name: 'Refresh editing list',
				} )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', {
					name: 'Update my presence',
				} )
			).not.toBeInTheDocument();

			await act( async () => {
				jest.advanceTimersByTime( 3000 );
				await Promise.resolve();
				await Promise.resolve();
			} );

			expect(
				actions.__experimentalSendDistributedEditingPresenceHeartbeat
			).toHaveBeenCalledTimes( 1 );
			expect(
				actions.__experimentalRefreshDistributedEditingPresenceSnapshot
			).not.toHaveBeenCalled();

			await act( async () => {
				jest.advanceTimersByTime( 1000 );
				await Promise.resolve();
				await Promise.resolve();
			} );

			expect(
				actions.__experimentalRefreshDistributedEditingPresenceSnapshot
			).toHaveBeenCalledTimes( 1 );
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-refresh-command-status',
				'refreshed'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-actions-visible',
				'false'
			);
			expect(
				screen.queryByRole( 'button', {
					name: 'Refresh editing list',
				} )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', {
					name: 'Update my presence',
				} )
			).not.toBeInTheDocument();
			expect(
				actions.__experimentalSaveDistributedEditingRetryAfterProof
			).not.toHaveBeenCalled();
		} finally {
			unmount();
			jest.clearAllTimers();
			jest.useRealTimers();
		}
	} );

	it( 'runs an explicitly opted-in repeated presence cadence with fake timers', async () => {
		jest.useFakeTimers();

		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
				},
			},
			sessionState: {
				presenceRosterStatus: 'empty',
				presenceRepeatedRefreshRuntimeStatus:
					DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.SCHEDULED,
				presenceRepeatedRefreshLocalConnectionState:
					DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.CONNECTED,
				presenceRepeatedRefreshExplicitOptIn: true,
				presenceRepeatedRefreshRuntimeEnabledByDefault: false,
				presenceRepeatedRefreshSelectedIntervalSeconds: 1,
				presenceRepeatedRefreshSelectedHeartbeatIntervalSeconds: 1,
				presenceRepeatedRefreshSchedulesNextRefresh: true,
				presenceRepeatedRefreshSchedulesNextHeartbeat: true,
				presenceRepeatedRefreshCallsPresenceReadEndpointNow: false,
				presenceRepeatedRefreshCallsHeartbeatEndpointNow: false,
				presenceRepeatedRefreshStartsPollingImmediately: false,
				presenceRepeatedRefreshCallsSave: false,
				presenceRepeatedRefreshChangesPostLock: false,
				presenceRepeatedRefreshClaimsSaved: false,
				presenceRepeatedRefreshExposesRawContent: false,
				presenceRepeatedRefreshRawSessionKeyIncluded: false,
			},
		} );

		const { unmount } = render( <DistributedEditingStatusChrome /> );

		try {
			const presence = screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} );

			await act( async () => {
				await Promise.resolve();
			} );

			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-repeated-refresh-scheduler-status',
				'scheduled'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-repeated-refresh-scheduler-delay-ms',
				'1000'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-repeated-refresh-scheduler-timer-active',
				'true'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-freshness-indicator-state',
				'connected'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-freshness-indicator-correctness-independent',
				'true'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-freshness-indicator-claims-absence',
				'false'
			);
			expect(
				screen.queryByText( 'Presence connected' )
			).not.toBeInTheDocument();
			expect(
				screen.queryByText( 'Editing list updates about every second.' )
			).not.toBeInTheDocument();
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-repeated-refresh-scheduler-calls-save',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-repeated-refresh-scheduler-changes-post-lock',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-repeated-refresh-scheduler-mutates-editor-content',
				'false'
			);
			expect(
				actions.__experimentalRefreshDistributedEditingPresenceSnapshot
			).not.toHaveBeenCalled();
			expect(
				actions.__experimentalSendDistributedEditingPresenceHeartbeat
			).not.toHaveBeenCalled();

			await act( async () => {
				jest.advanceTimersByTime( 1000 );
				await Promise.resolve();
				await Promise.resolve();
			} );

			expect(
				actions.__experimentalRefreshDistributedEditingPresenceSnapshot
			).toHaveBeenCalled();
			expect(
				actions.__experimentalSendDistributedEditingPresenceHeartbeat
			).toHaveBeenCalled();
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-repeated-refresh-scheduler-tick-count',
				'1'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-refresh-command-status',
				'refreshed'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-heartbeat-command-status',
				'sent'
			);
			expect(
				actions.__experimentalSaveDistributedEditingRetryAfterProof
			).not.toHaveBeenCalled();
			expect(
				screen.queryByText(
					/session_key|rawSessionKey|userId|cursor|selection/i
				)
			).not.toBeInTheDocument();
		} finally {
			unmount();
			jest.clearAllTimers();
			jest.useRealTimers();
		}
	} );

	it( 'shows delayed presence freshness when repeated heartbeat degrades', async () => {
		jest.useFakeTimers();

		const actions = setupDistributedEditingStatusDispatch();
		actions.__experimentalSendDistributedEditingPresenceHeartbeat.mockRejectedValue(
			{
				code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_PRESENCE_STORAGE_UNAVAILABLE,
			}
		);
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
				},
			},
			sessionState: {
				presenceRosterStatus: 'empty',
				presenceRepeatedRefreshRuntimeStatus:
					DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.SCHEDULED,
				presenceRepeatedRefreshLocalConnectionState:
					DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.CONNECTED,
				presenceRepeatedRefreshExplicitOptIn: true,
				presenceRepeatedRefreshRuntimeEnabledByDefault: false,
				presenceRepeatedRefreshSelectedIntervalSeconds: 1,
				presenceRepeatedRefreshSelectedHeartbeatIntervalSeconds: 1,
				presenceRepeatedRefreshSchedulesNextRefresh: true,
				presenceRepeatedRefreshSchedulesNextHeartbeat: true,
				presenceRepeatedRefreshCallsSave: false,
				presenceRepeatedRefreshChangesPostLock: false,
				presenceRepeatedRefreshClaimsSaved: false,
				presenceRepeatedRefreshExposesRawContent: false,
				presenceRepeatedRefreshRawSessionKeyIncluded: false,
			},
		} );

		const { unmount } = render( <DistributedEditingStatusChrome /> );

		try {
			const presence = screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} );

			await waitFor( () =>
				expect( presence ).toHaveAttribute(
					'data-distributed-editing-presence-repeated-refresh-scheduler-status',
					'scheduled'
				)
			);

			await act( async () => {
				jest.advanceTimersByTime( 1000 );
				await Promise.resolve();
				await Promise.resolve();
			} );

			await waitFor( () =>
				expect( presence ).toHaveAttribute(
					'data-distributed-editing-presence-heartbeat-command-status',
					'degraded'
				)
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-freshness-indicator-state',
				'delayed'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-freshness-indicator-calls-save',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-freshness-indicator-changes-post-lock',
				'false'
			);
			expect(
				screen.getByText( 'Presence may be delayed' )
			).toBeVisible();
			expect(
				screen.getByText(
					'Editing can continue. The editing list may update late.'
				)
			).toBeVisible();
			expect(
				actions.__experimentalSaveDistributedEditingRetryAfterProof
			).not.toHaveBeenCalled();
			expect(
				screen.queryByText(
					/session_key|rawSessionKey|userId|cursor|selection/i
				)
			).not.toBeInTheDocument();
		} finally {
			unmount();
			jest.clearAllTimers();
			jest.useRealTimers();
		}
	} );

	it( 'keeps the local roster row visible as delayed when repeated heartbeat storage disappears', async () => {
		jest.useFakeTimers();

		let sessionState = {
			presenceRosterEntries: [
				{
					key: 'presence-local-heartbeat-current-tab',
					identityVisibility: 'self',
					relationship: 'current_user_current_tab',
					freshness: 'current',
				},
			],
			presenceRepeatedRefreshRuntimeStatus:
				DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.SCHEDULED,
			presenceRepeatedRefreshLocalConnectionState:
				DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.CONNECTED,
			presenceRepeatedRefreshExplicitOptIn: true,
			presenceRepeatedRefreshRuntimeEnabledByDefault: false,
			presenceRepeatedRefreshSelectedIntervalSeconds: 1,
			presenceRepeatedRefreshSelectedHeartbeatIntervalSeconds: 1,
			presenceRepeatedRefreshSchedulesNextRefresh: true,
			presenceRepeatedRefreshSchedulesNextHeartbeat: true,
			presenceRepeatedRefreshCallsSave: false,
			presenceRepeatedRefreshChangesPostLock: false,
			presenceRepeatedRefreshClaimsSaved: false,
			presenceRepeatedRefreshExposesRawContent: false,
			presenceRepeatedRefreshRawSessionKeyIncluded: false,
		};
		const actions = setupDistributedEditingStatusDispatch();
		const error = {
			code: DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_PRESENCE_STORAGE_UNAVAILABLE,
			message: 'Presence storage is unavailable.',
			data: {
				result: 'presence_storage_unavailable',
				status: 503,
				records_presence_heartbeat: false,
				writes_presence: false,
			},
		};

		actions.__experimentalSendDistributedEditingPresenceHeartbeat.mockImplementation(
			async () => {
				sessionState =
					getDistributedEditingSessionStateForPresenceHeartbeatResult(
						error,
						sessionState
					);
				throw error;
			}
		);
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getCurrentPost: () => ( { id: 1, type: 'post' } ),
				getDistributedEditingSessionState: () => sessionState,
				getDistributedEditingNoticeDescriptors: () =>
					getDistributedEditingNoticeDescriptorsForSessionState(
						sessionState
					),
				getDistributedEditingUnloadWarningState: () =>
					getDistributedEditingUnloadWarningStateForSessionState(
						sessionState
					),
				getEditedPostContent: () => '',
				getEditorSettings: () => ( {
					distributedEditing: {
						enabled: true,
					},
				} ),
			} ) )
		);

		const { rerender, unmount } = render(
			<DistributedEditingStatusChrome />
		);

		try {
			const presence = screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} );

			await waitFor( () =>
				expect( presence ).toHaveAttribute(
					'data-distributed-editing-presence-repeated-refresh-scheduler-status',
					'scheduled'
				)
			);

			await act( async () => {
				jest.advanceTimersByTime( 1000 );
				await Promise.resolve();
				await Promise.resolve();
			} );

			await waitFor( () =>
				expect( presence ).toHaveAttribute(
					'data-distributed-editing-presence-heartbeat-command-status',
					'degraded'
				)
			);
			rerender( <DistributedEditingStatusChrome /> );
			expect( sessionState ).toMatchObject( {
				presenceHeartbeatMarksLocalEditorCurrent: false,
				presenceHeartbeatMarksLocalEditorDelayed: true,
				presenceHeartbeatLocalRosterEntryVisible: true,
				presenceHeartbeatLocalRosterEntryFreshness: 'recent',
				presenceRosterStatus: 'recent',
				presenceRosterVisibleCount: 1,
				presenceRosterEntries: [
					{
						relationship: 'current_user_current_tab',
						freshness: 'recent',
					},
				],
			} );
			expect( presence ).toHaveTextContent(
				'Your presence may be delayed.'
			);
			expect(
				screen.getAllByText( 'Presence may be delayed' )[ 0 ]
			).toBeVisible();
			expect(
				actions.__experimentalSaveDistributedEditingRetryAfterProof
			).not.toHaveBeenCalled();
			expect(
				screen.queryByText(
					/session_key|rawSessionKey|userId|cursor|selection/i
				)
			).not.toBeInTheDocument();
		} finally {
			unmount();
			jest.clearAllTimers();
			jest.useRealTimers();
		}
	} );

	it( 'surfaces expired-only roster evidence during a repeated presence refresh and separates the later heartbeat confirmation', async () => {
		jest.useFakeTimers();

		let releaseHeartbeat;
		let sessionState = {
			presenceRosterStatus: 'empty',
			presenceRepeatedRefreshRuntimeStatus:
				DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.SCHEDULED,
			presenceRepeatedRefreshLocalConnectionState:
				DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.CONNECTED,
			presenceRepeatedRefreshExplicitOptIn: true,
			presenceRepeatedRefreshRuntimeEnabledByDefault: false,
			presenceRepeatedRefreshSelectedIntervalSeconds: 1,
			presenceRepeatedRefreshSelectedHeartbeatIntervalSeconds: 1,
			presenceRepeatedRefreshSchedulesNextRefresh: true,
			presenceRepeatedRefreshSchedulesNextHeartbeat: true,
			presenceRepeatedRefreshCallsSave: false,
			presenceRepeatedRefreshChangesPostLock: false,
			presenceRepeatedRefreshClaimsSaved: false,
			presenceRepeatedRefreshExposesRawContent: false,
			presenceRepeatedRefreshRawSessionKeyIncluded: false,
		};
		const actions = setupDistributedEditingStatusDispatch();
		const expiredOnlySnapshot = {
			result: 'presence_roster_snapshot',
			presenceRoster: {
				status: 'recent',
				freshness: 'recent',
				serverContact: 'nominal',
				visibleCount: 0,
				totalKnownCount: 2,
				hiddenCount: 0,
				expiredCount: 2,
				source: 'de_rtc_presence_storage',
				storageBacked: true,
				entries: [],
			},
			presenceReadContract: {
				cheapHostPollingGuidance: {
					repeatedClientRefreshEnabledNow: false,
				},
			},
		};

		actions.__experimentalRefreshDistributedEditingPresenceSnapshot.mockImplementation(
			async () => {
				sessionState =
					getDistributedEditingSessionStateForPresenceSnapshotRefreshResult(
						expiredOnlySnapshot,
						sessionState
					);

				return expiredOnlySnapshot;
			}
		);
		actions.__experimentalSendDistributedEditingPresenceHeartbeat.mockImplementation(
			() =>
				new Promise( ( resolve ) => {
					releaseHeartbeat = () => {
						const response = {
							result: 'presence_heartbeat_recorded',
						};

						sessionState =
							getDistributedEditingSessionStateForPresenceHeartbeatResult(
								response,
								sessionState
							);
						resolve( response );
					};
				} )
		);
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getCurrentPost: () => ( { id: 1, type: 'post' } ),
				getDistributedEditingSessionState: () => sessionState,
				getDistributedEditingNoticeDescriptors: () =>
					getDistributedEditingNoticeDescriptorsForSessionState(
						sessionState
					),
				getDistributedEditingUnloadWarningState: () =>
					getDistributedEditingUnloadWarningStateForSessionState(
						sessionState
					),
				getEditedPostContent: () => '',
				getEditorSettings: () => ( {
					distributedEditing: {
						enabled: true,
					},
				} ),
			} ) )
		);

		const { rerender, unmount } = render(
			<DistributedEditingStatusChrome />
		);

		try {
			const presence = screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} );

			await waitFor( () =>
				expect( presence ).toHaveAttribute(
					'data-distributed-editing-presence-repeated-refresh-scheduler-status',
					'scheduled'
				)
			);

			await act( async () => {
				jest.advanceTimersByTime( 1000 );
				await Promise.resolve();
				await Promise.resolve();
			} );
			rerender( <DistributedEditingStatusChrome /> );

			await waitFor( () =>
				expect( presence ).toHaveAttribute(
					'data-distributed-editing-presence-refresh-command-status',
					'refreshed'
				)
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-heartbeat-command-status',
				'sending'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-status',
				'recent'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-visible-count',
				'0'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-summary-expired-count',
				'2'
			);
			expect( presence ).toHaveTextContent(
				'Editor activity was seen before this refresh. Presence may be delayed.'
			);
			expect( presence ).not.toHaveTextContent(
				'Some editor activity expired before this refresh.'
			);
			expect( presence ).not.toHaveTextContent(
				'No other editors shown.'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-claims-absence',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-repeated-refresh-scheduler-calls-save',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-repeated-refresh-scheduler-changes-post-lock',
				'false'
			);
			expect(
				actions.__experimentalSaveDistributedEditingRetryAfterProof
			).not.toHaveBeenCalled();
			expect(
				screen.queryByText(
					/session_key|rawSessionKey|userId|cursor|selection/i
				)
			).not.toBeInTheDocument();

			await act( async () => {
				releaseHeartbeat();
				await Promise.resolve();
				await Promise.resolve();
			} );
			rerender( <DistributedEditingStatusChrome /> );

			await waitFor( () =>
				expect( presence ).toHaveAttribute(
					'data-distributed-editing-presence-heartbeat-command-status',
					'sent'
				)
			);
			expect( sessionState ).toMatchObject( {
				presenceHeartbeatMarksLocalEditorCurrent: true,
				presenceHeartbeatMarksLocalEditorDelayed: false,
				presenceHeartbeatLocalRosterEntryVisible: true,
				presenceHeartbeatLocalRosterEntryFreshness: 'current',
				presenceRosterStatus: 'active',
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
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-status',
				'active'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-visible-count',
				'1'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-summary-current-count',
				'1'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-summary-expired-count',
				'2'
			);
			expect( presence ).toHaveTextContent(
				'You are visible in this editing session.'
			);
			expect( presence ).not.toHaveTextContent(
				'1 editor is active now. Some editor activity expired before this refresh.'
			);
			expect( presence ).not.toHaveTextContent(
				'Expired Repeated Browser'
			);
			expect( presence ).not.toHaveTextContent(
				'No other editors shown.'
			);
		} finally {
			unmount();
			jest.clearAllTimers();
			jest.useRealTimers();
		}
	} );

	it( 'cancels a scheduled repeated presence cadence after transport degrades', async () => {
		jest.useFakeTimers();

		const actions = setupDistributedEditingStatusDispatch();
		const editorSettings = {
			distributedEditing: {
				enabled: true,
			},
		};
		let sessionState = {
			presenceRosterStatus: 'empty',
			presenceRepeatedRefreshRuntimeStatus:
				DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.SCHEDULED,
			presenceRepeatedRefreshLocalConnectionState:
				DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.CONNECTED,
			presenceRepeatedRefreshExplicitOptIn: true,
			presenceRepeatedRefreshRuntimeEnabledByDefault: false,
			presenceRepeatedRefreshSelectedIntervalSeconds: 1,
			presenceRepeatedRefreshSelectedHeartbeatIntervalSeconds: 1,
			presenceRepeatedRefreshSchedulesNextRefresh: true,
			presenceRepeatedRefreshSchedulesNextHeartbeat: true,
			presenceRepeatedRefreshCallsSave: false,
			presenceRepeatedRefreshChangesPostLock: false,
			presenceRepeatedRefreshClaimsSaved: false,
			presenceRepeatedRefreshExposesRawContent: false,
			presenceRepeatedRefreshRawSessionKeyIncluded: false,
		};

		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getCurrentPost: () => ( { id: 1, type: 'post' } ),
				getDistributedEditingSessionState: () => sessionState,
				getDistributedEditingNoticeDescriptors: () =>
					getDistributedEditingNoticeDescriptorsForSessionState(
						sessionState
					),
				getDistributedEditingUnloadWarningState: () =>
					getDistributedEditingUnloadWarningStateForSessionState(
						sessionState
					),
				getEditedPostContent: () => '',
				getEditorSettings: () => editorSettings,
			} ) )
		);

		const { rerender, unmount } = render(
			<DistributedEditingStatusChrome />
		);

		try {
			const presence = screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} );

			await waitFor( () =>
				expect( presence ).toHaveAttribute(
					'data-distributed-editing-presence-repeated-refresh-scheduler-status',
					'scheduled'
				)
			);

			sessionState = {
				...sessionState,
				presenceRepeatedRefreshRuntimeStatus:
					DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.PAUSED_DEGRADED_TRANSPORT,
				presenceRepeatedRefreshLocalConnectionState:
					DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.DEGRADED,
				presenceRepeatedRefreshServerContact: 'degraded',
				presenceRepeatedRefreshSchedulesNextRefresh: false,
				presenceRepeatedRefreshSchedulesNextHeartbeat: false,
			};
			rerender( <DistributedEditingStatusChrome /> );

			await waitFor( () =>
				expect( presence ).toHaveAttribute(
					'data-distributed-editing-presence-repeated-refresh-scheduler-status',
					'paused'
				)
			);

			await act( async () => {
				jest.advanceTimersByTime( 1000 );
				await Promise.resolve();
				await Promise.resolve();
			} );

			expect(
				actions.__experimentalRefreshDistributedEditingPresenceSnapshot
			).not.toHaveBeenCalled();
			expect(
				actions.__experimentalSendDistributedEditingPresenceHeartbeat
			).not.toHaveBeenCalled();
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-repeated-refresh-scheduler-tick-count',
				'0'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-freshness-indicator-state',
				'paused'
			);
			expect(
				actions.__experimentalSaveDistributedEditingRetryAfterProof
			).not.toHaveBeenCalled();
		} finally {
			unmount();
			jest.clearAllTimers();
			jest.useRealTimers();
		}
	} );

	it( 'does not run the repeated presence cadence while transport is degraded', async () => {
		jest.useFakeTimers();

		const actions = setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
				},
			},
			sessionState: {
				presenceRosterStatus: 'empty',
				presenceRepeatedRefreshRuntimeStatus:
					DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_RUNTIME_STATUSES.PAUSED_DEGRADED_TRANSPORT,
				presenceRepeatedRefreshLocalConnectionState:
					DISTRIBUTED_EDITING_PRESENCE_REPEATED_REFRESH_CONNECTION_STATES.DEGRADED,
				presenceRepeatedRefreshExplicitOptIn: true,
				presenceRepeatedRefreshServerContact: 'degraded',
				presenceRepeatedRefreshSelectedIntervalSeconds: 1,
				presenceRepeatedRefreshSelectedHeartbeatIntervalSeconds: 1,
				presenceRepeatedRefreshSchedulesNextRefresh: false,
				presenceRepeatedRefreshSchedulesNextHeartbeat: false,
			},
		} );

		const { unmount } = render( <DistributedEditingStatusChrome /> );

		try {
			const presence = screen.getByRole( 'group', {
				name: 'Distributed editing presence',
			} );

			await waitFor( () =>
				expect( presence ).toHaveAttribute(
					'data-distributed-editing-presence-repeated-refresh-scheduler-status',
					'paused'
				)
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-repeated-refresh-scheduler-timer-active',
				'false'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-freshness-indicator-state',
				'paused'
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-freshness-indicator-claims-saved',
				'false'
			);
			expect(
				screen.getByText( 'Presence updates paused' )
			).toBeVisible();
			expect(
				screen.getByText(
					'Server contact is degraded. Editing can continue; saves do not depend on presence.'
				)
			).toBeVisible();

			await act( async () => {
				jest.advanceTimersByTime( 5000 );
				await Promise.resolve();
			} );

			expect(
				actions.__experimentalRefreshDistributedEditingPresenceSnapshot
			).not.toHaveBeenCalled();
			expect(
				actions.__experimentalSendDistributedEditingPresenceHeartbeat
			).not.toHaveBeenCalled();
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-repeated-refresh-scheduler-tick-count',
				'0'
			);
			expect(
				actions.__experimentalSaveDistributedEditingRetryAfterProof
			).not.toHaveBeenCalled();
		} finally {
			unmount();
			jest.clearAllTimers();
			jest.useRealTimers();
		}
	} );

	it( 'reports fresh-review jump inspection status from production chrome without saving', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			sessionState: {
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
				localUpdatesImportFreshReviewDecisionStatus:
					DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.AWAITING_REVIEW,
				localUpdatesImportFreshReviewDecisionPanelRequired: true,
				localUpdatesImportFreshReviewDecisionItems: [
					{
						id: 'fresh-review-chrome-jump',
						blockClientId: 'fresh-review-chrome-jump-client',
						blockLabel: 'Chrome jump HTML change',
						baseContentHash:
							'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
						proposedContentHash:
							'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
						rawBlockContent:
							'<script>fresh-review-chrome-jump-raw</script>',
					},
				],
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		expect(
			screen.getByRole( 'group', {
				name: 'Distributed editing fresh review jump status',
			} )
		).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Inspect jump target for Chrome jump HTML change',
			} )
		);

		expect(
			screen.getByText(
				'Jump target checked. The editor found a block target for this review item; no block was selected, no focus moved, and no save was made.'
			)
		).toBeVisible();
		expect(
			actions.__experimentalResolveDistributedEditingFreshReviewDecisionItem
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSubmitDistributedEditingFreshReviewDecision
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRequestDistributedEditingFreshReviewForImportedLocalUpdates
		).not.toHaveBeenCalled();
		expect(
			screen.queryByText( /fresh-review-chrome-jump-raw|script/i )
		).not.toBeInTheDocument();
	} );

	it( 'reports fresh-review compare inspection status from production chrome without saving', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			sessionState: {
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
				localUpdatesImportFreshReviewDecisionStatus:
					DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.AWAITING_REVIEW,
				localUpdatesImportFreshReviewDecisionPanelRequired: true,
				localUpdatesImportFreshReviewDecisionItems: [
					{
						id: 'fresh-review-chrome-compare',
						blockClientId: 'fresh-review-chrome-compare-client',
						blockName: 'core/paragraph',
						blockLabel: 'Chrome compare paragraph change',
						baseContentHash:
							'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
						proposedContentHash:
							'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
						baseSerializedBlock:
							'<!-- wp:paragraph --><p>Original chrome comparison text.</p><!-- /wp:paragraph -->',
						proposedSerializedBlock:
							'<!-- wp:paragraph --><p>Updated chrome comparison text.</p><!-- /wp:paragraph -->',
						privacyClass: 'synthetic-content',
					},
				],
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		expect(
			screen.getByRole( 'group', {
				name: 'Distributed editing fresh review compare status',
			} )
		).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Inspect compare evidence for Chrome compare paragraph change',
			} )
		);

		expect(
			screen.getByText(
				'Read-only comparison opened. The editor shows safe base and proposed block text below; no content changed, no save was made, and no server request was sent.'
			)
		).toBeVisible();
		const comparisonSurface = screen.getByRole( 'group', {
			name: 'Distributed editing fresh review comparison for Chrome compare paragraph change',
		} );
		expect( comparisonSurface ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-surface-status',
			'open'
		);
		expect( comparisonSurface ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-surface-mode',
			'read_only_side_by_side_block_review'
		);
		expect( comparisonSurface ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-surface-read-only',
			'true'
		);
		expect( comparisonSurface ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-surface-calls-rest',
			'false'
		);
		expect( comparisonSurface ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-surface-calls-save',
			'false'
		);
		expect( comparisonSurface ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-surface-mutates-editor-content',
			'false'
		);
		expect( comparisonSurface ).toHaveTextContent(
			'Original chrome comparison text.'
		);
		expect( comparisonSurface ).toHaveTextContent(
			'Updated chrome comparison text.'
		);
		expect(
			actions.__experimentalResolveDistributedEditingFreshReviewDecisionItem
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSubmitDistributedEditingFreshReviewDecision
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRequestDistributedEditingFreshReviewForImportedLocalUpdates
		).not.toHaveBeenCalled();
		expect(
			screen.queryByText( /fresh-review-chrome-compare-raw|script/i )
		).not.toBeInTheDocument();
	} );

	it( 'describes the fresh-review compare plan without opening a comparison', () => {
		const actions = setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			sessionState: {
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
				localUpdatesImportFreshReviewDecisionStatus:
					DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.AWAITING_REVIEW,
				localUpdatesImportFreshReviewDecisionPanelRequired: true,
				localUpdatesImportFreshReviewDecisionItems: [
					{
						id: 'fresh-review-chrome-compare-plan',
						blockClientId:
							'fresh-review-chrome-compare-plan-client',
						blockLabel: 'Chrome compare plan HTML change',
						baseContentHash:
							'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
						proposedContentHash:
							'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
						rawBlockContent:
							'<script>fresh-review-chrome-compare-plan-raw</script>',
					},
				],
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const comparePlan = screen.getByRole( 'group', {
			name: 'Distributed editing fresh review compare plan',
		} );
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-compare-plan-status',
			'ready'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-compare-plan-base-hash-evidence',
			'true'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-compare-plan-proposed-hash-evidence',
			'true'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-compare-plan-review-hash-evidence',
			'true'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-compare-plan-renders-diff',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-compare-plan-opens-comparison',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-compare-plan-calls-rest',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-compare-plan-calls-save',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-readiness-status',
			'ready_to_select'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-readiness-can-select',
			'true'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-readiness-selects-block',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-readiness-moves-focus',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-readiness-opens-panel',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-readiness-opens-comparison',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-status',
			'disabled_until_renderer_turn'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-renderable',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-renders-preview',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-computes-diff',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-opens-panel',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-opens-comparison',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-selects-block',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-moves-focus',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-calls-rest',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-calls-save',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-report-status',
			'available'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-report-shareable',
			'true'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-report-export-ready',
			'true'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-report-missing-renderer-pieces',
			'2'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-report-raw-content',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-report-hash-values',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-report-renders-preview',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-report-computes-diff',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-report-calls-rest',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-preview-shell-report-calls-save',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-readiness-status',
			'disabled_until_renderer_capabilities_registered'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-readiness-registration-status',
			'not_registered'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-readiness-capability-status',
			'missing_required_capabilities'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-status',
			'missing_required_capabilities'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-reason',
			'missing_all_required_capabilities'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-present-capabilities',
			'0'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-missing-capabilities',
			'2'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-unknown-candidates',
			'0'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-complete',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-resolver-only',
			'true'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-candidate-map-stored',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-registers-renderer',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-resolution-renderable',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-status',
			'available'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-resolution-count',
			'1'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-missing-count',
			'1'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-partial-count',
			'0'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-complete-count',
			'0'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-unknown-candidates',
			'0'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-candidate-maps-stored',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-unknown-names',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-renderer-code',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-resolver-only',
			'true'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-raw-content',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-capability-support-summary-renderable',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-readiness-missing-capabilities',
			'2'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-readiness-registers-renderer',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-readiness-has-registered-renderer',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-readiness-renderable',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-readiness-renders-preview',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-readiness-computes-diff',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-readiness-opens-panel',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-readiness-calls-rest',
			'false'
		);
		expect( comparePlan ).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-renderer-readiness-calls-save',
			'false'
		);
		expect( comparePlan ).toHaveTextContent( 'Compare plan ready' );
		expect( comparePlan ).toHaveTextContent(
			'A future comparison can use base and proposed hash evidence for this review item.'
		);
		expect( comparePlan ).toHaveTextContent(
			'No comparison is open, no content is shown, and no save was made.'
		);
		expect( comparePlan ).toHaveTextContent(
			'This review item is ready for a future side-by-side comparison surface.'
		);
		expect( comparePlan ).toHaveTextContent(
			'No block is selected, no focus moves, no panel opens, and no save was made.'
		);
		expect( comparePlan ).toHaveTextContent(
			'A future preview shell would need base and proposed block content, a boundary-safe diff renderer, and review controls.'
		);
		expect( comparePlan ).toHaveTextContent(
			'The shell is disabled; no preview is rendered, no diff is computed, no panel opens, and no save was made.'
		);
		expect( comparePlan ).toHaveTextContent(
			'Support report available: renderer registration and review controls are not present yet.'
		);
		expect( comparePlan ).toHaveTextContent(
			'It records item identity, boundary policy, and requirement keys only; no raw content, hashes, proof details, or user identity are included.'
		);
		expect( comparePlan ).toHaveTextContent(
			'Renderer readiness: boundary-safe diff rendering and review controls must be registered before this preview shell can render.'
		);
		expect( comparePlan ).toHaveTextContent(
			'No renderer is registered, no preview opens, no diff is computed, and no save was made.'
		);
		expect( comparePlan ).toHaveTextContent(
			'Capability resolver: no required renderer capabilities are present in the candidate map.'
		);
		expect( comparePlan ).toHaveTextContent(
			'This only classifies readiness; no renderer is registered, no preview opens, no diff is computed, and no save was made.'
		);
		expect( comparePlan ).toHaveTextContent(
			'Capability support summary: renderer capability classifications are aggregated for support without candidate maps, unknown key names, raw content, hashes, proof details, tokens, identities, or renderer code.'
		);
		expect( comparePlan ).toHaveTextContent(
			/Base hash evidence\s*Available/
		);
		expect( comparePlan ).toHaveTextContent(
			/Proposed hash evidence\s*Available/
		);
		expect( comparePlan ).toHaveTextContent(
			/Reviewed hash evidence\s*Available/
		);
		expect( comparePlan ).toHaveTextContent(
			/Comparison readiness\s*Available/
		);
		expect( comparePlan ).toHaveTextContent( /Preview shell\s*Disabled/ );
		expect( comparePlan ).toHaveTextContent(
			/Preview shell support report\s*Available/
		);
		expect( comparePlan ).toHaveTextContent(
			/Renderer readiness\s*Not registered/
		);
		expect( comparePlan ).toHaveTextContent(
			/Capability resolver\s*Missing/
		);
		expect( comparePlan ).toHaveTextContent(
			/Capability support summary\s*Shareable/
		);
		expect( comparePlan ).not.toHaveTextContent(
			/aaaaaaaaaaaaaaaa|bbbbbbbbbbbbbbbb|fresh-review-chrome-compare-plan-raw|script/i
		);
		expect(
			actions.__experimentalResolveDistributedEditingFreshReviewDecisionItem
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSubmitDistributedEditingFreshReviewDecision
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRequestDistributedEditingFreshReviewForImportedLocalUpdates
		).not.toHaveBeenCalled();
	} );

	it( 'updates the enabled editor shell for protected degraded state', () => {
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
				},
			},
			sessionState: {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
				isConnectionDegraded: true,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const shell = screen.getByRole( 'region', {
			name: 'Distributed editing enabled status',
		} );
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-server-contact',
			'degraded'
		);
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-local-protection',
			'protected'
		);
		expect(
			screen.queryByText(
				'Updates may be delayed. Local changes remain protected and exportable.'
			)
		).not.toBeInTheDocument();
		expect( screen.getByText( 'Editing together delayed' ) ).toBeVisible();
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-human-loop-step',
			'local_changes_protected'
		);
		expect(
			screen.queryByText( 'Local changes protected' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Save keeps changes protected' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(
				'You can keep editing. If you use Save, keep this tab open until WordPress confirms the update.'
			)
		).not.toBeInTheDocument();
		expect(
			screen.getByText( 'Save checks WordPress before updating.' )
		).toBeVisible();
		expect( screen.getByText( 'Changes pending' ) ).toBeVisible();
	} );

	it( 'summarizes review-required Save state in the enabled editor shell', () => {
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
				},
			},
			sessionState: {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
				riskyBlockReviewStatus: 'review_required',
				riskyBlockReviewHasPendingItems: true,
				riskyBlockReviewItemCount: 1,
				riskyBlockReviewPendingCount: 1,
				riskyBlockReviewSaveButtonLabel: 'Review changes',
				riskyBlockReviewSaveClickAction: 'open_pre_publish_review',
				riskyBlockReviewCanExportLocalUpdates: true,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const shell = screen.getByRole( 'region', {
			name: 'Distributed editing enabled status',
		} );
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-save-state',
			'review_required'
		);
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-save-action',
			'open_pre_publish_review'
		);
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-authority-state',
			'review_required_before_update'
		);
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-human-loop-step',
			'review_changes'
		);
		expect( shell ).toHaveAttribute(
			'data-distributed-editing-human-loop-action',
			'review_changes'
		);
		expect(
			screen.queryByText(
				'The authoritative WordPress post cannot be updated until risky changes are approved or removed.'
			)
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Review changes' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Save opens review' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(
				'Save will open review before WordPress updates the post.'
			)
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(
				'Review highlighted changes before WordPress updates the post.'
			)
		).not.toBeInTheDocument();
		expect(
			screen.getByText( 'Review changes before Save.' )
		).toBeVisible();
		// eslint-disable-next-line testing-library/no-node-access
		const saveJourney = shell.querySelector(
			'[data-distributed-editing-save-journey-status]'
		);
		expect( saveJourney ).toHaveAttribute(
			'data-distributed-editing-save-journey-status',
			'review_changes'
		);
		expect( saveJourney ).toHaveAttribute(
			'data-distributed-editing-save-journey-status-summary',
			'Protected local changes need review before the authoritative post can update.'
		);
		expect( saveJourney ).toHaveAttribute(
			'data-distributed-editing-save-journey-authority-state',
			'review_required_before_update'
		);
		expect( saveJourney ).toHaveAttribute(
			'data-distributed-editing-save-journey-authority-summary',
			'The authoritative WordPress post cannot be updated until risky changes are approved or removed.'
		);
	} );

	it( 'imports pasted protected local updates from production editor chrome without saving', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		const payloadText = JSON.stringify( {
			version: 1,
			format: 'wp/de-rtc-local-updates',
		} );

		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
				},
			},
		} );
		actions.__experimentalImportDistributedEditingLocalUpdates.mockResolvedValue(
			{
				status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.IMPORTED_FOR_RETRY_SAVE,
				mutatesEditorContent: true,
				callsRetrySaveEndpoint: false,
				callsNormalSavePost: false,
				dispatchesNotice: false,
				changesPostLock: false,
				claimsSaved: false,
				hasAcceptedReviewApprovalProof: true,
			}
		);

		render( <DistributedEditingStatusChrome /> );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Import reviewed changes',
			} )
		);
		fireEvent.change(
			screen.getByRole( 'textbox', {
				name: 'Reviewed changes payload',
			} ),
			{ target: { value: payloadText } }
		);
		await user.click(
			screen.getByRole( 'button', {
				name: 'Validate review proof and import',
			} )
		);

		expect(
			actions.__experimentalImportDistributedEditingLocalUpdates
		).toHaveBeenCalledWith( payloadText );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
		expect( await screen.findByRole( 'status' ) ).toHaveTextContent(
			'Admin-reviewed changes were imported into this editor only, with route, hash, and signed review proof checks passing. They remain protected until WordPress confirms Save; no server request was sent.'
		);
	} );

	it.each( [
		[
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.MALFORMED_PAYLOAD,
			'Import blocked: the pasted protected-changes payload is missing or malformed. Nothing was imported, and local changes remain protected.',
		],
		[
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.POST_CONTENT_HASH_MISMATCH,
			'Import blocked: the protected post-content hash does not match the approved proof. Nothing was imported, and local changes remain protected.',
		],
		[
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.POST_ROUTE_MISMATCH,
			'Import blocked: the protected changes target a different editor route. Nothing was imported, and local changes remain protected.',
		],
		[
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.MISSING_REVIEW_APPROVAL_PROOF,
			'Import blocked: this admin review handoff is missing accepted review proof. Nothing was imported, and local changes remain protected.',
		],
		[
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.EXPIRED_REVIEW_APPROVAL_PROOF,
			'Import blocked: the admin-reviewed changes token or proof has expired and is no longer usable. Nothing was imported, and local changes remain protected and exportable.',
		],
		[
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			'Import blocked: this reviewed-changes handoff needs a fresh admin review before it can be imported for Save. Nothing was imported, and local changes remain protected and exportable.',
		],
		[
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.EXTRA_SESSION_STATE_OVEREXPOSED,
			'Import blocked: this reviewed-changes payload exposes extra distributed editing session state. Nothing was imported, and local changes remain protected.',
		],
	] )(
		'reports blocked local-updates import for %s without saving',
		async ( reason, message ) => {
			const user = userEvent.setup();
			const actions = setupDistributedEditingStatusDispatch();

			setupDistributedEditingStatusSelect( {
				editorSettings: {
					distributedEditing: {
						enabled: true,
					},
				},
			} );
			actions.__experimentalImportDistributedEditingLocalUpdates.mockResolvedValue(
				{
					status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
					reason,
					mutatesEditorContent: false,
					callsRetrySaveEndpoint: false,
					callsNormalSavePost: false,
					dispatchesNotice: false,
					changesPostLock: false,
					claimsSaved: false,
				}
			);

			render( <DistributedEditingStatusChrome /> );

			await user.click(
				screen.getByRole( 'button', {
					name: 'Import reviewed changes',
				} )
			);
			fireEvent.change(
				screen.getByRole( 'textbox', {
					name: 'Reviewed changes payload',
				} ),
				{ target: { value: '{"version":1}' } }
			);
			await user.click(
				screen.getByRole( 'button', {
					name: 'Validate review proof and import',
				} )
			);

			expect(
				actions.__experimentalImportDistributedEditingLocalUpdates
			).toHaveBeenCalledTimes( 1 );
			expect(
				actions.__experimentalSaveDistributedEditingRetryAfterProof
			).not.toHaveBeenCalled();
			expect(
				actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
			).not.toHaveBeenCalled();
			expect( await screen.findByRole( 'status' ) ).toHaveTextContent(
				message
			);
		}
	);

	it( 'shows fresh-review import action transcript reports without exposing raw payload details', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
				},
			},
		} );
		actions.__experimentalImportDistributedEditingLocalUpdates.mockResolvedValue(
			{
				status: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
				reason: DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
				actionTranscriptReport: {
					available: true,
					canShareWithSupport: true,
					chronologyText:
						'Fresh-review Save confirmation was recorded; use WordPress save-authority evidence to confirm persistence.',
					summaryText:
						'Recorded 4 redacted transcript events; 2 unsafe entries were dropped.',
					requiresSaveAuthorityForPersistence: true,
					callsSave: false,
					claimsSaved: false,
				},
				mutatesEditorContent: false,
				callsRetrySaveEndpoint: false,
				callsNormalSavePost: false,
				dispatchesNotice: false,
				changesPostLock: false,
				claimsSaved: false,
			}
		);

		render( <DistributedEditingStatusChrome /> );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Import reviewed changes',
			} )
		);
		fireEvent.change(
			screen.getByRole( 'textbox', {
				name: 'Reviewed changes payload',
			} ),
			{
				target: {
					value: JSON.stringify( {
						proofSignature: 'turn0146-hidden-proof',
						reviewerId: 'turn0146-reviewer-id',
						postContent: '<script>turn0146 raw content</script>',
					} ),
				},
			}
		);
		await user.click(
			screen.getByRole( 'button', {
				name: 'Validate review proof and import',
			} )
		);

		const status = await screen.findByRole( 'status' );
		expect( status ).toHaveTextContent(
			'Import blocked: this reviewed-changes handoff needs a fresh admin review before it can be imported for Save. Nothing was imported, and local changes remain protected and exportable.'
		);
		expect( status ).toHaveTextContent(
			'Fresh-review Save confirmation was recorded; use WordPress save-authority evidence to confirm persistence. Recorded 4 redacted transcript events; 2 unsafe entries were dropped.'
		);
		expect( status ).toHaveTextContent(
			'This transcript is diagnostic only; save authority evidence is still required before treating these changes as saved.'
		);
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect( status ).not.toHaveTextContent(
			/turn0146-hidden-proof|turn0146-reviewer-id|turn0146 raw content|proofSignature|reviewerId|postContent/
		);
	} );

	it( 'renders retry-save in-progress feedback from production editor chrome without saving', async () => {
		const user = userEvent.setup();
		const writeText = jest.fn().mockResolvedValue();
		const actions = setupDistributedEditingStatusDispatch();

		Object.defineProperty( globalThis.navigator, 'clipboard', {
			value: { writeText },
			configurable: true,
		} );
		setupDistributedEditingStatusSelect( {
			currentPost: { id: 43, type: 'post' },
			editedPostContent:
				'<!-- wp:paragraph --><p>Saving update</p><!-- /wp:paragraph -->',
			sessionState: {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				isAwaitingServerConfirmation: true,
				canExportLocalUpdates: true,
				mustOfferLocalCopy: true,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		expect(
			screen.getByRole( 'region', {
				name: 'Distributed editing status',
			} )
		).toHaveAttribute(
			'data-distributed-editing-placement',
			'editor-interface-notices'
		);
		expect( screen.getByText( 'Saving to WordPress' ) ).toBeVisible();
		expect(
			screen.getByText(
				'The editor is sending the prepared changes to WordPress. Keep this tab open; protected local changes remain exportable until WordPress confirms the save.'
			)
		).toBeVisible();
		expect( screen.getByText( 'Changes pending' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Save is waiting for WordPress confirmation. Protected local changes remain pending and exportable until confirmation.'
			)
		).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Export local changes',
			} )
		);

		expect( writeText ).toHaveBeenCalledTimes( 1 );
		expectClipboardExportPayload( writeText, {
			currentPost: { id: 43, type: 'post' },
			editedPostContent:
				'<!-- wp:paragraph --><p>Saving update</p><!-- /wp:paragraph -->',
			sessionState: {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				isAwaitingServerConfirmation: true,
				canExportLocalUpdates: true,
				mustOfferLocalCopy: true,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
			},
		} );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			await screen.findByText(
				'Protected local changes exported. Keep this copy until the server confirms the update.'
			)
		).toBeVisible();
	} );

	it( 'renders already-confirmed retry-save state from production editor chrome without recovery actions and then quiets evidence', () => {
		const originalConfirmedSaveStatusHoldMs =
			globalThis.__experimentalDistributedEditingConfirmedSaveStatusHoldMs;
		globalThis.__experimentalDistributedEditingConfirmedSaveStatusHoldMs = 1000;
		jest.useFakeTimers();

		try {
			setupDistributedEditingStatusSelect( {
				sessionState: {
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
					retrySaveAccepted: true,
					retrySaveServerVersion: '8',
					retrySavePreviousServerVersion: '7',
					retrySaveSavesPost: true,
					retrySaveMutatesPostContent: true,
					retrySaveCreatesRevision: true,
					retrySaveClaimsSaved: true,
					retrySaveRevisionCreated: true,
					retrySaveCreatedRevisionIds: [ 7002 ],
				},
			} );

			render( <DistributedEditingStatusChrome /> );

			expect(
				screen.getByRole( 'region', {
					name: 'Distributed editing status',
				} )
			).toHaveAttribute(
				'data-distributed-editing-placement',
				'editor-interface-notices'
			);
			expect( screen.getByText( 'Save confirmed' ) ).toBeVisible();
			expect(
				screen.getByText(
					'WordPress saved the prepared changes, advanced the sync version from 7 to 8, and recorded 1 revision. Protected local changes are no longer pending for this save.'
				)
			).toBeVisible();
			const confirmedSaveText = screen.getByText( 'Save confirmed' );
			// eslint-disable-next-line testing-library/no-node-access
			const confirmedStatusItem = confirmedSaveText.closest(
				'[data-distributed-editing-confirmed-save-status-evidence-retained]'
			);
			expect( confirmedStatusItem ).toHaveAttribute(
				'data-distributed-editing-confirmed-save-status-evidence-retained',
				'true'
			);
			expect( confirmedStatusItem ).toHaveAttribute(
				'data-distributed-editing-confirmed-save-status-quieted',
				'false'
			);
			expect(
				screen.queryByText(
					'WordPress confirmed the update. Open details for version and revision evidence.'
				)
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', {
					name: 'Export local changes',
				} )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', {
					name: 'Get latest post',
				} )
			).not.toBeInTheDocument();
			expect(
				screen.queryByText( 'Changes pending' )
			).not.toBeInTheDocument();

			act( () => {
				jest.advanceTimersByTime( 1000 );
			} );

			expect( confirmedStatusItem ).toHaveAttribute(
				'data-distributed-editing-confirmed-save-status-evidence-retained',
				'true'
			);
			expect( confirmedStatusItem ).toHaveAttribute(
				'data-distributed-editing-confirmed-save-status-quieted',
				'true'
			);
			expect( screen.getByText( 'Save confirmed' ) ).toBeVisible();
			expect(
				screen.getByText(
					'WordPress confirmed the update. Open details for version and revision evidence.'
				)
			).toBeVisible();
			expect( screen.getByText( 'Show Save evidence' ) ).toBeVisible();
			// eslint-disable-next-line testing-library/no-node-access
			const evidenceDetails = confirmedStatusItem.querySelector(
				'[data-distributed-editing-confirmed-save-status-details="retained"]'
			);
			expect( evidenceDetails ).not.toHaveAttribute( 'open' );
			expect(
				screen.getByText(
					'WordPress saved the prepared changes, advanced the sync version from 7 to 8, and recorded 1 revision. Protected local changes are no longer pending for this save.'
				)
			).toBeInTheDocument();
		} finally {
			jest.useRealTimers();

			if ( originalConfirmedSaveStatusHoldMs === undefined ) {
				delete globalThis.__experimentalDistributedEditingConfirmedSaveStatusHoldMs;
			} else {
				globalThis.__experimentalDistributedEditingConfirmedSaveStatusHoldMs =
					originalConfirmedSaveStatusHoldMs;
			}
		}
	} );

	it( 'renders blocked retry-save in-progress handoff feedback from production editor chrome without saving', async () => {
		const user = userEvent.setup();
		const writeText = jest.fn().mockResolvedValue();
		const actions = setupDistributedEditingStatusDispatch();

		Object.defineProperty( globalThis.navigator, 'clipboard', {
			value: { writeText },
			configurable: true,
		} );
		setupDistributedEditingStatusSelect( {
			currentPost: { id: 44, type: 'post' },
			editedPostContent:
				'<!-- wp:paragraph --><p>Blocked update</p><!-- /wp:paragraph -->',
			sessionState: {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				isAwaitingServerConfirmation: true,
				canExportLocalUpdates: true,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
				retrySaveHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
				retrySaveHandoffReason:
					DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS,
				retrySaveHandoffBlocksNormalSave: true,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		expect( screen.getByText( 'Save already in progress' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Save is already waiting for WordPress confirmation. Protected local changes remain exportable; keep this tab open until it finishes.'
			)
		).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Export local changes',
			} )
		);

		expect( writeText ).toHaveBeenCalledTimes( 1 );
		expectClipboardExportPayload( writeText, {
			currentPost: { id: 44, type: 'post' },
			editedPostContent:
				'<!-- wp:paragraph --><p>Blocked update</p><!-- /wp:paragraph -->',
			sessionState: {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				isAwaitingServerConfirmation: true,
				canExportLocalUpdates: true,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
				retrySaveHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
				retrySaveHandoffReason:
					DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS,
			},
		} );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			await screen.findByText(
				'Protected local changes exported. Keep this copy until the server confirms the update.'
			)
		).toBeVisible();
	} );

	it( 'copies local updates from production editor chrome without saving', async () => {
		const user = userEvent.setup();
		const writeText = jest.fn().mockResolvedValue();
		const actions = setupDistributedEditingStatusDispatch();

		Object.defineProperty( globalThis.navigator, 'clipboard', {
			value: { writeText },
			configurable: true,
		} );
		setupDistributedEditingStatusSelect( {
			currentPost: { id: 42, type: 'post' },
			editedPostContent:
				'<!-- wp:paragraph --><p>Local update</p><!-- /wp:paragraph -->',
			sessionState: {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
				retrySaveHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
				retrySaveHandoffReason:
					DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_PROOF_NOT_ACCEPTED,
				retrySaveHandoffBlocksNormalSave: true,
				retrySaveReviewApprovalAccepted: true,
				retrySaveReviewApprovalProofStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
				retrySaveReviewApprovalPostId: '42',
				retrySaveReviewApprovalPostType: 'post',
				retrySaveReviewApprovalReviewerUserId: '7',
				retrySaveReviewApprovalLowPrivilegedSaverUserId: '5',
				retrySaveReviewApprovalReviewStatus: 'approved',
				retrySaveReviewApprovalApprovalStatus: 'approved',
				retrySaveReviewApprovalReviewAction: 'approve_for_retry_save',
				retrySaveReviewApprovalApprovalAction: 'carry_review_proof',
				retrySaveReviewApprovalRequiredCapability: 'unfiltered_html',
				retrySaveReviewApprovalServerVersion: '12',
				retrySaveReviewApprovalPreviousServerVersion: '11',
				retrySaveReviewApprovalRebasedFromVersion: '10',
				retrySaveReviewApprovalProposedContentHash:
					'approved-proposed-hash',
				retrySaveReviewApprovalCandidateContentHash:
					'approved-candidate-hash',
				retrySaveReviewApprovalProofSignature: 'signed-proof',
				retrySaveReviewApprovalIssuedAt: '1893456000',
				retrySaveReviewApprovalExpiresAt: '1893456300',
				retrySaveReviewApprovalSiteId: '1',
				retrySaveReviewApprovalSiteUrl: 'http://example.test',
				retrySaveReviewApprovalSavesPost: false,
				retrySaveReviewApprovalMutatesPostContent: false,
				retrySaveReviewApprovalCreatesRevision: false,
				retrySaveReviewApprovalClaimsSaved: false,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Export local changes',
			} )
		);

		expect( writeText ).toHaveBeenCalledTimes( 1 );
		const payload = expectClipboardExportPayload( writeText, {
			currentPost: { id: 42, type: 'post' },
			editedPostContent:
				'<!-- wp:paragraph --><p>Local update</p><!-- /wp:paragraph -->',
			sessionState: {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
				retrySaveHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
				retrySaveHandoffReason:
					DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_PROOF_NOT_ACCEPTED,
				retrySaveHandoffBlocksNormalSave: true,
				retrySaveReviewApprovalAccepted: true,
				retrySaveReviewApprovalProofStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES.ACCEPTED_FOR_RETRY_SAVE,
				retrySaveReviewApprovalPostId: '42',
				retrySaveReviewApprovalPostType: 'post',
				retrySaveReviewApprovalReviewerUserId: '7',
				retrySaveReviewApprovalLowPrivilegedSaverUserId: '5',
				retrySaveReviewApprovalReviewStatus: 'approved',
				retrySaveReviewApprovalApprovalStatus: 'approved',
				retrySaveReviewApprovalReviewAction: 'approve_for_retry_save',
				retrySaveReviewApprovalApprovalAction: 'carry_review_proof',
				retrySaveReviewApprovalRequiredCapability: 'unfiltered_html',
				retrySaveReviewApprovalServerVersion: '12',
				retrySaveReviewApprovalPreviousServerVersion: '11',
				retrySaveReviewApprovalRebasedFromVersion: '10',
				retrySaveReviewApprovalProposedContentHash:
					'approved-proposed-hash',
				retrySaveReviewApprovalCandidateContentHash:
					'approved-candidate-hash',
				retrySaveReviewApprovalProofSignature: 'signed-proof',
				retrySaveReviewApprovalIssuedAt: '1893456000',
				retrySaveReviewApprovalExpiresAt: '1893456300',
				retrySaveReviewApprovalSiteId: '1',
				retrySaveReviewApprovalSiteUrl: 'http://example.test',
				retrySaveReviewApprovalSavesPost: false,
				retrySaveReviewApprovalMutatesPostContent: false,
				retrySaveReviewApprovalCreatesRevision: false,
				retrySaveReviewApprovalClaimsSaved: false,
			},
		} );
		expect( payload.acceptedReviewApprovalProof ).toMatchObject( {
			proof_envelope_type: 'field_based_review_approval_proof',
		} );
		expect( payload.acceptedReviewApprovalProof.proof ).toMatchObject( {
			postId: '42',
			postType: 'post',
			serverVersion: '12',
			proposedPostContentHash: 'approved-proposed-hash',
			candidatePostContentHash: 'approved-candidate-hash',
			proofSignature: 'signed-proof',
			rawContentIncluded: false,
			claimsSaved: false,
		} );
		expect(
			JSON.stringify( payload.acceptedReviewApprovalProof )
		).not.toContain( 'Local update' );
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			await screen.findByText(
				'Protected local changes exported. Keep this copy until the server confirms the update.'
			)
		).toBeVisible();
	} );

	it( 'reports clipboard denial from production editor chrome without saving', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();

		Object.defineProperty( globalThis.navigator, 'clipboard', {
			value: undefined,
			configurable: true,
		} );
		setupDistributedEditingStatusSelect( {
			sessionState: {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
				retrySaveHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
				retrySaveHandoffReason:
					DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_PROOF_NOT_ACCEPTED,
				retrySaveHandoffBlocksNormalSave: true,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Export local changes',
			} )
		);

		expect( await screen.findByRole( 'status' ) ).toHaveTextContent(
			'Clipboard unavailable. Protected local changes remain in this editor session; keep this tab open and try exporting again after clipboard access is available.'
		);
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
	} );

	it( 'refetches server state from production editor chrome without saving', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			sessionState: {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
				requiresServerStateRefetch: true,
				retrySaveHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
				retrySaveHandoffReason:
					DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
				retrySaveHandoffBlocksNormalSave: true,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Get latest post',
			} )
		);

		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			await screen.findByText(
				'Latest post loaded. Protected local changes remain in this editor session and can still be exported before retrying.'
			)
		).toBeVisible();
	} );

	it( 'renders review-required retry-save chrome with export and refetch actions only', async () => {
		const user = userEvent.setup();
		const writeText = jest.fn().mockResolvedValue();
		const actions = setupDistributedEditingStatusDispatch();

		Object.defineProperty( globalThis.navigator, 'clipboard', {
			value: { writeText },
			configurable: true,
		} );
		setupDistributedEditingStatusSelect( {
			currentPost: { id: 45, type: 'post' },
			editedPostContent:
				'<!-- wp:html --><script>window.localChange = true;</script><!-- /wp:html -->',
			sessionState: {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
				pendingChangeCount: 1,
				hasPendingChanges: true,
				requiresServerStateRefetch: true,
				requiresManualConflictResolution: true,
				canExportLocalUpdates: true,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
				retrySaveReason:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		expect(
			screen.getByText( 'HTML review required before Save' )
		).toBeVisible();
		expect(
			screen.getByText(
				'Save did not update the authoritative post because these changes may alter unfiltered HTML. Export them for review by someone with unfiltered HTML permission, or get the latest post before deciding how to continue. Protected local changes remain exportable.'
			)
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: 'Export local changes' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Export changes for review' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Get latest post' } )
		).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Export changes for review',
			} )
		);

		expect( writeText ).toHaveBeenCalledTimes( 1 );
		expectClipboardExportPayload( writeText, {
			currentPost: { id: 45, type: 'post' },
			editedPostContent:
				'<!-- wp:html --><script>window.localChange = true;</script><!-- /wp:html -->',
			sessionState: {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
				pendingChangeCount: 1,
				hasPendingChanges: true,
				requiresServerStateRefetch: true,
				requiresManualConflictResolution: true,
				canExportLocalUpdates: true,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
				retrySaveReason:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
			},
		} );
		expect(
			await screen.findByText(
				'Protected local changes exported for HTML review. Keep this copy until a user with unfiltered HTML permission can inspect it.'
			)
		).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Get latest post',
			} )
		);

		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalPrepareDistributedEditingRetrySubmitAfterLocalRebase
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof
		).not.toHaveBeenCalled();
		expect(
			await screen.findByText(
				'Latest post loaded for HTML review. Protected local changes remain in this editor session and can still be exported before retrying.'
			)
		).toBeVisible();
	} );

	it( 'exports a fresh-review handoff for unavailable reviewed tokens without saving or leaking proof internals', async () => {
		const user = userEvent.setup();
		const writeText = jest.fn().mockResolvedValue();
		const actions = setupDistributedEditingStatusDispatch();
		const staleToken = 'de-rtc-review-token.must-not-leak';
		const editedPostContent =
			'<!-- wp:html --><script>window.localChange = true;</script><!-- /wp:html -->';
		const sessionState = {
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_MALFORMED_SYNC_PAYLOAD,
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD,
			serverVersion: '12',
			clientBaseVersion: '7',
			pendingChangeCount: 1,
			hasPendingChanges: true,
			canExportLocalUpdates: true,
			retrySaveStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD,
			retrySaveReason: 'unknown_retry_save_review_approval_proof_token',
			retrySaveReviewApprovalProofEnvelope: {
				proof_envelope_type: 'opaque_review_approval_proof_token',
				token: staleToken,
			},
			retrySaveReviewApprovalReviewerUserId: '7',
			retrySaveReviewApprovalProofSignature: 'signed-proof',
			retrySaveReviewApprovalReviewedBlockItems: [
				{
					id: 'risk-html-approved',
					reviewStatus: 'approved_for_retry_save',
				},
			],
		};

		Object.defineProperty( globalThis.navigator, 'clipboard', {
			value: { writeText },
			configurable: true,
		} );
		setupDistributedEditingStatusSelect( {
			currentPost: { id: 46, type: 'post' },
			editedPostContent,
			sessionState,
		} );

		render( <DistributedEditingStatusChrome /> );

		expect(
			screen.getByText( 'Reviewed changes token unavailable' )
		).toBeVisible();
		expect(
			screen.getByText(
				'The imported reviewed-changes token could not be found in server storage and is no longer usable for Save. No server save was made. Export a fresh-review handoff for an admin reviewer; protected local changes remain exportable.'
			)
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: 'Export local changes' } )
		).not.toBeInTheDocument();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Export for fresh review',
			} )
		);

		expect( writeText ).toHaveBeenCalledTimes( 1 );
		const payload = expectClipboardExportPayload( writeText, {
			currentPost: { id: 46, type: 'post' },
			editedPostContent,
			sessionState,
		} );
		expect( payload.acceptedReviewApprovalProof ).toBeNull();
		expect( payload.reviewTokenRecovery ).toMatchObject( {
			status: 'fresh_review_required',
			reason: 'token_unavailable',
			requiresFreshReview: true,
			canExportLocalUpdates: true,
			serverVersion: '12',
			clientBaseVersion: '7',
		} );
		expect( JSON.stringify( payload ) ).not.toContain( staleToken );
		expect( JSON.stringify( payload ) ).not.toContain( 'signed-proof' );
		expect( JSON.stringify( payload ) ).not.toContain(
			'reviewedBlockItems'
		);
		expect( JSON.stringify( payload ) ).not.toContain( 'reviewerUserId' );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			await screen.findByText(
				'Fresh-review handoff copied. Send it to an admin reviewer; local changes remain protected until a new review proof is issued.'
			)
		).toBeVisible();
	} );

	it( 'reports blocked retry-save refetch failure while keeping export available', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase.mockRejectedValue(
			{ code: 'rest_cannot_edit' }
		);

		setupDistributedEditingStatusSelect( {
			sessionState: {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
				requiresServerStateRefetch: true,
				retrySaveHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
				retrySaveHandoffReason:
					DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
				retrySaveHandoffBlocksNormalSave: true,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Get latest post',
			} )
		);

		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			screen.getByRole( 'button', {
				name: 'Export local changes',
			} )
		).toBeVisible();
		expect( await screen.findByRole( 'status' ) ).toHaveAttribute(
			'data-distributed-editing-action-status',
			'error'
		);
		expect(
			screen.getByText(
				'Latest post could not be loaded. Protected local changes remain in this editor session and can still be exported; keep this tab open before trying again.'
			)
		).toBeVisible();
	} );

	it( 'surfaces blocked retry-save refetch as a production chrome action transition', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		const onAction = jest.fn();

		setupDistributedEditingStatusSelect( {
			sessionState: {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
				requiresServerStateRefetch: true,
				retrySaveHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
				retrySaveHandoffReason:
					DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
				retrySaveHandoffBlocksNormalSave: true,
			},
		} );

		render( <DistributedEditingStatusChrome onAction={ onAction } /> );

		const statusChrome = screen.getByRole( 'region', {
			name: 'Distributed editing status',
		} );

		expect( statusChrome ).toHaveAttribute(
			'data-distributed-editing-placement',
			'editor-interface-notices'
		);
		expect(
			screen.getByText( 'Save needs the latest post' )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', {
				name: 'Export local changes',
			} )
		).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Get latest post',
			} )
		);

		expect( onAction ).toHaveBeenCalledWith(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
			expect.objectContaining( {
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.RETRY_SAVE,
				actionKeys: expect.arrayContaining( [
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
				] ),
			} )
		);
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect( await screen.findByRole( 'status' ) ).toHaveAttribute(
			'data-distributed-editing-action-status',
			'info'
		);
		expect(
			screen.getByText(
				'Latest post loaded. Protected local changes remain in this editor session and can still be exported before retrying.'
			)
		).toBeVisible();
	} );

	it( 'plans local rebase from production editor chrome when inputs are not ready', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			noticeDescriptors: [
				{
					id: 'local-rebase-plan',
					kind: DISTRIBUTED_EDITING_NOTICE_KINDS.STALE_BASE_REJECTED,
					status: 'warning',
					disposition:
						DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
					pendingChangeCount: 1,
					remoteChangeCount: 1,
					canAttemptLocalRebase: true,
					localRebasePlanStatus:
						DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
					hasLocalRebaseInputs: false,
					actionKeys: [
						DISTRIBUTED_EDITING_NOTICE_ACTIONS.REBASE_LOCAL_UPDATES,
					],
				},
			],
			sessionState: {
				pendingChangeCount: 1,
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Apply local changes',
			} )
		);

		expect(
			actions.__experimentalPlanDistributedEditingLocalRebaseAfterStaleBase
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.__experimentalRebaseDistributedEditingLocalUpdatesAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			await screen.findByText(
				'Checked whether local changes can be applied.'
			)
		).toBeVisible();
	} );

	it( 'rebases local updates from production editor chrome without saving', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			sessionState: {
				pendingChangeCount: 1,
				remoteChangeCount: 1,
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				refetchedServerState: true,
				canAttemptLocalRebase: true,
				canExportLocalUpdates: true,
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base</p><!-- /wp:paragraph -->',
				refetchedServerContent:
					'<!-- wp:paragraph --><p>Server</p><!-- /wp:paragraph -->',
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Apply local changes',
			} )
		);

		expect(
			actions.__experimentalRebaseDistributedEditingLocalUpdatesAfterStaleBase
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.__experimentalPlanDistributedEditingLocalRebaseAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			await screen.findByText(
				'Local changes applied to the latest post.'
			)
		).toBeVisible();
	} );

	it( 'prepares retry submit from production editor chrome without saving', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			sessionState: {
				pendingChangeCount: 1,
				remoteChangeCount: 1,
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				refetchedServerState: true,
				canExportLocalUpdates: true,
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
				readyToRetrySubmit: true,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base</p><!-- /wp:paragraph -->',
				refetchedServerContent:
					'<!-- wp:paragraph --><p>Server</p><!-- /wp:paragraph -->',
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Prepare changes',
			} )
		);

		expect(
			actions.__experimentalPrepareDistributedEditingRetrySubmitAfterLocalRebase
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			await screen.findByText(
				'Changes are ready for WordPress to check. Nothing has been saved yet.'
			)
		).toBeVisible();
	} );

	it( 'refreshes retry-submit proof from production editor chrome without saving', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			sessionState: {
				pendingChangeCount: 1,
				remoteChangeCount: 1,
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				refetchedServerState: true,
				canExportLocalUpdates: true,
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
				retrySubmitHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
				retrySubmitPrepared: true,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base</p><!-- /wp:paragraph -->',
				refetchedServerContent:
					'<!-- wp:paragraph --><p>Server</p><!-- /wp:paragraph -->',
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Check with WordPress',
			} )
		);

		expect(
			actions.__experimentalRefreshDistributedEditingRetrySubmitProof
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalPrepareDistributedEditingRetrySubmitAfterLocalRebase
		).not.toHaveBeenCalled();
		expect(
			await screen.findByText(
				'WordPress checked these changes. Prepare Save before updating the post.'
			)
		).toBeVisible();
	} );

	it( 'prepares guarded retry save from accepted proof chrome without saving', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			sessionState: {
				pendingChangeCount: 1,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
				retrySubmitAccepted: true,
				retrySubmitSavePathRequired: true,
				canExportLocalUpdates: true,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Prepare Save',
			} )
		);

		expect(
			actions.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingRetrySubmitProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			await screen.findByText(
				'Save prepared. Use Save to send these changes to WordPress.'
			)
		).toBeVisible();
	} );

	it( 'guides a checked conflict choice through guarded save preparation without saving', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			sessionState: {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
				retrySubmitAccepted: true,
				retrySubmitSavePathRequired: true,
				staleBaseConflictResolutionStatus:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LATEST_WORDPRESS_SELECTED,
				staleBaseConflictResolutionChoice:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS,
				staleBaseConflictResolutionRequiresFreshProof: false,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		const statusRegion = screen.getByRole( 'region', {
			name: 'Distributed editing status',
		} );
		// eslint-disable-next-line testing-library/no-node-access
		const statusItem = statusRegion.querySelector(
			'[data-distributed-editing-conflict-proof-accepted="true"]'
		);

		expect( statusItem ).toHaveAttribute(
			'data-distributed-editing-conflict-proof-continuation',
			'prepare_guarded_save'
		);
		expect( statusItem ).toHaveAttribute(
			'data-distributed-editing-conflict-authoritative-post-updated',
			'false'
		);
		expect( statusItem ).toHaveAttribute(
			'data-distributed-editing-next-step',
			'prepare_guarded_save'
		);
		expect( screen.getByText( 'Conflict choice checked' ) ).toBeVisible();
		expect(
			screen.getByText(
				'WordPress checked this conflict choice. Prepare Save before updating the post; the WordPress post has not changed yet.'
			)
		).toBeVisible();
		expect(
			screen.getByText(
				'Prepare Save, then use Save to send the guarded update.'
			)
		).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Prepare Save',
			} )
		);

		expect(
			actions.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingRetrySubmitProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			await screen.findByText(
				'Save prepared. Use Save to send these changes to WordPress.'
			)
		).toBeVisible();
	} );

	it( 'requests fresh review from production editor chrome without saving or mutating content', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			sessionState: {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
				localUpdatesImportStatus:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
				localUpdatesImportReason:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
				localUpdatesImportVerifiedPostContentHash:
					'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
				localUpdatesImportReviewRequestStatus:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.FRESH_REVIEW_REQUIRED,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Request fresh review',
			} )
		);

		expect(
			actions.__experimentalRequestDistributedEditingFreshReviewForImportedLocalUpdates
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			await screen.findByText(
				'Fresh review request accepted for admin review. No save was made, and protected local changes remain exportable.'
			)
		).toBeVisible();
		expect(
			screen.queryByText(
				/proof_signature|reviewer_user_id|reviewed_block_items/i
			)
		).not.toBeInTheDocument();
	} );

	it( 'mounts the status surface for unload-warning state', () => {
		setupDistributedEditingStatusSelect( {
			noticeDescriptors: [],
			unloadWarningState: {
				shouldWarn: true,
				reason: DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS.AWAITING_SERVER_CONFIRMATION,
				pendingChangeCount: 0,
			},
		} );

		render( <DistributedEditingStatus /> );

		expect(
			screen.getByText(
				'Leaving now may lose unconfirmed local changes.'
			)
		).toBeVisible();
	} );
} );

describe( 'DistributedEditingStatusSurface', () => {
	it( 'renders nothing for an idle session', () => {
		const { container } = render( <DistributedEditingStatusSurface /> );

		expect( container ).toBeEmptyDOMElement();
		expect( getDistributedEditingStatusSurfaceItems() ).toEqual( [] );
	} );

	it( 'renders pending local changes and unload protection state', () => {
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				pendingChangeCount: 2,
			} );
		const unloadWarningState =
			getDistributedEditingUnloadWarningStateForSessionState( {
				pendingChangeCount: 2,
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
				unloadWarningState={ unloadWarningState }
			/>
		);

		expect(
			screen.getByRole( 'region', {
				name: 'Distributed editing status',
			} )
		).toBeVisible();
		expect( screen.getByText( 'Changes pending' ) ).toBeVisible();
		expect(
			screen.getByText( '2 local changes are awaiting confirmation.' )
		).toBeVisible();
		expect(
			screen.getByText(
				'Leaving now may lose 2 unconfirmed local changes.'
			)
		).toBeVisible();
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'renders degraded connection and remote-change status', async () => {
		const user = userEvent.setup();
		const onAction = jest.fn();
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				isConnectionDegraded: true,
				remoteChangeCount: 1,
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
				onAction={ onAction }
			/>
		);

		expect( screen.getByText( 'Connection degraded' ) ).toBeVisible();
		expect(
			screen.getByText( 'Live editing updates may be delayed.' )
		).toBeVisible();
		expect( screen.getByText( 'Remote changes received' ) ).toBeVisible();
		expect(
			screen.getByText( '1 remote change is available for review.' )
		).toBeVisible();

		await user.click(
			screen.getByRole( 'button', { name: 'Review changes' } )
		);

		expect( onAction ).toHaveBeenCalledWith(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.REVIEW_REMOTE_CHANGES,
			expect.objectContaining( {
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.REMOTE_CHANGES_RECEIVED,
			} )
		);
	} );

	it( 'renders server-state acceptance without inert action buttons', () => {
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.CONFLICT_REQUIRES_SERVER_STATE_ACCEPTANCE,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_RESTORED_FROM_REVISION_CONFLICT,
				pendingChangeCount: 1,
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
			/>
		);

		expect( screen.getByText( 'Latest post available' ) ).toBeVisible();
		expect(
			screen.getByText( 'Accept the latest post before continuing.' )
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', {
				name: 'Accept latest post',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', {
				name: 'Export local changes',
			} )
		).not.toBeInTheDocument();
	} );

	it( 'renders stale-base rejection actions for inspected state', async () => {
		const user = userEvent.setup();
		const onAction = jest.fn();
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				pendingChangeCount: 1,
				remoteChangeCount: 1,
				canAttemptLocalRebase: true,
				refetchedServerState: true,
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
				canExportLocalUpdates: true,
				clientBaseContent: '',
				refetchedServerContent: '',
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
				onAction={ onAction }
			/>
		);

		expect( screen.getByText( 'Latest post loaded' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Apply local changes in this editor before trying Save again; WordPress is not updated yet.'
			)
		).toBeVisible();
		const staleBaseNotice = screen
			.getByText( 'Latest post loaded' )
			// eslint-disable-next-line testing-library/no-node-access
			.closest( '.editor-distributed-editing-status__notice' );
		expect( staleBaseNotice ).toHaveTextContent(
			"Review changes tracks remote activity separately. Use this notice's next step to keep local changes protected before Save."
		);
		expect( staleBaseNotice ).toHaveTextContent(
			'Save now: Apply local changes before Save can update the post.'
		);
		expect(
			screen
				.getByText( 'Latest post loaded' )
				// eslint-disable-next-line testing-library/no-node-access
				.closest( '[data-distributed-editing-remote-review-context]' )
		).toHaveAttribute(
			'data-distributed-editing-remote-review-context',
			'true'
		);
		const staleBaseStatusItem = screen
			.getByText( 'Latest post loaded' )
			// eslint-disable-next-line testing-library/no-node-access
			.closest( '[data-distributed-editing-save-now-context]' );
		expect( staleBaseStatusItem ).toHaveAttribute(
			'data-distributed-editing-save-now-context',
			'true'
		);
		expect( staleBaseStatusItem ).toHaveAttribute(
			'data-distributed-editing-save-now-action',
			'apply_local_changes'
		);
		expect( staleBaseStatusItem ).toHaveAttribute(
			'data-distributed-editing-save-now-step',
			'local_changes_protected'
		);
		expect(
			within( staleBaseNotice )
				.getAllByRole( 'button' )
				.map( ( button ) => {
					return button.textContent.trim();
				} )
		).toEqual( [
			'Apply local changes',
			'Get latest post',
			'Export local changes',
		] );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Apply local changes',
			} )
		);

		expect( onAction ).toHaveBeenCalledWith(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.REBASE_LOCAL_UPDATES,
			expect.objectContaining( {
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.STALE_BASE_REJECTED,
			} )
		);
	} );

	it( 'renders stale-base missing-input status without a rebase action', () => {
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				pendingChangeCount: 1,
				remoteChangeCount: 1,
				canAttemptLocalRebase: true,
				refetchedServerState: true,
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
				canExportLocalUpdates: true,
				refetchedServerContent: '',
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
				onAction={ jest.fn() }
			/>
		);

		expect( screen.getByText( 'Latest post data missing' ) ).toBeVisible();
		expect(
			screen.getByText(
				'The editor needs both the starting post and latest post before it can apply local changes. Export local changes before reloading.'
			)
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', {
				name: 'Apply local changes',
			} )
		).not.toBeInTheDocument();
		const staleBaseNotice = screen
			.getByText( 'Latest post data missing' )
			// eslint-disable-next-line testing-library/no-node-access
			.closest( '.editor-distributed-editing-status__notice' );
		expect( staleBaseNotice ).toHaveTextContent(
			"Review changes tracks remote activity separately. Use this notice's next step to keep local changes protected before Save."
		);
		expect( staleBaseNotice ).toHaveTextContent(
			'Save now: Get latest first before Save can update the post.'
		);
		expect(
			screen
				.getByText( 'Latest post data missing' )
				// eslint-disable-next-line testing-library/no-node-access
				.closest( '[data-distributed-editing-save-now-context]' )
		).toHaveAttribute(
			'data-distributed-editing-save-now-action',
			'get_latest_post'
		);
		expect(
			within( staleBaseNotice )
				.getAllByRole( 'button' )
				.map( ( button ) => {
					return button.textContent.trim();
				} )
		).toEqual( [ 'Get latest post', 'Export local changes' ] );
	} );

	it( 'does not render remote-review context when stale-base has no separate remote notice', () => {
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				pendingChangeCount: 1,
				canExportLocalUpdates: true,
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
				onAction={ jest.fn() }
			/>
		);

		expect(
			screen.queryByText( /tracks remote activity separately/ )
		).not.toBeInTheDocument();
		expect(
			screen.getByText(
				'Save now: Get latest first before Save can update the post.'
			)
		).toBeVisible();
		expect(
			screen
				.getByText( 'Post changed on the server' )
				// eslint-disable-next-line testing-library/no-node-access
				.closest( '[data-distributed-editing-remote-review-context]' )
		).toHaveAttribute(
			'data-distributed-editing-remote-review-context',
			'false'
		);
		expect(
			screen
				.getByText( 'Post changed on the server' )
				// eslint-disable-next-line testing-library/no-node-access
				.closest( '[data-distributed-editing-save-now-context]' )
		).toHaveAttribute(
			'data-distributed-editing-save-now-context',
			'true'
		);
	} );

	it( 'renders stale-base rebase result status without leaking content', () => {
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				pendingChangeCount: 1,
				remoteChangeCount: 1,
				refetchedServerState: true,
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
				readyToRetrySubmit: true,
				canExportLocalUpdates: true,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base</p><!-- /wp:paragraph -->',
				refetchedServerContent:
					'<!-- wp:paragraph --><p>Server</p><!-- /wp:paragraph -->',
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
			/>
		);

		expect( screen.getByText( 'Local changes applied' ) ).toBeVisible();
		expect(
			screen.getByText(
				'The latest post is loaded and local changes were applied in this editor. Prepare these changes for a WordPress check before updating the post.'
			)
		).toBeVisible();
		expect( screen.queryByText( /wp:paragraph/ ) ).not.toBeInTheDocument();
	} );

	it( 'renders reason-specific stale-base rebase conflict status', () => {
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				pendingChangeCount: 1,
				remoteChangeCount: 1,
				refetchedServerState: true,
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				localRebaseResultReason: 'block_reordered',
				requiresManualConflictResolution: true,
				canExportLocalUpdates: true,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base</p><!-- /wp:paragraph -->',
				refetchedServerContent:
					'<!-- wp:paragraph --><p>Server</p><!-- /wp:paragraph -->',
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
			/>
		);

		expect(
			screen.getByText( 'Compare conflicting changes' )
		).toBeVisible();
		expect(
			screen.getByText(
				'The latest post is loaded, but blocks were reordered while local edits were pending. Compare local changes with the latest post before choosing what to keep.'
			)
		).toBeVisible();
		expect( screen.getByText( 'Next step:' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Compare the local changes with the latest post before choosing what to keep.'
			)
		).toBeVisible();
		const reorderStatusItem = screen
			.getByText( 'Compare conflicting changes' )
			// eslint-disable-next-line testing-library/no-node-access
			.closest( '[data-distributed-editing-next-step]' );
		expect( reorderStatusItem ).toHaveAttribute(
			'data-distributed-editing-next-step',
			'export_for_manual_conflict_review'
		);
		expect( screen.queryByText( /wp:paragraph/ ) ).not.toBeInTheDocument();
	} );

	it( 'renders reason-specific unsafe freeform HTML status', () => {
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				pendingChangeCount: 1,
				remoteChangeCount: 1,
				refetchedServerState: true,
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.UNSAFE_CONTENT_BOUNDARY,
				localRebaseResultReason: 'freeform_html',
				requiresManualConflictResolution: true,
				canExportLocalUpdates: true,
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
			/>
		);

		expect( screen.getByText( 'Local changes blocked' ) ).toBeVisible();
		expect(
			screen.getByText(
				'The content is not represented by whole serialized blocks and needs manual review.'
			)
		).toBeVisible();
		expect( screen.getByText( 'Next step:' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Compare the local changes with the latest post before choosing what to keep.'
			)
		).toBeVisible();
		const freeformStatusItem = screen
			.getByText( 'Local changes blocked' )
			// eslint-disable-next-line testing-library/no-node-access
			.closest( '[data-distributed-editing-next-step]' );
		expect( freeformStatusItem ).toHaveAttribute(
			'data-distributed-editing-next-step',
			'export_for_manual_conflict_review'
		);
	} );

	it( 'renders prepared retry-submit handoff status without claiming a save', () => {
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				pendingChangeCount: 1,
				remoteChangeCount: 1,
				refetchedServerState: true,
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.REBASED,
				retrySubmitHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.PREPARED,
				retrySubmitPrepared: true,
				canExportLocalUpdates: true,
				clientBaseContent: '',
				refetchedServerContent: '',
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
			/>
		);

		expect( screen.getByText( 'Ready for WordPress check' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Local changes are prepared against the latest post. Check with WordPress before preparing Save; nothing has been saved yet.'
			)
		).toBeVisible();
	} );

	it( 'renders accepted retry-submit proof without claiming a save', () => {
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				pendingChangeCount: 1,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
				retrySubmitAccepted: true,
				retrySubmitSavePathRequired: true,
				retrySubmitSavesPost: false,
				retrySubmitMutatesPostContent: false,
				retrySubmitClaimsSaved: false,
				canExportLocalUpdates: true,
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
			/>
		);

		expect( screen.getByText( 'Changes pending' ) ).toBeVisible();
		expect(
			screen.getByText(
				'WordPress checked these changes. Prepare Save before updating the post; local changes remain pending.'
			)
		).toBeVisible();
		expect(
			screen.queryByText(
				/retry save applied|post saved|saved successfully|changes are saved/i
			)
		).not.toBeInTheDocument();
	} );

	it( 'renders imported protected changes as local guarded-save readiness', () => {
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				pendingChangeCount: 1,
				localUpdatesImportStatus:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.IMPORTED_FOR_RETRY_SAVE,
				localUpdatesImportHasAcceptedReviewApprovalProof: true,
				canExportLocalUpdates: true,
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
			/>
		);

		expect( screen.getByText( 'Changes pending' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Admin-reviewed changes were imported locally with signed review proof and are ready for WordPress Save. They remain protected and exportable until WordPress confirms the update.'
			)
		).toBeVisible();
		expect( screen.queryByText( /saved/i ) ).not.toBeInTheDocument();
	} );

	it( 'renders generic protected import readiness separately from reviewed proof imports', () => {
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				pendingChangeCount: 1,
				localUpdatesImportStatus:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.IMPORTED_FOR_RETRY_SAVE,
				localUpdatesImportHasAcceptedReviewApprovalProof: false,
				canExportLocalUpdates: true,
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
			/>
		);

		expect( screen.getByText( 'Changes pending' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Protected recovery changes were imported locally and are ready for WordPress Save. They remain protected and exportable until WordPress confirms the update.'
			)
		).toBeVisible();
		expect(
			screen.queryByText( /Admin-reviewed changes were imported/ )
		).not.toBeInTheDocument();
	} );

	it( 'renders fresh-review import blockers as no-save review requests', async () => {
		const user = userEvent.setup();
		const onAction = jest.fn();
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				localUpdatesImportStatus:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
				localUpdatesImportReason:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
				onAction={ onAction }
			/>
		);

		expect( screen.getByText( 'Fresh review needed' ) ).toBeVisible();
		expect(
			screen.getByText(
				'This fresh-review handoff cannot be imported for Save because it has no usable accepted review proof. Request a new admin review before saving; nothing was imported, saved, or sent to the server.'
			)
		).toBeVisible();
		expect(
			screen.queryByText( /proof_signature|reviewer|reviewed block/i )
		).not.toBeInTheDocument();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Request fresh review',
			} )
		);

		expect( onAction ).toHaveBeenCalledWith(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW,
			expect.objectContaining( {
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.LOCAL_UPDATES_IMPORT_BLOCKED,
				localUpdatesImportRequiresFreshReview: true,
				localUpdatesImportReviewRequestStatus:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.FRESH_REVIEW_REQUIRED,
				localUpdatesImportReviewActionKey:
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.REQUEST_FRESH_REVIEW,
			} )
		);
		expect(
			screen.queryByRole( 'button', { name: /save/i } )
		).not.toBeInTheDocument();
	} );

	it( 'renders accepted fresh-review request status without retry-save actions or proof internals', () => {
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				pendingChangeCount: 1,
				canExportLocalUpdates: true,
				localUpdatesImportStatus:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
				localUpdatesImportReason:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
				localUpdatesImportReviewRequestStatus:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
				localUpdatesImportFreshReviewRequestAccepted: true,
				localUpdatesImportFreshReviewRequestRequested: true,
				localUpdatesImportFreshReviewRequestResult:
					'fresh_review_request_accepted_for_admin_review',
				localUpdatesImportFreshReviewRequestAction:
					'request_admin_review',
				localUpdatesImportFreshReviewRequestRestRoute:
					'post_fresh_review_request',
				localUpdatesImportFreshReviewRequestClaimsSaved: false,
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
					chronologyText:
						'turn0147-accepted-status-raw-content-marker',
					headline: 'turn0147-accepted-status-hidden-proof',
				},
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
			/>
		);

		expect( screen.getByText( 'Fresh review required' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Protected changes need hash-only admin review before Save can continue. Risky block evidence remains redacted until the review surface opens. No normal Save has run; protected local changes remain exportable.'
			)
		).toBeVisible();
		expect(
			screen.getByText(
				'Fresh-review Save confirmation was recorded; use WordPress save-authority evidence to confirm persistence. Recorded 4 redacted transcript events; 2 unsafe entries were dropped. This transcript is diagnostic only; save authority evidence is still required before treating these changes as saved.'
			)
		).toBeVisible();
		const preSaveStatus = screen.getByTestId(
			'distributed-editing-pre-save-status'
		);

		expect( preSaveStatus ).toHaveAttribute(
			'data-distributed-editing-fresh-review-surface',
			DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_PUBLISH_REVIEW
		);
		expect( preSaveStatus ).toHaveAttribute(
			'data-distributed-editing-fresh-review-action',
			'open_pre_publish_review'
		);
		expect( preSaveStatus ).toHaveAttribute(
			'data-distributed-editing-fresh-review-blocks-normal-save',
			'true'
		);
		expect( preSaveStatus ).toHaveAttribute(
			'data-distributed-editing-fresh-review-redacted',
			'true'
		);
		expect(
			screen.getByTestId( 'distributed-editing-fresh-review-authority' )
		).toHaveTextContent( 'Review required' );
		expect(
			screen.queryByRole( 'button', {
				name: 'Request fresh review',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(
				/retry save applied|post saved|saved successfully|changes are saved/i
			)
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(
				/proof_signature|reviewer_user_id|reviewed_block_items|turn0147-accepted-status-hidden-proof|turn0147-accepted-status-raw-content-marker/i
			)
		).not.toBeInTheDocument();
	} );

	it( 'renders requested fresh-review decision readiness without raw descriptor content', () => {
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				pendingChangeCount: 1,
				canExportLocalUpdates: true,
				localUpdatesImportStatus:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_STATUSES.BLOCKED,
				localUpdatesImportReason:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
				localUpdatesImportReviewRequestStatus:
					DISTRIBUTED_EDITING_LOCAL_UPDATES_REVIEW_REQUEST_STATUSES.REQUESTED,
				localUpdatesImportFreshReviewRequestAccepted: true,
				localUpdatesImportFreshReviewRequestRequested: true,
				localUpdatesImportFreshReviewRequestResult:
					'fresh_review_request_accepted_for_admin_review',
				localUpdatesImportFreshReviewDecisionStatus:
					DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.AWAITING_REVIEW,
				localUpdatesImportFreshReviewDecisionPanelRequired: true,
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
					chronologyText: 'turn0147-decision-raw-content-marker',
					headline: 'turn0147-decision-hidden-proof',
				},
				localUpdatesImportFreshReviewDecisionItems: [
					{
						id: 'fresh-risk-html',
						blockLabel: 'Custom HTML change',
						proposedContentHash:
							'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
						rawBlockContent:
							'<script>fresh-review-raw-content</script>',
						proofSignature: 'fresh-review-proof-signature',
						reviewerId: 7,
					},
				],
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
			/>
		);

		expect( screen.getByText( 'Fresh review required' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Protected changes need hash-only admin review before Save can continue. 1 risky block is represented only by redacted review evidence. No normal Save has run; protected local changes remain exportable.'
			)
		).toBeVisible();
		const preSaveStatus = screen.getByTestId(
			'distributed-editing-pre-save-status'
		);

		expect( preSaveStatus ).toHaveAttribute(
			'data-distributed-editing-fresh-review-review-item-count',
			'1'
		);
		expect(
			screen.getByTestId( 'distributed-editing-fresh-review-authority' )
		).toHaveTextContent( '1 redacted item' );
		expect(
			screen.queryByText(
				/fresh-review-raw-content|fresh-review-proof-signature|reviewerId|reviewed_block_items/i
			)
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /save/i } )
		).not.toBeInTheDocument();
	} );

	it( 'renders fresh-review retry-save handoff validation without save actions or proof internals', () => {
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				pendingChangeCount: 1,
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
				localUpdatesImportFreshReviewDecisionResult:
					'fresh_review_decision_approved_for_retry_save',
				localUpdatesImportFreshReviewDecisionAccepted: true,
				localUpdatesImportFreshReviewDecisionSubmitted: true,
				localUpdatesImportFreshReviewDecisionDecision: 'approved',
				localUpdatesImportFreshReviewDecisionReviewedBlockItemCount: 1,
				localUpdatesImportFreshReviewRetrySaveHandoffStatus:
					DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.VALIDATING,
				localUpdatesImportFreshReviewRetrySaveHandoffValidating: true,
				localUpdatesImportFreshReviewRetrySaveHandoffExposesRawContent: false,
				localUpdatesImportFreshReviewRetrySaveHandoffExposesProofSignature: false,
				localUpdatesImportFreshReviewRetrySaveHandoffExposesReviewerIds: false,
				rawContent: '<script>fresh-review-handoff-raw</script>',
				proofSignature: 'fresh-review-handoff-proof',
				reviewerUserId: 7,
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
			/>
		);

		expect(
			screen.getByText(
				'The editor is validating hash-only fresh-review proof before WordPress updates the post. No normal Save has run; keep protected local changes exportable until validation finishes.'
			)
		).toBeVisible();
		const preSaveStatus = screen.getByTestId(
			'distributed-editing-pre-save-status'
		);

		expect( preSaveStatus ).toHaveAttribute(
			'data-distributed-editing-pre-save-placement',
			DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.SAVE_BUTTON_STATUS
		);
		expect( preSaveStatus ).toHaveAttribute(
			'data-distributed-editing-pre-save-status',
			DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.VALIDATING
		);
		expect( preSaveStatus ).toHaveAttribute(
			'data-distributed-editing-fresh-review-blocks-normal-save',
			'true'
		);
		expect( preSaveStatus ).toHaveAttribute(
			'data-distributed-editing-fresh-review-exportable',
			'true'
		);
		expect(
			screen.getByTestId( 'distributed-editing-fresh-review-authority' )
		).toHaveTextContent( 'Validating review' );
		expect(
			screen.queryByText(
				/fresh-review-handoff-raw|fresh-review-handoff-proof|reviewerUserId|reviewed_block_items/i
			)
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /save/i } )
		).not.toBeInTheDocument();
	} );

	it( 'renders fresh-review validation-required placement as pre-save review evidence', () => {
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				pendingChangeCount: 1,
				hasPendingChanges: true,
				canExportLocalUpdates: true,
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
				localUpdatesImportFreshReviewDecisionReviewedBlockItemCount: 2,
				localUpdatesImportFreshReviewRetrySaveHandoffStatus:
					DISTRIBUTED_EDITING_FRESH_REVIEW_RETRY_SAVE_HANDOFF_STATUSES.READY,
				localUpdatesImportFreshReviewRetrySaveHandoffReady: true,
				rawContent: '<script>fresh-review-validation-raw</script>',
				proofSignature: 'fresh-review-validation-proof',
				reviewerUserId: 7,
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
			/>
		);

		expect(
			screen.getByText( 'Fresh review validation required' )
		).toBeVisible();
		expect(
			screen.getByText(
				'Reviewed changes need WordPress validation before Save can continue. Save should continue only after fresh-review validation; no normal Save fallback has run, and protected local changes remain exportable.'
			)
		).toBeVisible();
		const preSaveStatus = screen.getByTestId(
			'distributed-editing-pre-save-status'
		);

		expect( preSaveStatus ).toHaveAttribute(
			'data-distributed-editing-pre-save-placement',
			DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_PLACEMENTS.PRE_SAVE_STATUS
		);
		expect( preSaveStatus ).toHaveAttribute(
			'data-distributed-editing-pre-save-status',
			DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.VALIDATION_REQUIRED
		);
		expect( preSaveStatus ).toHaveAttribute(
			'data-distributed-editing-fresh-review-review-item-count',
			'2'
		);
		expect(
			screen.getByTestId( 'distributed-editing-fresh-review-authority' )
		).toHaveTextContent( 'Validation required' );
		expect(
			screen.getByTestId( 'distributed-editing-fresh-review-authority' )
		).toHaveTextContent( '2 redacted items' );
		expect(
			screen.queryByText(
				/fresh-review-validation-raw|fresh-review-validation-proof|reviewerUserId|reviewed_block_items/i
			)
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /save/i } )
		).not.toBeInTheDocument();
	} );

	it( 'renders fresh-review retry-save success without proof internals', () => {
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				retrySaveServerVersion: '13',
				retrySavePreviousServerVersion: '12',
				retrySaveSavesPost: true,
				retrySaveMutatesPostContent: true,
				retrySaveCreatesRevision: true,
				retrySaveClaimsSaved: true,
				retrySaveRevisionCreated: true,
				retrySaveCreatedRevisionIds: [ 9013 ],
				retrySaveFreshReviewConsumeValidationAccepted: true,
				retrySaveFreshReviewDecisionConsumptionValidated: true,
				retrySaveFreshReviewReviewedBlockItemCount: 1,
				retrySaveFreshReviewRequestRecordId: 'fresh-review-request-123',
				retrySaveFreshReviewProposedContentHash:
					'0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
				rawContent: '<script>fresh-review-success-raw</script>',
				proofSignature: 'fresh-review-success-proof',
				reviewerUserId: 7,
			} );
		const surfaceItems =
			getDistributedEditingStatusSurfaceItems( noticeDescriptors );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
			/>
		);

		expect(
			screen.getByText( 'Fresh-review Save confirmed' )
		).toBeVisible();
		expect(
			screen.getByText(
				'WordPress confirmed fresh-review Save, advanced the sync version from 12 to 13, and recorded 1 revision. Protected local changes are no longer pending for this save.'
			)
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: /Export|Refresh|Save/i } )
		).not.toBeInTheDocument();
		expect( JSON.stringify( surfaceItems ) ).not.toMatch(
			/fresh-review-request-123|0123456789abcdef|fresh-review-success-raw|fresh-review-success-proof|reviewerUserId/i
		);
	} );

	it( 'renders fresh-review retry-save rejections with export and refetch protection', () => {
		const cases = [
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED,
				title: 'Fresh-review Save needs the latest post',
				message:
					'The server changed after fresh review was validated. Protected local changes are still exportable; get the latest post before trying again.',
				refetch: true,
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
				reasonCode: DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_PERMISSION_DENIED,
				title: 'Fresh-review Save needs permission',
				message:
					'Permission changed before the reviewed changes could be saved. Protected local changes are still exportable for another fresh review or a later retry.',
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_FEATURE_DISABLED,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_FEATURE_DISABLED,
				title: 'Fresh-review Save disabled',
				message:
					'Distributed Editing was disabled before the reviewed changes could be saved. Protected local changes are still exportable for a later retry.',
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_ROUTE_MISMATCH,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.REST_POST_INVALID_ID,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_ROUTE_MISMATCH,
				title: 'Fresh-review Save route changed',
				message:
					'The reviewed Save request targeted a different editor route. Protected local changes are still exportable; reload only after exporting them.',
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
				title: 'Fresh-review Save needs HTML review',
				message:
					'The authoritative post was not updated because the server still requires HTML review. Export a new review handoff, or get the latest post before deciding how to continue. Protected local changes remain exportable.',
				nextStep:
					'Export a new review handoff for someone with unfiltered HTML permission.',
				nextStepAction: 'export_fresh_review_for_html_review',
				refetch: true,
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_SYNC_META_TAMPERED,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED,
				title: 'Fresh-review Save proof rejected',
				message:
					'WordPress rejected the reviewed Save proof before saving. Protected local changes are still exportable for a new review; no normal save fallback was used.',
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_MALFORMED_SYNC_PAYLOAD,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD,
				title: 'Fresh-review Save payload rejected',
				message:
					'The reviewed Save payload was incomplete or malformed. Protected local changes are still exportable for a new review before trying again.',
			},
		];
		const onAction = jest.fn();
		const renderStatus = ( statusCase ) => {
			const noticeDescriptors =
				getDistributedEditingNoticeDescriptorsForSessionState( {
					disposition: statusCase.disposition,
					reasonCode: statusCase.reasonCode,
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					requiresServerStateRefetch: Boolean( statusCase.refetch ),
					retrySaveStatus: statusCase.retrySaveStatus,
					retrySaveReason: statusCase.reasonCode,
					retrySaveFreshReviewConsumeValidationAccepted: true,
					retrySaveFreshReviewDecisionConsumptionValidated: true,
					retrySaveFreshReviewReviewedBlockItemCount: 1,
					retrySaveFreshReviewRequestRecordId:
						'fresh-review-request-123',
					retrySaveFreshReviewProposedContentHash:
						'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
					rawContent: '<script>fresh-review-rejected-raw</script>',
					proofSignature: 'fresh-review-rejected-proof',
					reviewerUserId: 7,
				} );

			expect(
				JSON.stringify(
					getDistributedEditingStatusSurfaceItems( noticeDescriptors )
				)
			).not.toMatch(
				/fresh-review-request-123|abcdef0123456789|fresh-review-rejected-raw|fresh-review-rejected-proof|reviewerUserId/i
			);

			return (
				<DistributedEditingStatusSurface
					noticeDescriptors={ noticeDescriptors }
					onAction={ onAction }
				/>
			);
		};

		const { rerender } = render( renderStatus( cases[ 0 ] ) );

		for ( const statusCase of cases ) {
			rerender( renderStatus( statusCase ) );
			expect( screen.getByText( statusCase.title ) ).toBeVisible();
			expect( screen.getByText( statusCase.message ) ).toBeVisible();
			expect(
				screen.getByRole( 'button', {
					name: 'Export for fresh review',
				} )
			).toBeVisible();
			expect(
				screen.queryByText(
					/fresh-review-rejected-raw|fresh-review-rejected-proof|reviewerUserId|reviewed_block_items/i
				)
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: /^Save$/i } )
			).not.toBeInTheDocument();
		}

		for ( const statusCase of cases.filter( ( item ) => item.nextStep ) ) {
			rerender( renderStatus( statusCase ) );
			expect( screen.getByText( 'Next step:' ) ).toBeVisible();
			expect( screen.getByText( statusCase.nextStep ) ).toBeVisible();
			const freshReviewStatusItem = screen
				.getByText( statusCase.title )
				// eslint-disable-next-line testing-library/no-node-access
				.closest( '[data-distributed-editing-next-step]' );
			expect( freshReviewStatusItem ).toHaveAttribute(
				'data-distributed-editing-next-step',
				statusCase.nextStepAction
			);
		}

		rerender( renderStatus( cases[ 0 ] ) );
		expect(
			screen.getAllByRole( 'button', {
				name: 'Get latest post',
			} ).length
		).toBeGreaterThan( 0 );
	} );

	it( 'renders consumed fresh-review lifecycle as redacted replay guidance', () => {
		const onAction = jest.fn();
		const noticeDescriptors = [
			{
				id: 'fresh-review-consumed-replay',
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.RETRY_SAVE,
				status: 'error',
				actionKeys: [
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.EXPORT_LOCAL_UPDATES,
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
				],
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED,
				retrySaveReason:
					'fresh_review_decision_already_consumed_for_retry_save',
				retrySaveFreshReviewConsumed: true,
				retrySaveFreshReviewRetrySaveRejected: true,
				retrySaveFreshReviewReviewedBlockItemCount: 2,
				retrySaveFreshReviewDecisionLifecycleStatus: 'already_consumed',
				retrySaveFreshReviewDecisionLifecycleAction:
					'request_new_fresh_review',
				retrySaveFreshReviewRequestRecordId:
					'fresh-review-consumed-record',
				retrySaveFreshReviewProposedContentHash:
					'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
				rawContent: '<script>fresh-review-consumed-raw</script>',
				proofSignature: 'fresh-review-consumed-proof',
				reviewerUserId: 7,
			},
		];
		const surfaceItems =
			getDistributedEditingStatusSurfaceItems( noticeDescriptors );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
				onAction={ onAction }
			/>
		);

		expect(
			screen.getByText( 'Fresh-review decision already consumed' )
		).toBeVisible();
		expect(
			screen.getByText(
				'This fresh-review decision was already used by WordPress Save. Protected local changes remain exportable; request a new fresh review or get the latest post before continuing.'
			)
		).toBeVisible();

		const authorityStatus = screen.getByTestId(
			'distributed-editing-fresh-review-authority'
		);
		const statusItem = screen.getByTestId(
			'distributed-editing-fresh-review-status'
		);

		expect( statusItem ).toHaveAttribute(
			'data-distributed-editing-fresh-review-lifecycle',
			'already_consumed'
		);
		expect( statusItem ).toHaveAttribute(
			'data-distributed-editing-fresh-review-action',
			'request_new_fresh_review'
		);
		expect( statusItem ).toHaveAttribute(
			'data-distributed-editing-fresh-review-review-item-count',
			'2'
		);
		expect( statusItem ).toHaveAttribute(
			'data-distributed-editing-fresh-review-redacted',
			'true'
		);
		expect( authorityStatus ).toHaveTextContent( 'Already consumed' );
		expect( authorityStatus ).toHaveTextContent( '2 redacted items' );
		expect(
			screen.getByRole( 'button', {
				name: 'Export for fresh review',
			} )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', {
				name: 'Get latest post',
			} )
		).toBeVisible();
		expect(
			screen.queryByText(
				/fresh-review-consumed-record|aaaaaaaaaaaaaaaa|fresh-review-consumed-raw|fresh-review-consumed-proof|reviewerUserId/i
			)
		).not.toBeInTheDocument();
		expect( JSON.stringify( surfaceItems ) ).not.toMatch(
			/fresh-review-consumed-record|aaaaaaaaaaaaaaaa|fresh-review-consumed-raw|fresh-review-consumed-proof|reviewerUserId/i
		);
		expect(
			screen.queryByRole( 'button', { name: /^Save$/i } )
		).not.toBeInTheDocument();
	} );

	it( 'renders the internal fresh-review decision panel with approve and reject controls', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			sessionState: {
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
				localUpdatesImportFreshReviewDecisionStatus:
					DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.AWAITING_REVIEW,
				localUpdatesImportFreshReviewDecisionPanelRequired: true,
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
					chronologyText:
						'turn0147-internal-panel-raw-content-marker',
					headline: 'turn0147-internal-panel-hidden-proof',
				},
				localUpdatesImportFreshReviewDecisionItems: [
					{
						id: 'fresh-approve',
						blockClientId: 'fresh-approve-client',
						blockName: 'core/paragraph',
						blockLabel: 'Approve paragraph change',
						baseContentHash:
							'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
						proposedContentHash:
							'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
						baseSerializedBlock:
							'<!-- wp:paragraph --><p>Base review paragraph.</p><!-- /wp:paragraph -->',
						proposedSerializedBlock:
							'<!-- wp:paragraph --><p>Approved review paragraph.</p><!-- /wp:paragraph -->',
						privacyClass: 'synthetic-content',
					},
					{
						id: 'fresh-reject',
						blockClientId: 'fresh-reject-client',
						blockLabel: 'Reject HTML change',
						baseContentHash:
							'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
						proposedContentHash:
							'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
						rawBlockContent:
							'<script>fresh-reject-raw-content</script>',
					},
				],
			},
		} );

		render( <DistributedEditingFreshReviewDecisionPanel /> );

		expect(
			screen.getByRole( 'group', {
				name: 'Distributed editing fresh review decisions',
			} )
		).toBeVisible();
		expect( screen.getByText( 'Fresh review decisions' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Fresh-review Save confirmation was recorded; use WordPress save-authority evidence to confirm persistence. Recorded 4 redacted transcript events; 2 unsafe entries were dropped. This transcript is diagnostic only; save authority evidence is still required before treating these changes as saved.'
			)
		).toBeVisible();
		expect( screen.getByText( 'Awaiting review' ) ).toBeVisible();
		expect( screen.getByText( 'Approve paragraph change' ) ).toBeVisible();
		expect( screen.getByText( 'Reject HTML change' ) ).toBeVisible();
		expect(
			screen.getAllByText(
				'Activity context: Fresh-review Save confirmed; 4 redacted transcript events, 2 unsafe entries dropped. Diagnostic only; save-authority evidence is still required.'
			)
		).toHaveLength( 2 );
		expect( screen.getAllByText( 'Jump target identified.' ) ).toHaveLength(
			2
		);
		expect(
			screen.getAllByText( 'Compare evidence available.' )
		).toHaveLength( 1 );
		expect(
			screen.getAllByText( 'Read-only comparison available.' )
		).toHaveLength( 1 );
		expect(
			screen.getAllByText(
				'Read-only comparison unavailable for this review item.'
			)
		).toHaveLength( 1 );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Inspect jump target for Approve paragraph change',
			} )
		);

		expect(
			actions.__experimentalResolveDistributedEditingFreshReviewDecisionItem
		).not.toHaveBeenCalled();
		expect(
			screen.getByText(
				'Jump target checked. The editor found a block target for this review item; no block was selected, no focus moved, and no save was made.'
			)
		).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Inspect compare evidence for Approve paragraph change',
			} )
		);

		expect(
			actions.__experimentalResolveDistributedEditingFreshReviewDecisionItem
		).not.toHaveBeenCalled();
		expect(
			screen.getByText(
				'Read-only comparison opened. The editor shows safe base and proposed block text below; no content changed, no save was made, and no server request was sent.'
			)
		).toBeVisible();
		expect(
			screen.getByRole( 'group', {
				name: 'Distributed editing fresh review comparison for Approve paragraph change',
			} )
		).toHaveAttribute(
			'data-distributed-editing-fresh-review-comparison-surface-read-only',
			'true'
		);
		expect( screen.getByText( /Base review paragraph/ ) ).toBeVisible();
		expect( screen.getByText( /Approved review paragraph/ ) ).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Back to review',
			} )
		);

		await user.click(
			screen.getByRole( 'button', {
				name: 'Approve Approve paragraph change',
			} )
		);
		await user.click(
			screen.getByRole( 'button', {
				name: 'Reject Reject HTML change',
			} )
		);

		expect(
			actions.__experimentalResolveDistributedEditingFreshReviewDecisionItem
		).toHaveBeenCalledWith( {
			reviewItemId: 'fresh-approve',
			decision: 'approved',
			rejectionReason: null,
		} );
		expect(
			actions.__experimentalResolveDistributedEditingFreshReviewDecisionItem
		).toHaveBeenCalledWith( {
			reviewItemId: 'fresh-reject',
			decision: 'rejected',
			rejectionReason: 'reviewer_rejected',
		} );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRequestDistributedEditingFreshReviewForImportedLocalUpdates
		).not.toHaveBeenCalled();
		expect(
			screen.queryByText(
				/fresh-approve-raw-content|fresh-reject-raw-content|proofSignature|reviewerId|postContent/i
			)
		).not.toBeInTheDocument();
		expect(
			await screen.findByText(
				'Fresh-review decision recorded locally. No save was made, and the reviewed-block evidence remains hash-only.'
			)
		).toBeVisible();
	} );

	it( 'submits ready fresh-review decisions from the internal panel', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			sessionState: {
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
				localUpdatesImportFreshReviewDecisionStatus:
					DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.READY,
				localUpdatesImportFreshReviewDecisionPanelRequired: true,
				localUpdatesImportFreshReviewDecisionItems: [
					{
						id: 'fresh-ready',
						blockLabel: 'Ready HTML change',
						proposedContentHash:
							'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
						reviewStatus: 'approved_for_retry_save',
					},
				],
			},
		} );

		render( <DistributedEditingFreshReviewDecisionPanel /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Submit decision' } )
		);

		expect(
			actions.__experimentalSubmitDistributedEditingFreshReviewDecision
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			await screen.findByText(
				'Fresh-review decision recorded for the request. No save was made, and the reviewed-block evidence remained hash-only.'
			)
		).toBeVisible();
	} );

	it( 'renders the fresh-review decision panel in the pre-publish slot', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			sessionState: {
				pendingChangeCount: 1,
				hasPendingChanges: true,
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
				localUpdatesImportFreshReviewDecisionStatus:
					DISTRIBUTED_EDITING_FRESH_REVIEW_DECISION_STATUSES.AWAITING_REVIEW,
				localUpdatesImportFreshReviewDecisionPanelRequired: true,
				localUpdatesImportFreshReviewDecisionItems: [
					{
						id: 'fresh-pre-publish',
						blockLabel: 'Pre-publish HTML change',
						proposedContentHash:
							'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
						rawBlockContent:
							'<script>fresh-pre-publish-raw</script>',
						reviewerUserId: 7,
						proofSignature: 'fresh-pre-publish-proof',
					},
				],
			},
		} );

		render(
			<SlotFillProvider>
				<DistributedEditingFreshReviewPrePublishPanel />
				<PluginPrePublishPanel.Slot />
			</SlotFillProvider>
		);

		expect(
			screen.getByText( 'Distributed Editing fresh review' )
		).toBeVisible();
		const panel = screen.getByTestId(
			'distributed-editing-fresh-review-pre-publish-panel'
		);

		expect( panel ).toHaveAttribute(
			'data-distributed-editing-fresh-review-redacted',
			'true'
		);
		expect( panel ).toHaveAttribute(
			'data-distributed-editing-fresh-review-blocks-normal-save',
			'true'
		);
		expect( panel ).toHaveAttribute(
			'data-distributed-editing-fresh-review-review-item-count',
			'1'
		);
		expect( panel ).toHaveAttribute(
			'data-distributed-editing-pre-save-status',
			DISTRIBUTED_EDITING_FRESH_REVIEW_PRE_SAVE_STATUSES.REVIEW_REQUIRED
		);
		expect(
			screen.getByRole( 'group', {
				name: 'Distributed editing fresh review decisions',
			} )
		).toBeVisible();
		expect( screen.getByText( 'Pre-publish HTML change' ) ).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Approve Pre-publish HTML change',
			} )
		);

		expect(
			actions.__experimentalResolveDistributedEditingFreshReviewDecisionItem
		).toHaveBeenCalledWith( {
			reviewItemId: 'fresh-pre-publish',
			decision: 'approved',
			rejectionReason: null,
		} );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			screen.queryByText(
				/fresh-pre-publish-raw|fresh-pre-publish-proof|reviewerUserId/i
			)
		).not.toBeInTheDocument();
		expect(
			await screen.findByText(
				'Fresh-review decision recorded locally. No save was made, and the reviewed-block evidence remains hash-only.'
			)
		).toBeVisible();
	} );

	it( 'does not mount the fresh-review pre-publish panel without fresh-review state', () => {
		setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect();

		render(
			<SlotFillProvider>
				<DistributedEditingFreshReviewPrePublishPanel />
				<PluginPrePublishPanel.Slot />
			</SlotFillProvider>
		);

		expect(
			screen.queryByText( 'Distributed Editing fresh review' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByTestId(
				'distributed-editing-fresh-review-pre-publish-panel'
			)
		).not.toBeInTheDocument();
	} );

	it( 'renders retry-submit save readiness without claiming completion', () => {
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				pendingChangeCount: 1,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
				retrySubmitAccepted: true,
				retrySubmitSavePathRequired: true,
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				retrySubmitSavePrepared: true,
				retrySubmitSaveReady: true,
				canExportLocalUpdates: true,
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
			/>
		);

		expect( screen.getByText( 'Changes pending' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Save is prepared for WordPress. Local changes remain pending until Save finishes.'
			)
		).toBeVisible();
		expect( screen.queryByText( /saved/i ) ).not.toBeInTheDocument();
	} );

	it( 'renders guarded retry-save progress and confirmed states', () => {
		const savingDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				pendingChangeCount: 1,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
				canExportLocalUpdates: true,
			} );
		const savedDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				retrySaveClaimsSaved: true,
			} );
		const mergedSavedDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVED,
				retrySaveAccepted: true,
				retrySaveClaimsSaved: true,
				retrySaveConfirmedMergedEdits: true,
			} );

		const { rerender } = render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ savingDescriptors }
			/>
		);

		expect( screen.getByText( 'Saving to WordPress' ) ).toBeVisible();
		expect(
			screen.getByText(
				'The editor is sending the prepared changes to WordPress. Keep this tab open; protected local changes remain exportable until WordPress confirms the save.'
			)
		).toBeVisible();

		rerender(
			<DistributedEditingStatusSurface
				noticeDescriptors={ savedDescriptors }
			/>
		);

		expect( screen.getByText( 'Save confirmed' ) ).toBeVisible();
		expect(
			screen.getByText(
				'WordPress saved the prepared changes. Protected local changes are no longer pending for this save.'
			)
		).toBeVisible();

		rerender(
			<DistributedEditingStatusSurface
				noticeDescriptors={ mergedSavedDescriptors }
			/>
		);

		expect( screen.getByText( 'Save confirmed' ) ).toBeVisible();
		expect(
			screen.getByText(
				'WordPress saved the merged edits. Protected local changes are no longer pending for this save.'
			)
		).toBeVisible();
	} );

	it( 'renders guarded retry-save stale and tampered rejection states', () => {
		const staleDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				pendingChangeCount: 1,
				requiresServerStateRefetch: true,
				canExportLocalUpdates: true,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.STALE_BASE_REJECTED,
				retrySaveReason:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
			} );
		const tamperedDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_SYNC_META_TAMPERED,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
				pendingChangeCount: 1,
				canExportLocalUpdates: true,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED,
				retrySaveReason:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
			} );

		const { rerender } = render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ staleDescriptors }
			/>
		);

		expect(
			screen.getAllByText( 'Save needs the latest post' )
		).toHaveLength( 2 );
		expect(
			screen.getAllByText(
				'The post changed again before Save finished. Protected local changes are still exportable; get the latest post before trying again.'
			)
		).toHaveLength( 2 );

		rerender(
			<DistributedEditingStatusSurface
				noticeDescriptors={ tamperedDescriptors }
			/>
		);

		expect( screen.getByText( 'Save proof rejected' ) ).toBeVisible();
		expect(
			screen.getByText(
				'WordPress rejected the Save proof because the sync metadata or proof flags changed unexpectedly. Protected local changes are still exportable; export them before continuing.'
			)
		).toBeVisible();
	} );

	it( 'renders guarded retry-save actionable rejection copy', () => {
		const cases = [
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
				reasonCode: DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_PERMISSION_DENIED,
				title: 'Save permission changed',
				message:
					'Editing permission changed before Save finished. Protected local changes are still exportable; ask for access before trying again.',
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_PERMISSION_DENIED,
				title: 'Save needs HTML permission',
				message:
					'The HTML review proof was accepted, but this account cannot perform the final HTML-capable save. Protected local changes and the hash-only review proof remain exportable for someone with unfiltered HTML permission.',
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_FEATURE_DISABLED,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_FEATURE_DISABLED,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_FEATURE_DISABLED,
				title: 'Save disabled',
				message:
					'Distributed Editing was disabled before Save finished. Protected local changes are still exportable; try again after Distributed Editing is enabled.',
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_ROUTE_MISMATCH,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.REST_POST_INVALID_ID,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_ROUTE_MISMATCH,
				title: 'Save route changed',
				message:
					'The Save request targeted a different editor route. Protected local changes are still exportable; reload the editor only after exporting them.',
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_MALFORMED_SYNC_PAYLOAD,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD,
				title: 'Save payload rejected',
				message:
					'The Save payload was incomplete or malformed. Protected local changes are still exportable; export them before trying again.',
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_MALFORMED_SYNC_PAYLOAD,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD,
				retrySaveReason:
					'unknown_retry_save_review_approval_proof_token',
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD,
				title: 'Reviewed changes token unavailable',
				message:
					'The imported reviewed-changes token could not be found in server storage and is no longer usable for Save. No server save was made. Export a fresh-review handoff for an admin reviewer; protected local changes remain exportable.',
				exportLabel: 'Export for fresh review',
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_SYNC_META_TAMPERED,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
				retrySaveReason:
					'retry_save_review_approval_proof_token_expired',
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED,
				title: 'Reviewed changes token expired',
				message:
					'The imported reviewed-changes token has expired and is no longer usable for Save. No server save was made. Export a fresh-review handoff for an admin reviewer; protected local changes remain exportable.',
				exportLabel: 'Export for fresh review',
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
				title: 'HTML review required before Save',
				message:
					'Save did not update the authoritative post because these changes may alter unfiltered HTML. Export them for review by someone with unfiltered HTML permission, or get the latest post before deciding how to continue. Protected local changes remain exportable.',
				exportLabel: 'Export changes for review',
				nextStep:
					'Export changes for review by someone with unfiltered HTML permission.',
				nextStepAction: 'export_for_html_review',
				refetch: true,
			},
		];
		const onAction = jest.fn();
		const renderStatus = ( statusCase ) => (
			<DistributedEditingStatusSurface
				noticeDescriptors={ getDistributedEditingNoticeDescriptorsForSessionState(
					{
						disposition: statusCase.disposition,
						reasonCode: statusCase.reasonCode,
						pendingChangeCount: 1,
						canExportLocalUpdates: true,
						retrySaveStatus: statusCase.retrySaveStatus,
						retrySaveReason:
							statusCase.retrySaveReason || statusCase.reasonCode,
					}
				) }
				onAction={ onAction }
			/>
		);

		const { rerender } = render( renderStatus( cases[ 0 ] ) );

		for ( const statusCase of cases ) {
			rerender( renderStatus( statusCase ) );
			expect( screen.getByText( statusCase.title ) ).toBeVisible();
			expect( screen.getByText( statusCase.message ) ).toBeVisible();
			expect(
				screen.getByText(
					statusCase.exportLabel || 'Export local changes'
				)
			).toBeVisible();
		}

		for ( const statusCase of cases.filter( ( item ) => item.nextStep ) ) {
			rerender( renderStatus( statusCase ) );
			expect( screen.getByText( 'Next step:' ) ).toBeVisible();
			expect( screen.getByText( statusCase.nextStep ) ).toBeVisible();
			const retrySaveReviewStatusItem = screen
				.getByText( statusCase.title )
				// eslint-disable-next-line testing-library/no-node-access
				.closest( '[data-distributed-editing-next-step]' );
			expect( retrySaveReviewStatusItem ).toHaveAttribute(
				'data-distributed-editing-next-step',
				statusCase.nextStepAction
			);
		}

		rerender(
			renderStatus( cases.find( ( statusCase ) => statusCase.refetch ) )
		);
		expect( screen.getByText( 'Get latest post' ) ).toBeVisible();
	} );

	it( 'renders blocked retry-save handoff copy and actions', () => {
		const cases = [
			{
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_PROOF_NOT_ACCEPTED,
				title: 'Save needs accepted proof',
				message:
					'The editor could not verify accepted Save proof for this save. Protected local changes are still exportable; try again after the proof is ready.',
				nextStep:
					'Try Save again after WordPress accepts the Save proof.',
				nextStepAction: 'wait_for_save_proof',
			},
			{
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
				title: 'Save needs the latest post',
				message:
					'Getting the latest post only refreshes server state; it does not discard protected local changes or save over other edits. Try Save again after it loads.',
				nextStep: 'Get the latest post before trying Save again.',
				nextStepAction: 'get_latest_post',
				refetch: true,
			},
			{
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.MISSING_POST_ROUTE,
				title: 'Save route unavailable',
				message:
					'The editor could not identify the route for Save. Protected local changes are still exportable; reload the editor only after exporting them.',
				nextStep: 'Export local changes, then reload the editor.',
				nextStepAction: 'export_then_reload',
			},
			{
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.MISSING_PROPOSED_CONTENT,
				title: 'Save content unavailable',
				message:
					'The editor could not read the proposed post content for Save. Protected local changes are still exportable; export them before trying again.',
				nextStep: 'Export local changes, then try Save again.',
				nextStepAction: 'export_then_save',
			},
			{
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS,
				title: 'Save already in progress',
				message:
					'Save is already waiting for WordPress confirmation. Protected local changes remain exportable; keep this tab open until it finishes.',
				nextStep: 'Keep this tab open until WordPress confirms Save.',
				nextStepAction: 'keep_tab_open',
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
			},
		];
		const onAction = jest.fn();
		const renderStatus = ( statusCase ) => (
			<DistributedEditingStatusSurface
				noticeDescriptors={ getDistributedEditingNoticeDescriptorsForSessionState(
					{
						pendingChangeCount: 1,
						hasPendingChanges: true,
						canExportLocalUpdates: true,
						retrySaveStatus:
							statusCase.retrySaveStatus ||
							DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
						retrySaveHandoffStatus:
							DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
						retrySaveHandoffReason: statusCase.reason,
						retrySaveHandoffBlocksNormalSave: true,
					}
				) }
				onAction={ onAction }
			/>
		);

		const { rerender } = render( renderStatus( cases[ 0 ] ) );

		for ( const statusCase of cases ) {
			rerender( renderStatus( statusCase ) );
			expect( screen.getByText( statusCase.title ) ).toBeVisible();
			expect( screen.getByText( statusCase.message ) ).toBeVisible();
			expect( screen.getByText( 'Next step:' ) ).toBeVisible();
			expect( screen.getByText( statusCase.nextStep ) ).toBeVisible();
			const blockedHandoffStatusItem = screen
				.getByText( statusCase.title )
				// eslint-disable-next-line testing-library/no-node-access
				.closest( '[data-distributed-editing-next-step]' );
			expect( blockedHandoffStatusItem ).toHaveAttribute(
				'data-distributed-editing-next-step',
				statusCase.nextStepAction
			);
			expect( screen.getByText( 'Export local changes' ) ).toBeVisible();
		}

		rerender( renderStatus( cases[ 1 ] ) );
		expect( screen.getByText( 'Get latest post' ) ).toBeVisible();
	} );

	it( 'renders stale retry-submit proof after prepared handoff', () => {
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				pendingChangeCount: 1,
				remoteChangeCount: 1,
				requiresServerStateRefetch: true,
				canExportLocalUpdates: true,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.STALE_BASE_REJECTED,
				retrySubmitProofReason:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
			/>
		);

		expect( screen.getByText( 'WordPress check is stale' ) ).toBeVisible();
		expect(
			screen.getByText(
				'The post changed after WordPress checked these changes. Protected local changes remain exportable; get the latest post before continuing.'
			)
		).toBeVisible();
	} );

	it( 'renders manual resolution for missing sync metadata', () => {
		const noticeDescriptors =
			getDistributedEditingNoticeDescriptorsForSessionState( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REQUIRES_MANUAL_RESOLUTION_NO_SYNC_META,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.SYNC_META_UNAVAILABLE_AFTER_REVISION_SCAN,
				canExportLocalUpdates: true,
			} );
		const unloadWarningState = {
			shouldWarn: true,
			reason: DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS.AWAITING_SERVER_CONFIRMATION,
			pendingChangeCount: 0,
		};

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
				unloadWarningState={ unloadWarningState }
			/>
		);

		expect(
			screen.getByText( 'Manual resolution required' )
		).toBeVisible();
		expect(
			screen.getByText( 'Sync metadata is unavailable.' )
		).toBeVisible();
		expect(
			screen.getByText(
				'Leaving now may lose unconfirmed local changes.'
			)
		).toBeVisible();
	} );
} );
