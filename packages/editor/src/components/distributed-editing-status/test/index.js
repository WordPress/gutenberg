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
	DistributedEditingEnabledShell,
	DistributedEditingLocalRebaseStateInspector,
	DistributedEditingPresenceRoster,
	DistributedEditingPresenceToolbar,
	DistributedEditingFreshReviewDecisionPanel,
	DistributedEditingFreshReviewPrePublishPanel,
	DistributedEditingLocalUpdatesImportControls,
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
	isEditedPostDirty = false,
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
			isEditedPostDirty: () => isEditedPostDirty,
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
		openPublishSidebar: jest.fn(),
		resetEditorBlocks: jest.fn(),
		receiveEntityRecords: jest.fn(),
		resetDistributedEditingSessionState: jest.fn(),
		setDistributedEditingSessionState: jest.fn(),
	};

	useDispatch.mockReturnValue( actions );

	return actions;
}

function DistributedEditingPresenceStatusHarness() {
	const { editorSettings, sessionState } = useSelect( ( select ) => {
		const { getDistributedEditingSessionState, getEditorSettings } = select(
			{ name: 'core/editor' }
		);

		return {
			editorSettings: getEditorSettings?.() || {},
			sessionState: getDistributedEditingSessionState?.() || {},
		};
	}, [] );

	return (
		<DistributedEditingPresenceRoster
			initialPresenceRoster={
				editorSettings.distributedEditing?.initialPresenceRoster
			}
			presenceRepeatedRefreshRuntime={
				editorSettings.distributedEditing
					?.presenceRepeatedRefreshRuntime
			}
			presenceStorageReadiness={
				editorSettings.distributedEditing?.presenceStorageReadiness
			}
			presenceStartupPolicy={
				editorSettings.distributedEditing?.presenceStartupPolicy
			}
			sessionState={ sessionState }
		/>
	);
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
				name: 'Run WordPress Save',
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
		expect( screen.getByText( 'Save check' ) ).toBeVisible();
		expect( screen.getByText( 'Retry accepted' ) ).toBeVisible();
		expect( screen.getByText( 'Retry save' ) ).toBeVisible();
		expect( screen.getByText( 'Retry save reason' ) ).toBeVisible();
		expect( screen.getByText( 'WordPress Save' ) ).toBeVisible();
		expect( screen.getByText( 'WordPress Save reason' ) ).toBeVisible();
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
		expect( screen.getByText( 'WordPress Save' ) ).toBeVisible();
		expect( screen.getByText( 'WordPress Save reason' ) ).toBeVisible();
		expect( screen.getByText( 'Idle' ) ).toBeVisible();
		expect( screen.getByText( 'none' ) ).toBeVisible();
		expect( screen.getByText( 'None' ) ).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Run WordPress Save',
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
				name: 'Run WordPress Save',
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
		expect( screen.getByText( 'Save needed' ) ).toBeVisible();
		expect(
			screen.getByText( '1 local change is awaiting confirmation.' )
		).toBeVisible();
	} );

	it( 'renders a modal same-block conflict review from safe text excerpts', () => {
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

		const dialog = screen.getByRole( 'dialog', {
			name: 'Review conflict',
		} );
		const comparison = within( dialog ).getByRole( 'region', {
			name: 'Distributed editing conflict comparison',
		} );

		expect(
			within( dialog ).getByText(
				'WordPress could not merge these edits automatically. Choose which version to keep.'
			)
		).toBeVisible();
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison',
			'same-block'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-read-only',
			'false'
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
			'data-distributed-editing-conflict-comparison-has-server',
			'true'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-has-local',
			'true'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-highlighted-block-count',
			'1'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-comparison-mode',
			'modal_two_version_review'
		);
		expect( comparison ).toHaveAttribute(
			'data-distributed-editing-conflict-resolution-next-step',
			'choose_version'
		);

		// eslint-disable-next-line testing-library/no-node-access
		const localPane = comparison.querySelector(
			'[data-distributed-editing-conflict-modal-pane="accept_local"]'
		);
		// eslint-disable-next-line testing-library/no-node-access
		const serverPane = comparison.querySelector(
			'[data-distributed-editing-conflict-modal-pane="accept_remote"]'
		);
		expect( localPane ).not.toBeNull();
		expect( serverPane ).not.toBeNull();
		expect( within( localPane ).getByText( 'Your version' ) ).toBeVisible();
		expect(
			within( serverPane ).getByText( 'WordPress version' )
		).toBeVisible();
		expect(
			within( localPane ).getByRole( 'button', {
				name: 'Keep mine and overwrite WordPress',
			} )
		).toHaveAttribute(
			'data-distributed-editing-conflict-modal-action',
			'accept_local'
		);
		expect(
			within( serverPane ).getByRole( 'button', {
				name: 'Use WordPress version',
			} )
		).toHaveAttribute(
			'data-distributed-editing-conflict-modal-action',
			'accept_remote'
		);
		expect( within( localPane ).getByText( 'Block 1' ) ).toBeVisible();
		expect(
			within( localPane ).getByText( 'Local paragraph edit & draft.' )
		).toBeVisible();
		expect( within( serverPane ).getByText( 'Block 1' ) ).toBeVisible();
		expect(
			within( serverPane ).getByText( 'Server paragraph edit & update.' )
		).toBeVisible();
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			localPane.querySelector(
				'[data-distributed-editing-conflict-modal-block="block-1"]'
			)
		).toHaveAttribute(
			'data-distributed-editing-conflict-modal-block-conflict',
			'true'
		);
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			serverPane.querySelector(
				'[data-distributed-editing-conflict-modal-block="block-1"]'
			)
		).toHaveAttribute(
			'data-distributed-editing-conflict-modal-block-conflict',
			'true'
		);

		expect(
			within( comparison ).queryByRole( 'button', {
				name: 'Check version',
			} )
		).not.toBeInTheDocument();
		expect(
			within( comparison ).queryByRole( 'button', {
				name: 'Continue Save',
			} )
		).not.toBeInTheDocument();
		expect(
			within( comparison ).queryByRole( 'button', {
				name: 'Export for review',
			} )
		).not.toBeInTheDocument();
		expect(
			within( comparison ).queryByRole( 'button', {
				name: 'Get latest post',
			} )
		).not.toBeInTheDocument();
		expect( comparison ).not.toHaveTextContent( '<p>' );
		expect( comparison ).not.toHaveTextContent( '<!-- wp:paragraph' );
	} );

	it( 'preserves inline formatting in the same-block conflict review', () => {
		setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editedPostContent:
				'<!-- wp:paragraph --><p>This is <strong>bold</strong> locally.<script>alert("x")</script></p><!-- /wp:paragraph -->',
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
					'<!-- wp:paragraph --><p>This is bold locally.</p><!-- /wp:paragraph -->',
				refetchedServerContent:
					'<!-- wp:paragraph --><p>This is <em>bold</em> remotely.</p><!-- /wp:paragraph -->',
			},
		} );

		render( <DistributedEditingStatus /> );

		const comparison = screen.getByRole( 'region', {
			name: 'Distributed editing conflict comparison',
		} );
		// eslint-disable-next-line testing-library/no-node-access
		const localPreview = comparison.querySelector(
			'[data-distributed-editing-conflict-modal-pane="accept_local"] [data-distributed-editing-conflict-modal-block-preview="formatted"]'
		);
		// eslint-disable-next-line testing-library/no-node-access
		const serverPreview = comparison.querySelector(
			'[data-distributed-editing-conflict-modal-pane="accept_remote"] [data-distributed-editing-conflict-modal-block-preview="formatted"]'
		);

		expect( localPreview ).not.toBeNull();
		expect( serverPreview ).not.toBeNull();
		// eslint-disable-next-line testing-library/no-node-access
		expect( localPreview.querySelector( 'strong' ) ).toHaveTextContent(
			'bold'
		);
		// eslint-disable-next-line testing-library/no-node-access
		expect( serverPreview.querySelector( 'em' ) ).toHaveTextContent(
			'bold'
		);
		// eslint-disable-next-line testing-library/no-node-access
		expect( localPreview.querySelector( 'script' ) ).toBeNull();
		expect( localPreview ).toHaveTextContent( 'This is bold locally.' );
		expect( serverPreview ).toHaveTextContent( 'This is bold remotely.' );
	} );

	it( 'saves the local version from the conflict modal through the guarded Save path', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		const editedPostContent =
			'<!-- wp:paragraph --><p>Local same block change.</p><!-- /wp:paragraph -->';

		setupDistributedEditingStatusSelect( {
			currentPost: { id: 42, type: 'post' },
			editedPostContent,
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
				name: 'Keep mine and overwrite WordPress',
			} )
		);

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
		await waitFor( () =>
			expect(
				actions.__experimentalRefreshDistributedEditingRetrySubmitProof
			).toHaveBeenCalledTimes( 1 )
		);
		expect(
			actions.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).toHaveBeenCalledWith(
			expect.objectContaining( {
				__experimentalDistributedEditingExplicitSaveClick: true,
				proposedPostContent: editedPostContent,
			} )
		);
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			await within( comparison ).findByText( 'Saved your version.' )
		).toBeVisible();
	} );

	it( 'can use the WordPress version for the local working copy without saving', async () => {
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
				name: 'Use WordPress version',
			} )
		);

		expect( actions.receiveEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'post',
			[
				expect.objectContaining( {
					id: 42,
					type: 'post',
					content: latestWordPressContent,
				} ),
			]
		);
		expect( actions.editPost ).toHaveBeenCalledWith(
			{ content: latestWordPressContent },
			{ undoIgnore: true }
		);
		expect(
			actions.setDistributedEditingSessionState
		).toHaveBeenCalledWith(
			expect.objectContaining( {
				disposition: DISTRIBUTED_EDITING_DISPOSITIONS.IDLE,
				requiresManualConflictResolution: false,
				pendingChangeCount: 0,
				hasPendingChanges: false,
				canExportLocalUpdates: false,
				readyToRetrySubmit: false,
				retrySubmitHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES.NONE,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.NONE,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
				staleBaseConflictResolutionStatus:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.NONE,
				staleBaseConflictResolutionChoice: null,
				staleBaseConflictResolutionRequiresFreshProof: false,
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
			within( comparison ).getByText( 'Using the WordPress version.' )
		).toBeVisible();
	} );

	it( 'renders a compact structural conflict summary for deleted blocks', () => {
		setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editedPostContent:
				'<!-- wp:paragraph --><p>Local keeps beta.</p><!-- /wp:paragraph -->',
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
				localRebaseResultReason: 'block_deleted',
				requiresManualConflictResolution: true,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base beta.</p><!-- /wp:paragraph -->',
				refetchedServerContent:
					'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph -->',
			},
		} );

		render( <DistributedEditingStatus /> );

		const summary = screen.getByRole( 'region', {
			name: 'Distributed editing structural conflict summary',
		} );

		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-conflict',
			'block_deleted'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-conflict-base-block-count',
			'2'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-conflict-server-block-count',
			'1'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-conflict-local-block-count',
			'1'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-conflict-server-count-delta',
			'-1'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-conflict-local-count-delta',
			'-1'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-conflict-calls-save',
			'false'
		);
		expect(
			within( summary ).getByText( 'Choose block structure' )
		).toBeVisible();
		expect(
			within( summary ).getByText(
				'Blocks were deleted in both versions. Choose which structure to keep.'
			)
		).toBeVisible();
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-details-open',
			'false'
		);
		const cueList = within( summary ).getByLabelText(
			'Distributed editing structural change summary'
		);
		expect( cueList ).toBeVisible();
		expect( within( cueList ).getByText( 'Starting post' ) ).toBeVisible();
		expect(
			within( cueList ).getByText( 'Saved WordPress structure' )
		).toBeVisible();
		expect(
			within( cueList ).getByText( 'Your local editor' )
		).toBeVisible();
		expect(
			within( cueList ).getByText( 'Original structure' )
		).toBeVisible();
		expect(
			within( cueList ).getAllByText( 'Deletes 1 block' )
		).toHaveLength( 2 );
		const detailsToggle = within( summary ).getByRole( 'button', {
			name: 'Show block details',
		} );
		expect( detailsToggle ).toBeVisible();
		expect( detailsToggle ).toHaveAttribute( 'aria-expanded', 'false' );
		// eslint-disable-next-line testing-library/no-node-access
		const detailsPanel = summary.querySelector(
			'[data-distributed-editing-structural-details-panel="true"]'
		);
		expect( detailsPanel ).not.toBeVisible();
		expect(
			within( detailsPanel ).getAllByText( 'Base alpha.' )
		).toHaveLength( 2 );
		expect(
			within( detailsPanel ).getByText( 'Base beta.' )
		).not.toBeVisible();
		expect(
			within( detailsPanel ).getByText( 'Local keeps beta.' )
		).not.toBeVisible();

		fireEvent.click( detailsToggle );

		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-details-open',
			'true'
		);
		expect(
			within( summary ).getByRole( 'button', {
				name: 'Hide block details',
			} )
		).toHaveAttribute( 'aria-expanded', 'true' );
		expect( detailsPanel ).toBeVisible();
		expect(
			within( detailsPanel ).getAllByText( 'Base alpha.' )
		).toHaveLength( 2 );
		expect(
			within( detailsPanel ).getByText( 'Base beta.' )
		).toBeVisible();
		expect(
			within( detailsPanel ).getByText( 'Local keeps beta.' )
		).toBeVisible();
		expect(
			within( detailsPanel ).getAllByText( 'Deletes 1 block' )
		).toHaveLength( 2 );
		expect(
			within( detailsPanel ).getByText( 'Blocks deleted' )
		).toBeVisible();
		expect(
			within( detailsPanel ).getAllByText( '-1 block' )
		).toHaveLength( 2 );
		expect(
			within( summary ).getByRole( 'button', {
				name: 'Export for review',
			} )
		).toBeVisible();
		expect(
			within( summary ).getByRole( 'button', {
				name: 'Get latest post',
			} )
		).toBeVisible();
		expect(
			screen.queryByRole( 'region', {
				name: 'Distributed editing conflict comparison',
			} )
		).not.toBeInTheDocument();
		expect( screen.queryByText( /wp:paragraph/ ) ).not.toBeInTheDocument();
	} );

	it( 'renders compact structural change cues for inserted and reordered blocks', () => {
		setupDistributedEditingStatusDispatch();
		setupDistributedEditingStatusSelect( {
			editedPostContent:
				'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Local inserted.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base beta.</p><!-- /wp:paragraph -->',
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
				localRebaseResultReason: 'block_inserted',
				requiresManualConflictResolution: true,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base beta.</p><!-- /wp:paragraph -->',
				refetchedServerContent:
					'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Server inserted.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base beta.</p><!-- /wp:paragraph -->',
			},
		} );

		const view = render( <DistributedEditingStatus /> );
		const insertedSummary = screen.getByRole( 'region', {
			name: 'Distributed editing structural conflict summary',
		} );

		const insertedCueList = within( insertedSummary ).getByLabelText(
			'Distributed editing structural change summary'
		);

		expect(
			within( insertedCueList ).getAllByText( 'Adds 1 block' )
		).toHaveLength( 2 );
		expect(
			within( insertedSummary ).getByText(
				'New blocks were added in both versions. Choose which structure to keep.'
			)
		).toBeVisible();

		// eslint-disable-next-line testing-library/no-node-access
		const insertedCues = insertedSummary.querySelectorAll(
			'[data-distributed-editing-structural-cue-change-kind]'
		);
		expect(
			Array.from( insertedCues ).map( ( cue ) =>
				cue.getAttribute(
					'data-distributed-editing-structural-cue-change-kind'
				)
			)
		).toEqual( [ 'base', 'blocks_added', 'blocks_added' ] );
		expect(
			Array.from( insertedCues ).map( ( cue ) =>
				cue.getAttribute(
					'data-distributed-editing-structural-cue-count-delta'
				)
			)
		).toEqual( [ '0', '1', '1' ] );

		view.unmount();
		useSelect.mockReset();

		setupDistributedEditingStatusSelect( {
			editedPostContent:
				'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base gamma.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base beta.</p><!-- /wp:paragraph -->',
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
				localRebaseResultReason: 'block_reordered',
				requiresManualConflictResolution: true,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base beta.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base gamma.</p><!-- /wp:paragraph -->',
				refetchedServerContent:
					'<!-- wp:paragraph --><p>Base beta.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base gamma.</p><!-- /wp:paragraph -->',
			},
		} );

		render( <DistributedEditingStatus /> );
		const reorderedSummary = screen.getByRole( 'region', {
			name: 'Distributed editing structural conflict summary',
		} );

		const reorderedCueList = within( reorderedSummary ).getByLabelText(
			'Distributed editing structural change summary'
		);

		expect(
			within( reorderedCueList ).getAllByText( 'Reordered' )
		).toHaveLength( 2 );
		expect(
			within( reorderedSummary ).getByText(
				'Blocks moved while you were editing. Choose which structure to keep.'
			)
		).toBeVisible();

		// eslint-disable-next-line testing-library/no-node-access
		const reorderedCues = reorderedSummary.querySelectorAll(
			'[data-distributed-editing-structural-cue-change-kind]'
		);
		expect(
			Array.from( reorderedCues ).map( ( cue ) =>
				cue.getAttribute(
					'data-distributed-editing-structural-cue-change-kind'
				)
			)
		).toEqual( [ 'base', 'blocks_reordered', 'blocks_reordered' ] );
		expect(
			Array.from( reorderedCues ).map( ( cue ) =>
				cue.getAttribute(
					'data-distributed-editing-structural-cue-count-delta'
				)
			)
		).toEqual( [ '0', '0', '0' ] );
		expect( screen.queryByText( /wp:paragraph/ ) ).not.toBeInTheDocument();
	} );

	it( 'previews structural conflict snapshots without saving or changing editor content', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();

		setupDistributedEditingStatusSelect( {
			editedPostContent:
				'<!-- wp:paragraph --><p>Local keeps beta.</p><!-- /wp:paragraph -->',
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
				localRebaseResultReason: 'block_deleted',
				requiresManualConflictResolution: true,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base beta.</p><!-- /wp:paragraph -->',
				refetchedServerContent:
					'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph -->',
			},
		} );

		render( <DistributedEditingStatus /> );

		const summary = screen.getByRole( 'region', {
			name: 'Distributed editing structural conflict summary',
		} );

		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-preview-status',
			'inactive'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-preview-mutates-editor-content',
			'false'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-preview-calls-save',
			'false'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-preview-calls-rest',
			'false'
		);

		await user.click(
			within( summary ).getByRole( 'button', {
				name: 'Preview saved',
			} )
		);

		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-preview-status',
			'previewing_server'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-preview-selected',
			'server'
		);

		const preview = within( summary ).getByRole( 'region', {
			name: 'Distributed editing structural preview',
		} );
		expect(
			within( preview ).getByText(
				'Previewing Saved WordPress structure'
			)
		).toBeVisible();
		expect(
			within( preview ).getByText(
				'Preview only: no editor content changes, no Save, no request.'
			)
		).toBeVisible();
		expect( within( preview ).getByText( 'Base alpha.' ) ).toBeVisible();

		await user.click(
			within( summary ).getByRole( 'button', {
				name: 'Preview mine',
			} )
		);

		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-preview-status',
			'previewing_local'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-preview-selected',
			'local'
		);
		expect(
			within( preview ).getByText( 'Previewing Your local editor' )
		).toBeVisible();
		expect(
			within( preview ).getByText( 'Local keeps beta.' )
		).toBeVisible();

		await user.click(
			within( summary ).getByRole( 'button', {
				name: 'Close preview',
			} )
		);

		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-preview-status',
			'inactive'
		);
		expect(
			screen.queryByRole( 'region', {
				name: 'Distributed editing structural preview',
			} )
		).not.toBeInTheDocument();
		expect( actions.editPost ).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
	} );

	it( 'applies and undoes a structural saved-WordPress choice without saving', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		const localContent =
			'<!-- wp:paragraph --><p>Local keeps beta.</p><!-- /wp:paragraph -->';
		const latestWordPressContent =
			'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph -->';

		setupDistributedEditingStatusSelect( {
			editedPostContent: localContent,
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
				localRebaseResultReason: 'block_deleted',
				requiresManualConflictResolution: true,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base beta.</p><!-- /wp:paragraph -->',
				refetchedServerContent: latestWordPressContent,
			},
		} );

		render( <DistributedEditingStatus /> );

		const summary = screen.getByRole( 'region', {
			name: 'Distributed editing structural conflict summary',
		} );

		await user.click(
			within( summary ).getByRole( 'button', {
				name: 'Use saved',
			} )
		);

		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-choice-selected',
			'server'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-choice-status',
			'selected_server'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-choice-calls-rest',
			'false'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-choice-calls-save',
			'false'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-choice-mutates-editor-content',
			'true'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-choice-mutates-persisted-content',
			'false'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-choice-undo-available',
			'true'
		);
		expect( actions.editPost ).toHaveBeenCalledWith(
			{ content: latestWordPressContent },
			{ undoIgnore: true }
		);
		expect(
			actions.setDistributedEditingSessionState
		).toHaveBeenLastCalledWith(
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
			screen.getAllByText(
				'Using saved WordPress structure. Save is still paused until Save verifies this choice.'
			).length
		).toBeGreaterThan( 0 );

		await user.click(
			within( summary ).getByRole( 'button', {
				name: 'Undo choice',
			} )
		);

		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-choice-selected',
			'local'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-choice-status',
			'selected_local'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-choice-undo-available',
			'false'
		);
		expect( actions.editPost ).toHaveBeenLastCalledWith(
			{ content: localContent },
			{ undoIgnore: true }
		);
		expect(
			actions.setDistributedEditingSessionState
		).toHaveBeenLastCalledWith(
			expect.objectContaining( {
				staleBaseConflictResolutionStatus:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LOCAL_VERSION_SELECTED,
				staleBaseConflictResolutionChoice:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LOCAL,
				staleBaseConflictResolutionRequiresFreshProof: true,
				staleBaseConflictResolutionCallsRest: false,
				staleBaseConflictResolutionCallsSave: false,
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
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
	} );

	it( 'checks a selected structural choice and enables guarded Save without saving or leaving manual review', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		const latestWordPressContent =
			'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph -->';
		actions.__experimentalRefreshDistributedEditingRetrySubmitProof.mockResolvedValueOnce(
			{
				result: 'retry_submit_accepted_for_future_save',
				retry_submit_accepted: true,
				client_base_version: '5',
				server_version: '5',
				rebased_from_version: '4',
				pending_change_count: 1,
				save_path_required: true,
			}
		);

		setupDistributedEditingStatusSelect( {
			editedPostContent: latestWordPressContent,
			sessionState: {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				clientBaseVersion: 4,
				serverVersion: 5,
				pendingChangeCount: 1,
				remoteChangeCount: 1,
				requiresServerStateRefetch: false,
				refetchedServerState: true,
				canExportLocalUpdates: true,
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				localRebaseResultReason: 'block_deleted',
				requiresManualConflictResolution: true,
				staleBaseConflictResolutionStatus:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LATEST_WORDPRESS_SELECTED,
				staleBaseConflictResolutionChoice:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS,
				staleBaseConflictResolutionRequiresFreshProof: true,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base beta.</p><!-- /wp:paragraph -->',
				refetchedServerContent: latestWordPressContent,
			},
		} );

		render( <DistributedEditingStatus /> );

		const summary = screen.getByRole( 'region', {
			name: 'Distributed editing structural conflict summary',
		} );

		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-choice-next-step',
			'check_structural_choice'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-choice-requires-fresh-proof',
			'true'
		);

		await user.click(
			within( summary ).getByRole( 'button', {
				name: 'Check structure',
			} )
		);

		expect(
			actions.__experimentalRefreshDistributedEditingRetrySubmitProof
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof
		).toHaveBeenCalledTimes( 1 );
		const retrySubmitProofRequest =
			actions.__experimentalRefreshDistributedEditingRetrySubmitProof.mock
				.calls[ 0 ][ 0 ];
		const hasValidOptionalProofHash =
			retrySubmitProofRequest === undefined ||
			/^[0-9a-f]{64}$/.test(
				retrySubmitProofRequest.proposedPostContentHash
			);
		expect( hasValidOptionalProofHash ).toBe( true );
		expect(
			actions.setDistributedEditingSessionState
		).toHaveBeenLastCalledWith(
			expect.objectContaining( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				requiresManualConflictResolution: true,
				staleBaseConflictResolutionStatus:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LATEST_WORDPRESS_SELECTED,
				staleBaseConflictResolutionChoice:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS,
				staleBaseConflictResolutionRequiresFreshProof: false,
				clientBaseVersion: '4',
				serverVersion: '5',
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
				retrySubmitAccepted: true,
				retrySubmitSavePathRequired: true,
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				retrySubmitSavePrepared: true,
				retrySubmitSaveReady: true,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
				retrySaveAccepted: false,
				retrySaveClaimsSaved: false,
			} )
		);
		expect(
			screen.getByText(
				'Ready to Save this structure. Use Save to ask WordPress to update the post; the saved post has not changed yet.'
			)
		).toBeVisible();
		expect(
			within( summary ).queryByRole( 'button', {
				name: 'Continue Save',
			} )
		).not.toBeInTheDocument();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
	} );

	it( 'prepares a checked structural choice for guarded Save without saving', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		const latestWordPressContent =
			'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph -->';

		setupDistributedEditingStatusSelect( {
			editedPostContent: latestWordPressContent,
			sessionState: {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				clientBaseVersion: '4',
				serverVersion: '5',
				pendingChangeCount: 1,
				remoteChangeCount: 1,
				requiresServerStateRefetch: false,
				refetchedServerState: true,
				canExportLocalUpdates: true,
				localRebasePlanStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES.READY,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				localRebaseResultReason: 'block_deleted',
				requiresManualConflictResolution: true,
				staleBaseConflictResolutionStatus:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LATEST_WORDPRESS_SELECTED,
				staleBaseConflictResolutionChoice:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS,
				staleBaseConflictResolutionRequiresFreshProof: false,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
				retrySubmitAccepted: true,
				retrySubmitSavePathRequired: true,
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.NONE,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Base alpha.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Base beta.</p><!-- /wp:paragraph -->',
				refetchedServerContent: latestWordPressContent,
			},
		} );

		render( <DistributedEditingStatus /> );

		const summary = screen.getByRole( 'region', {
			name: 'Distributed editing structural conflict summary',
		} );

		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-choice-next-step',
			'prepare_structural_save'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-choice-prepare-save-ready',
			'true'
		);
		expect( summary ).toHaveAttribute(
			'data-distributed-editing-structural-choice-save-ready',
			'false'
		);

		const prepareButton = within( summary ).getByRole( 'button', {
			name: 'Continue Save',
		} );

		expect( prepareButton ).toHaveAttribute(
			'data-distributed-editing-structural-choice-action',
			'prepare_structural_save'
		);
		expect( prepareButton ).toHaveAttribute(
			'data-distributed-editing-structural-choice-action-does-not-save',
			'true'
		);
		expect( prepareButton ).toHaveAttribute( 'type', 'button' );

		await user.click( prepareButton );

		expect(
			actions.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.setDistributedEditingSessionState
		).toHaveBeenLastCalledWith(
			expect.objectContaining( {
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_STALE_BASE_VERSION,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.STALE_BASE_VERSION_REJECTED,
				hasPendingChanges: true,
				isAwaitingServerConfirmation: true,
				requiresManualConflictResolution: true,
				localRebaseResultStatus:
					DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES.MANUAL_CONFLICT_REQUIRED,
				localRebaseResultReason: 'block_deleted',
				staleBaseConflictResolutionStatus:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_STATUSES.LATEST_WORDPRESS_SELECTED,
				staleBaseConflictResolutionChoice:
					DISTRIBUTED_EDITING_STALE_BASE_CONFLICT_RESOLUTION_CHOICES.LATEST_WORDPRESS,
				staleBaseConflictResolutionRequiresFreshProof: false,
				retrySubmitProofStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES.ACCEPTED_FOR_FUTURE_SAVE,
				retrySubmitAccepted: true,
				retrySubmitSavePathRequired: true,
				retrySubmitSaveStatus:
					DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES.READY,
				retrySubmitSavePrepared: true,
				retrySubmitSaveReady: true,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.NONE,
			} )
		);
		expect(
			screen.getByText(
				'Ready to Save this structure. Use Save to ask WordPress to update the post; the saved post has not changed yet.'
			)
		).toBeVisible();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
	} );

	it( 'keeps selected same-block conflicts in the two-version modal without staged check controls', () => {
		setupDistributedEditingStatusDispatch();

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
			'data-distributed-editing-conflict-comparison-mode',
			'modal_two_version_review'
		);
		expect(
			within( comparison ).getByRole( 'button', {
				name: 'Keep mine and overwrite WordPress',
			} )
		).toBeVisible();
		expect(
			within( comparison ).getByRole( 'button', {
				name: 'Use WordPress version',
			} )
		).toBeVisible();
		expect(
			within( comparison ).getByText( 'Local same block proof choice.' )
		).toBeVisible();
		expect(
			within( comparison ).getByText( 'Server same block proof choice.' )
		).toBeVisible();
		expect(
			within( comparison ).queryByRole( 'button', {
				name: 'Check version',
			} )
		).not.toBeInTheDocument();
		expect(
			within( comparison ).queryByRole( 'button', {
				name: 'Continue Save',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Your local version is selected' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(
				'This version is ready. Continue Save before updating the post.'
			)
		).not.toBeInTheDocument();
	} );

	it( 'runs proof, prepare, and guarded Save from a checked same-block modal choice', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		const editedPostContent =
			'<!-- wp:paragraph --><p>Local checked conflict choice.</p><!-- /wp:paragraph -->';

		setupDistributedEditingStatusSelect( {
			currentPost: { id: 42, type: 'post' },
			editedPostContent,
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

		await user.click(
			within( comparison ).getByRole( 'button', {
				name: 'Keep mine and overwrite WordPress',
			} )
		);

		await waitFor( () =>
			expect(
				actions.__experimentalRefreshDistributedEditingRetrySubmitProof
			).toHaveBeenCalledTimes( 1 )
		);
		expect(
			actions.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).toHaveBeenCalledWith(
			expect.objectContaining( {
				__experimentalDistributedEditingExplicitSaveClick: true,
				proposedPostContent: editedPostContent,
			} )
		);
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			await within( comparison ).findByText( 'Saved your version.' )
		).toBeVisible();
	} );

	it( 'keeps prepared same-block conflicts in the modal instead of a staged readiness panel', () => {
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
			'data-distributed-editing-conflict-comparison-mode',
			'modal_two_version_review'
		);
		expect(
			within( comparison ).getByText( 'Local prepared conflict choice.' )
		).toBeVisible();
		expect(
			within( comparison ).getByText( 'Server prepared conflict choice.' )
		).toBeVisible();
		expect(
			within( comparison ).getByRole( 'button', {
				name: 'Keep mine and overwrite WordPress',
			} )
		).toBeVisible();
		expect(
			within( comparison ).getByRole( 'button', {
				name: 'Use WordPress version',
			} )
		).toBeVisible();
		expect(
			within( comparison ).queryByRole( 'button', {
				name: 'Continue Save',
			} )
		).not.toBeInTheDocument();
		expect(
			within( comparison ).queryByText( 'Ready to Save' )
		).not.toBeInTheDocument();
		expect(
			within( comparison ).queryByText(
				'Save now: use the editor Save button.'
			)
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
				'Use the editor Save button to ask WordPress to update the post. This conflict choice has not changed the WordPress post yet.'
			)
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(
				'WordPress saved your changes. Ready for new edits.'
			)
		).not.toBeInTheDocument();
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
				'Distributed Editing activity was recorded; no fresh-review chronology is complete. Recorded 1 redacted transcript event; 1 unsafe entry was dropped. This transcript is diagnostic only; WordPress Save evidence is still required before treating these changes as saved.'
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
			screen.getByText( 'The editor sent the review result.' )
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
				'The editor validated the fresh-review handoff and kept the activity record content-free.'
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
			editorSettings: {
				distributedEditing: {
					enabled: true,
				},
			},
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
		expect( screen.getByText( 'Save needed' ) ).toBeVisible();
		expect(
			screen.queryByRole( 'region', {
				name: 'Distributed editing enabled status',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Editing together' )
		).not.toBeInTheDocument();
	} );

	it( 'summarizes the enabled editor shell when rendered directly', () => {
		setupDistributedEditingStatusSelect( {
			editorSettings: {
				distributedEditing: {
					enabled: true,
				},
			},
		} );

		render( <DistributedEditingEnabledShell /> );

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
			'Save can update the post in WordPress.'
		);
		expect( saveJourney ).toHaveAttribute(
			'data-distributed-editing-save-journey-authority-state',
			'ready_to_update_authoritative_post'
		);
		expect( saveJourney ).toHaveAttribute(
			'data-distributed-editing-save-journey-authority-summary',
			'Save can update the post in WordPress.'
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
		expect(
			screen.queryByRole( 'group', {
				name: 'Distributed editing presence',
			} )
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

			render(
				<>
					<DistributedEditingEnabledShell />
					<DistributedEditingStatus placement="editor-interface-notices" />
				</>
			);

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
				'data-distributed-editing-confirmed-save-merged-edits',
				'false'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-confirmed-save-shell-quieted',
				'false'
			);
			expect( within( shell ).getByText( 'Saved' ) ).toBeVisible();
			expect(
				screen.queryByText(
					'WordPress will protect local changes and show status here when review, refresh, or confirmation is needed.'
				)
			).not.toBeInTheDocument();
			expect(
				screen.queryByText(
					'WordPress accepted this Save. You can keep editing; WordPress will protect any new local changes.'
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
				'data-distributed-editing-confirmed-save-merged-edits',
				'false'
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
				'Save can update the post in WordPress.'
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

	it( 'distinguishes a server-merged Save in the enabled editor shell without adding receipt chatter', () => {
		const originalConfirmedSaveShellHoldMs =
			globalThis.__experimentalDistributedEditingConfirmedSaveShellHoldMs;
		const originalConfirmedSaveStatusHoldMs =
			globalThis.__experimentalDistributedEditingConfirmedSaveStatusHoldMs;
		globalThis.__experimentalDistributedEditingConfirmedSaveShellHoldMs = 1000;
		globalThis.__experimentalDistributedEditingConfirmedSaveStatusHoldMs = 1000;
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
					retrySaveServerVersion: '233',
					retrySavePreviousServerVersion: '232',
					retrySaveSavesPost: true,
					retrySaveMutatesPostContent: true,
					retrySaveCreatesRevision: true,
					retrySaveClaimsSaved: true,
					retrySaveRevisionCreated: true,
					retrySaveConfirmedMergedEdits: true,
				},
			} );

			render(
				<>
					<DistributedEditingEnabledShell />
					<DistributedEditingStatus placement="editor-interface-notices" />
				</>
			);

			const shell = screen.getByRole( 'region', {
				name: 'Distributed editing enabled status',
			} );
			expect(
				screen.queryByRole( 'region', {
					name: 'Distributed editing status',
				} )
			).not.toBeInTheDocument();
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-save-state',
				'retry_save_confirmed'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-confirmed-save-evidence-retained',
				'true'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-confirmed-save-merged-edits',
				'true'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-confirmed-save-shell-quieted',
				'false'
			);
			expect(
				within( shell ).getByText( 'Merged by WordPress' )
			).toBeVisible();
			expect(
				within( shell ).getByText( 'Ready for new edits.' )
			).toBeVisible();
			expect(
				within( shell ).queryByText( 'Saved' )
			).not.toBeInTheDocument();
			expect(
				within( shell ).queryByText( 'Save confirmed' )
			).not.toBeInTheDocument();
			expect(
				within( shell ).queryByText( 'Show Save evidence' )
			).not.toBeInTheDocument();
			expect(
				screen.queryByText(
					'WordPress saved the merged edits. Ready for new edits.'
				)
			).not.toBeInTheDocument();

			act( () => {
				jest.advanceTimersByTime( 1000 );
			} );

			expect( shell ).toHaveAttribute(
				'data-distributed-editing-save-state',
				'update_ready'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-confirmed-save-merged-edits',
				'true'
			);
			expect( shell ).toHaveAttribute(
				'data-distributed-editing-confirmed-save-shell-quieted',
				'true'
			);
			expect(
				within( shell ).getByText( 'Merged by WordPress' )
			).toBeVisible();
			expect(
				within( shell ).getByText( 'Ready for new edits.' )
			).toBeVisible();
			expect(
				screen.queryByText(
					"Merged edits saved. Your changes and the other editor's non-conflicting changes are now in WordPress. Open details for version and revision evidence."
				)
			).not.toBeInTheDocument();
		} finally {
			jest.useRealTimers();

			if ( originalConfirmedSaveShellHoldMs === undefined ) {
				delete globalThis.__experimentalDistributedEditingConfirmedSaveShellHoldMs;
			} else {
				globalThis.__experimentalDistributedEditingConfirmedSaveShellHoldMs =
					originalConfirmedSaveShellHoldMs;
			}

			if ( originalConfirmedSaveStatusHoldMs === undefined ) {
				delete globalThis.__experimentalDistributedEditingConfirmedSaveStatusHoldMs;
			} else {
				globalThis.__experimentalDistributedEditingConfirmedSaveStatusHoldMs =
					originalConfirmedSaveStatusHoldMs;
			}
		}
	} );

	it( 'shows a latency-tolerant presence roster in the toolbar', async () => {
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
						avatarUrl: 'https://example.test/mira.png',
						freshness: 'current',
						sessionDurationSeconds: 300,
						permissionsAvailable: true,
						permissions: {
							canEdit: true,
							canPublish: true,
							canSaveDangerousHtml: false,
						},
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

		render( <DistributedEditingPresenceToolbar /> );

		const presence = screen.getByRole( 'group', {
			name: 'Active editors',
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
			'data-distributed-editing-presence-display',
			'caterpillar'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-caterpillar-overlap',
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
			screen.queryByText( '2 other editors are active now.' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( '2 editors are active now.' )
		).not.toBeInTheDocument();
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-other-editor-cue',
			'2 other editors are active now.'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-other-editor-cue-visible',
			'false'
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
		const rowList = screen.getByRole( 'list', {
			name: 'Active editors',
		} );
		const rows = within( rowList ).getAllByRole( 'listitem' );

		expect( rowList ).toHaveAttribute(
			'data-distributed-editing-presence-row-treatment-list',
			'compact-status-badges'
		);
		expect( rowList ).toHaveAttribute(
			'data-distributed-editing-presence-row-order',
			'remote-editors-first'
		);
		expect( rowList ).toHaveAttribute(
			'data-distributed-editing-presence-row-visual-treatment-list',
			'subtle-status-stripe'
		);
		expect( rowList ).toHaveAttribute(
			'data-distributed-editing-presence-caterpillar',
			'overlapping-avatars'
		);
		expect( rowList ).toHaveAttribute(
			'data-distributed-editing-presence-caterpillar-click-details',
			'true'
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
			'data-distributed-editing-presence-row-has-avatar-image',
			'true'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-has-avatar-initial',
			'false'
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
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-permissions-visible',
			'true'
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
		expect( rows[ 1 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-has-avatar-image',
			'false'
		);
		expect( rows[ 1 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-has-avatar-initial',
			'true'
		);
		expect( screen.queryByText( 'Mira' ) ).not.toBeInTheDocument();
		const miraPresenceButton = within( rows[ 0 ] ).getByRole( 'button', {
			name: 'Mira, Active now. Show editing details',
		} );
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-tooltip-open',
			'false'
		);
		fireEvent.pointerEnter( rows[ 0 ] );
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( 'Mira' );
		fireEvent.pointerLeave( rows[ 0 ] );
		await waitFor( () =>
			expect( screen.queryByRole( 'tooltip' ) ).not.toBeInTheDocument()
		);
		fireEvent.focus( miraPresenceButton );
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( 'Mira' );
		fireEvent.blur( miraPresenceButton );
		expect( screen.queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
		fireEvent.click( miraPresenceButton );
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-tooltip-open',
			'true'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-tooltip-pinned',
			'true'
		);
		fireEvent.pointerLeave( rows[ 0 ] );
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( 'Mira' );
		expect(
			within( rows[ 0 ] ).getByRole( 'button', {
				name: 'Mira, Active now. Show editing details',
			} )
		).toHaveAttribute( 'aria-describedby' );
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( 'Mira' );
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent(
			'Active now'
		);
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent(
			'Editing for 5 min'
		);
		expect(
			within(
				screen.getByRole( 'list', { name: 'Permissions' } )
			).getByText( 'Can edit' )
		).toBeVisible();
		expect(
			within(
				screen.getByRole( 'list', { name: 'Permissions' } )
			).getByText( 'Can publish' )
		).toBeVisible();
		expect(
			within(
				screen.getByRole( 'list', { name: 'Permissions' } )
			).queryByRole( 'checkbox' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Can save custom HTML' )
		).not.toBeInTheDocument();
		fireEvent.keyDown( document, { key: 'Escape' } );
		expect( screen.queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
		expect(
			screen.queryByText( /userId|anchor|selection/i )
		).not.toBeInTheDocument();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
	} );

	it( 'renders non-linear activity rings around presence avatars', () => {
		jest.useFakeTimers().setSystemTime(
			new Date( '2026-05-20T12:00:00Z' )
		);

		try {
			setupDistributedEditingStatusDispatch();
			setupDistributedEditingStatusSelect( {
				editorSettings: {
					distributedEditing: {
						enabled: true,
					},
				},
				sessionState: {
					presenceRepeatedRefreshSelectedHeartbeatIntervalSeconds: 30,
					presenceRosterEntries: [
						{
							key: 'presence-fresh',
							displayName: 'Fresh',
							freshness: 'current',
							presenceUpdatedAtGmt: '2026-05-20 11:59:30',
						},
						{
							key: 'presence-uncertain',
							displayName: 'Uncertain',
							freshness: 'recent',
							presenceUpdatedAtGmt: '2026-05-20 11:57:00',
						},
						{
							key: 'presence-abandoned',
							displayName: 'Abandoned',
							freshness: 'stale',
							presenceUpdatedAtGmt: '2026-05-20 10:59:00',
						},
						{
							key: 'presence-unknown',
							displayName: 'Unknown',
							freshness: 'recent',
						},
					],
					presenceRosterTotalKnownCount: 4,
				},
			} );

			render( <DistributedEditingPresenceToolbar /> );

			const rowList = screen.getByRole( 'list', {
				name: 'Active editors',
			} );
			const rows = within( rowList ).getAllByRole( 'listitem' );

			expect( rows ).toHaveLength( 4 );
			expect( rows[ 0 ] ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-band',
				'active'
			);
			expect( rows[ 0 ] ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-age-seconds',
				'30'
			);
			expect( rows[ 0 ] ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-score',
				'0.98'
			);
			expect( rows[ 0 ] ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-visual-color-only',
				'false'
			);
			expect(
				within( rows[ 0 ] ).getByTestId(
					'distributed-editing-presence-activity-ring'
				)
			).toHaveClass(
				'editor-distributed-editing-status__presence-caterpillar-activity-ring--active'
			);
			expect(
				within( rows[ 0 ] ).getByRole( 'button', {
					name: 'Fresh, Active now. Show editing details',
				} )
			).toHaveAttribute(
				'data-distributed-editing-presence-avatar-activity-score',
				'0.98'
			);
			expect( rows[ 1 ] ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-band',
				'uncertain'
			);
			expect( rows[ 1 ] ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-age-seconds',
				'180'
			);
			expect( rows[ 1 ] ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-score',
				'0.71'
			);
			expect( rows[ 2 ] ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-band',
				'abandoned'
			);
			expect( rows[ 2 ] ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-age-seconds',
				'3660'
			);
			expect( rows[ 2 ] ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-score',
				'0.00'
			);
			expect( rows[ 3 ] ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-band',
				'unknown'
			);
			expect( rows[ 3 ] ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-age-seconds',
				''
			);
			expect( rows[ 3 ] ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-score',
				'0.50'
			);
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'renders activity rings for author-level presence rows', () => {
		jest.useFakeTimers().setSystemTime(
			new Date( '2026-05-20T12:00:00Z' )
		);

		try {
			setupDistributedEditingStatusDispatch();
			setupDistributedEditingStatusSelect( {
				editorSettings: {
					distributedEditing: {
						enabled: true,
					},
				},
				sessionState: {
					presenceRepeatedRefreshSelectedHeartbeatIntervalSeconds: 30,
					presenceRosterEntries: [
						{
							key: 'presence-author',
							displayName: 'Author',
							freshness: 'current',
							presenceUpdatedAtGmt: '2026-05-20 11:59:45',
							permissionsAvailable: true,
							permissions: {
								canEdit: true,
								canPublish: false,
								canSaveDangerousHtml: false,
							},
						},
					],
					presenceRosterTotalKnownCount: 1,
				},
			} );

			render( <DistributedEditingPresenceToolbar /> );

			const row = within(
				screen.getByRole( 'list', { name: 'Active editors' } )
			).getByRole( 'listitem' );
			const button = within( row ).getByRole( 'button', {
				name: 'Author, Active now. Show editing details',
			} );
			const ring = within( button ).getByTestId(
				'distributed-editing-presence-activity-ring'
			);

			expect( row ).toHaveAttribute(
				'data-distributed-editing-presence-row-permissions-visible',
				'true'
			);
			expect( row ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-band',
				'active'
			);
			expect( row ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-visual-color-only',
				'false'
			);
			expect( button ).toHaveAttribute(
				'data-distributed-editing-presence-avatar-activity-score',
				'0.99'
			);
			expect( button ).toContainElement( ring );
			expect( ring ).toHaveClass(
				'editor-distributed-editing-status__presence-caterpillar-activity-ring--active'
			);

			fireEvent.pointerEnter( row );
			expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent(
				'Can edit'
			);
			expect(
				screen.queryByText( 'Can publish' )
			).not.toBeInTheDocument();
			expect(
				screen.queryByText( 'Can save custom HTML' )
			).not.toBeInTheDocument();
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'adjusts a lagging presence ring when other sessions are fresh', () => {
		jest.useFakeTimers().setSystemTime(
			new Date( '2026-05-20T12:00:00Z' )
		);

		try {
			setupDistributedEditingStatusDispatch();
			setupDistributedEditingStatusSelect( {
				editorSettings: {
					distributedEditing: {
						enabled: true,
					},
				},
				sessionState: {
					presenceRepeatedRefreshSelectedHeartbeatIntervalSeconds: 30,
					presenceRosterEntries: [
						{
							key: 'presence-fresh-a',
							displayName: 'Fresh A',
							freshness: 'current',
							presenceUpdatedAtGmt: '2026-05-20 11:59:50',
						},
						{
							key: 'presence-fresh-b',
							displayName: 'Fresh B',
							freshness: 'current',
							presenceUpdatedAtGmt: '2026-05-20 11:59:45',
						},
						{
							key: 'presence-lagging',
							displayName: 'Lagging',
							freshness: 'recent',
							presenceUpdatedAtGmt: '2026-05-20 11:58:20',
						},
					],
					presenceRosterTotalKnownCount: 3,
				},
			} );

			render( <DistributedEditingPresenceToolbar /> );

			const rows = within(
				screen.getByRole( 'list', { name: 'Active editors' } )
			).getAllByRole( 'listitem' );

			expect( rows[ 2 ] ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-age-seconds',
				'100'
			);
			expect( rows[ 2 ] ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-relative-adjusted',
				'true'
			);
			expect( rows[ 2 ] ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-score',
				'0.55'
			);
			expect( rows[ 2 ] ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-band',
				'uncertain'
			);
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'updates presence activity rings on a local timer without refreshing presence', () => {
		jest.useFakeTimers().setSystemTime(
			new Date( '2026-05-20T12:00:00Z' )
		);

		try {
			const actions = setupDistributedEditingStatusDispatch();
			setupDistributedEditingStatusSelect( {
				editorSettings: {
					distributedEditing: {
						enabled: true,
					},
				},
				sessionState: {
					presenceRepeatedRefreshSelectedHeartbeatIntervalSeconds: 30,
					presenceRosterEntries: [
						{
							key: 'presence-local-tick',
							displayName: 'Tick',
							freshness: 'current',
							presenceUpdatedAtGmt: '2026-05-20 11:59:10',
						},
					],
					presenceRosterTotalKnownCount: 1,
				},
			} );

			render( <DistributedEditingPresenceToolbar /> );

			const row = screen.getByRole( 'listitem', {
				name: 'Tick, Active now',
			} );

			expect( row ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-age-seconds',
				'50'
			);

			act( () => {
				jest.advanceTimersByTime( 15000 );
			} );

			expect( row ).toHaveAttribute(
				'data-distributed-editing-presence-row-activity-age-seconds',
				'65'
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
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'shows advisory document-copy state in the presence caterpillar without save authority', () => {
		jest.useFakeTimers().setSystemTime(
			new Date( '2026-05-20T12:01:30Z' )
		);

		try {
			const actions = setupDistributedEditingStatusDispatch();
			const stateHash =
				'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
			setupDistributedEditingStatusSelect( {
				editorSettings: {
					distributedEditing: {
						enabled: true,
					},
				},
				sessionState: {
					serverVersion: '12',
					distributedEditingPostStateHash: stateHash,
					presenceRosterEntries: [
						{
							key: 'presence-sam',
							displayName: 'Sam',
							freshness: 'current',
							presenceUpdatedAtGmt: '2026-05-20 12:01:00',
							documentState: {
								available: true,
								confirmedBaseVersion: '12',
								confirmedStateHash: stateHash,
								hasPendingChanges: false,
								confirmedAtGmt: '2026-05-20 12:00:00',
								authoritativeForSave: true,
								claimsSaved: true,
								exposesRawContent: true,
							},
						},
					],
					presenceRosterTotalKnownCount: 1,
				},
			} );

			render( <DistributedEditingPresenceToolbar /> );

			const row = screen.getByRole( 'listitem', {
				name: 'Sam, Active now, Same saved copy',
			} );
			expect( row ).toHaveAttribute(
				'data-distributed-editing-presence-row-document-state',
				'same-clean'
			);
			expect( row ).toHaveAttribute(
				'data-distributed-editing-presence-row-document-state-authoritative-for-save',
				'false'
			);
			expect( row ).toHaveAttribute(
				'data-distributed-editing-presence-row-document-state-available',
				'true'
			);
			expect( row ).toHaveAttribute(
				'data-distributed-editing-presence-row-document-state-has-pending-changes',
				'false'
			);
			expect( row ).toHaveAttribute(
				'data-distributed-editing-presence-row-document-state-visual-color-only',
				'false'
			);

			fireEvent.click(
				within( row ).getByRole( 'button', {
					name: 'Sam, Active now, Same saved copy. Show editing details',
				} )
			);

			const tooltip = screen.getByRole( 'tooltip' );
			expect(
				within( tooltip ).getByText( 'Same saved copy' )
			).toBeVisible();
			expect(
				within( tooltip ).getByText( 'No unsaved changes reported' )
			).toBeVisible();
			expect(
				within( tooltip ).getByText( 'Presence updated 30 sec ago' )
			).toBeVisible();
			expect(
				within( tooltip ).getByText(
					'Confirmed copy reported 1 min ago'
				)
			).toBeVisible();
			expect(
				actions.__experimentalSaveDistributedEditingRetryAfterProof
			).not.toHaveBeenCalled();
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'keeps remote editors first when local and same-user tabs are also visible', () => {
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
						key: 'presence-this-tab',
						relationship: 'current_user_current_tab',
						displayName: 'Mira',
						freshness: 'current',
					},
					{
						key: 'presence-another-tab',
						relationship: 'same_user_other_tab',
						displayName: 'Mira',
						freshness: 'current',
					},
					{
						key: 'presence-remote-sam',
						relationship: 'other_user',
						displayName: 'Sam',
						freshness: 'current',
					},
				],
				presenceRosterTotalKnownCount: 3,
			},
		} );

		render( <DistributedEditingEnabledShell /> );

		const presence = screen.getByRole( 'group', {
			name: 'Distributed editing presence',
		} );
		const rowList = screen.getByRole( 'list', {
			name: 'Visible editors',
		} );
		const rows = within( rowList ).getAllByRole( 'listitem' );

		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-other-editor-cue',
			'1 other editor is active now.'
		);
		expect( rowList ).toHaveAttribute(
			'data-distributed-editing-presence-row-order',
			'remote-editors-first'
		);
		expect( rows ).toHaveLength( 3 );
		expect( rows[ 0 ] ).toHaveAttribute( 'aria-label', 'Sam, Active now' );
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'other_user'
		);
		expect( rows[ 1 ] ).toHaveAttribute(
			'aria-label',
			'Another tab, Active now'
		);
		expect( rows[ 1 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'same_user_other_tab'
		);
		expect( rows[ 2 ] ).toHaveAttribute(
			'aria-label',
			'This tab, Active now'
		);
		expect( rows[ 2 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'current_user_current_tab'
		);
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
	} );

	it( 'keeps pending ghosts out of the compact presence chrome', () => {
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
						key: 'presence-this-tab',
						relationship: 'current_user_current_tab',
						displayName: 'Mira',
						freshness: 'current',
					},
					{
						key: 'presence-remote-author',
						relationship: 'other_user',
						displayName: 'Author',
						freshness: 'current',
						pendingPreview: {
							available: true,
							schema: 'de-rtc-pending-preview-v1',
							hasPendingPreview: true,
							items: [
								{
									previewId: 'ghost-html',
									blockPath: [ 1 ],
									blockName: 'core/html',
									changeKind: 'added_block',
									safePreviewText: 'Ghost text',
									safePreviewHtml: '<p>Ghost text</p>',
									rawContentIncluded: false,
									exposesRawContent: false,
									inert: true,
								},
							],
							rawContentIncluded: false,
							exposesRawContent: false,
							inert: true,
						},
					},
				],
				presenceRosterTotalKnownCount: 2,
			},
		} );

		render( <DistributedEditingPresenceStatusHarness /> );

		const presence = screen.getByRole( 'group', {
			name: 'Distributed editing presence',
		} );

		expect( presence ).not.toHaveAttribute(
			'data-distributed-editing-presence-pending-ghost-count'
		);
		expect( presence ).not.toHaveAttribute(
			'data-distributed-editing-presence-pending-ghosts-visible'
		);
		expect(
			screen.queryByRole( 'list', {
				name: 'Pending edits from other active editors',
			} )
		).not.toBeInTheDocument();
		expect( screen.queryByText( 'Ghost text' ) ).not.toBeInTheDocument();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
	} );

	it( 'compacts repeated same-user tab rows while keeping remote editors first', () => {
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
						key: 'presence-this-tab-delayed',
						relationship: 'current_user_current_tab',
						freshness: 'recent',
					},
					{
						key: 'presence-another-tab-a',
						relationship: 'same_user_other_tab',
						freshness: 'current',
					},
					{
						key: 'presence-another-tab-b',
						relationship: 'same_user_other_tab',
						freshness: 'current',
					},
					{
						key: 'presence-remote-sam',
						relationship: 'other_user',
						displayName: 'Sam',
						freshness: 'current',
					},
				],
				presenceRosterTotalKnownCount: 4,
			},
		} );

		render( <DistributedEditingPresenceStatusHarness /> );

		const presence = screen.getByRole( 'group', {
			name: 'Distributed editing presence',
		} );
		const rowList = screen.getByRole( 'list', {
			name: 'Visible editors',
		} );
		const rows = within( rowList ).getAllByRole( 'listitem' );

		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-visible-count',
			'3'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-current-count',
			'3'
		);
		expect( presence ).toHaveAttribute(
			'data-distributed-editing-presence-summary-same-user-other-tab-visible',
			'true'
		);
		expect( rowList ).toHaveAttribute(
			'data-distributed-editing-presence-row-order',
			'remote-editors-first'
		);
		expect( rowList ).toHaveAttribute(
			'data-distributed-editing-presence-row-compaction',
			'same-user-tabs'
		);
		expect( rows ).toHaveLength( 3 );
		expect( rows[ 0 ] ).toHaveAttribute( 'aria-label', 'Sam, Active now' );
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'other_user'
		);
		expect( rows[ 1 ] ).toHaveAttribute(
			'aria-label',
			'Another tab, Active now'
		);
		expect( rows[ 1 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'same_user_other_tab'
		);
		expect( rows[ 2 ] ).toHaveAttribute(
			'aria-label',
			'This tab, Presence may be delayed'
		);
		expect( rows[ 2 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'current_user_current_tab'
		);
		expect(
			rows.filter(
				( row ) =>
					row.getAttribute(
						'data-distributed-editing-presence-row-relationship'
					) === 'same_user_other_tab'
			)
		).toHaveLength( 1 );
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

		render( <DistributedEditingPresenceStatusHarness /> );

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

		render( <DistributedEditingPresenceStatusHarness /> );

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

		render( <DistributedEditingPresenceStatusHarness /> );

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

		render( <DistributedEditingPresenceStatusHarness /> );

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

		const { unmount } = render(
			<DistributedEditingPresenceStatusHarness />
		);

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

		const { unmount } = render(
			<DistributedEditingPresenceStatusHarness />
		);

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

		render( <DistributedEditingPresenceStatusHarness /> );

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

		render( <DistributedEditingPresenceStatusHarness /> );

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
			'true'
		);
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'other_user'
		);
		expect( rows[ 0 ] ).toHaveAttribute( 'aria-label', 'Mira, Active now' );
		expect( rows[ 1 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-current',
			'false'
		);
		expect( rows[ 1 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'other_user'
		);
		expect( rows[ 1 ] ).toHaveAttribute(
			'aria-label',
			'Sam, Presence may be delayed'
		);
		expect( rows[ 2 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-current',
			'true'
		);
		expect( rows[ 2 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'same_user_other_tab'
		);
		expect( rows[ 2 ] ).toHaveAttribute(
			'aria-label',
			'Another tab, Active now'
		);
		expect( rows[ 3 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-current',
			'false'
		);
		expect( rows[ 3 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'current_user_current_tab'
		);
		expect( rows[ 3 ] ).toHaveAttribute(
			'aria-label',
			'This tab, Presence may be delayed'
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

		render( <DistributedEditingPresenceStatusHarness /> );

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
		expect( rows[ 0 ] ).toHaveAttribute( 'aria-label', 'Mira, Active now' );
		expect( rows[ 0 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'other_user'
		);
		expect( rows[ 1 ] ).toHaveAttribute(
			'aria-label',
			'Another editor, Active now'
		);
		expect( rows[ 1 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'other_user'
		);
		expect( rows[ 2 ] ).toHaveAttribute(
			'aria-label',
			'Sam, Presence may be delayed'
		);
		expect( rows[ 3 ] ).toHaveAttribute(
			'aria-label',
			'Another editor, Presence may be delayed'
		);
		expect( rows[ 4 ] ).toHaveAttribute(
			'aria-label',
			'Another tab, Active now'
		);
		expect( rows[ 4 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'same_user_other_tab'
		);
		expect( rows[ 5 ] ).toHaveAttribute(
			'aria-label',
			'This tab, Active now'
		);
		expect( rows[ 5 ] ).toHaveAttribute(
			'data-distributed-editing-presence-row-relationship',
			'current_user_current_tab'
		);
		expect(
			within( rows[ 1 ] ).getByRole( 'button', {
				name: 'Another editor, Active now. Show editing details',
			} )
		).toBeVisible();
		expect(
			within( rows[ 3 ] ).getByRole( 'button', {
				name: 'Another editor, Presence may be delayed. Show editing details',
			} )
		).toBeVisible();
		expect(
			screen.queryByText( 'Another editor' )
		).not.toBeInTheDocument();
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

		render( <DistributedEditingPresenceStatusHarness /> );

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
		expect( rows[ 2 ] ).toHaveAttribute(
			'aria-label',
			'Another editor, Active now'
		);
		expect( rows[ 6 ] ).toHaveAttribute(
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

	it( 'hydrates the toolbar presence from initial WordPress presence settings', () => {
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

		render( <DistributedEditingPresenceToolbar /> );

		const presence = screen.getByRole( 'group', {
			name: 'Active editors',
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
			screen.queryByText( '1 other editor may be delayed.' )
		).not.toBeInTheDocument();
		const rows = within(
			screen.getByRole( 'list', { name: 'Active editors' } )
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
		expect( screen.queryByText( 'Mira' ) ).not.toBeInTheDocument();
		fireEvent.click(
			within( rows[ 0 ] ).getByRole( 'button', {
				name: 'Mira, Presence may be delayed. Show editing details',
			} )
		);
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( 'Mira' );
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent(
			'Presence may be delayed'
		);
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

		render( <DistributedEditingPresenceStatusHarness /> );

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

		render( <DistributedEditingPresenceStatusHarness /> );

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

		render( <DistributedEditingPresenceStatusHarness /> );

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

		render( <DistributedEditingPresenceStatusHarness /> );

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

		render( <DistributedEditingPresenceStatusHarness /> );

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

		const { unmount } = render(
			<DistributedEditingPresenceStatusHarness />
		);

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

		const { unmount } = render(
			<DistributedEditingPresenceStatusHarness />
		);

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

		const { unmount } = render(
			<DistributedEditingPresenceStatusHarness />
		);

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
			expect(
				actions.__experimentalSendDistributedEditingPresenceHeartbeat
					.mock.invocationCallOrder[ 0 ]
			).toBeLessThan(
				actions.__experimentalRefreshDistributedEditingPresenceSnapshot
					.mock.invocationCallOrder[ 0 ]
			);
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

	it( 'debounces a presence heartbeat when the local document state changes', async () => {
		jest.useFakeTimers();

		const actions = setupDistributedEditingStatusDispatch();
		const baseContent =
			'<!-- wp:paragraph --><p>Presence clean base.</p><!-- /wp:paragraph -->';
		const editedPostContent =
			'<!-- wp:paragraph --><p>Presence local edit.</p><!-- /wp:paragraph -->';
		const editorSettings = {
			distributedEditing: {
				enabled: true,
				presenceStorageReadiness: {
					status: 'ready',
					tableExists: true,
					schemaCurrent: true,
				},
			},
		};
		const sessionState = {
			serverVersion: '12',
			clientBaseContent: baseContent,
			distributedEditingPostStateHash:
				'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
			presenceRosterStatus: 'empty',
		};
		setupDistributedEditingStatusSelect( {
			editedPostContent: baseContent,
			editorSettings,
			sessionState,
		} );

		const { rerender, unmount } = render(
			<DistributedEditingPresenceToolbar />
		);

		try {
			await act( async () => {
				jest.advanceTimersByTime( 499 );
				await Promise.resolve();
			} );

			expect(
				actions.__experimentalSendDistributedEditingPresenceHeartbeat
			).not.toHaveBeenCalled();

			await act( async () => {
				jest.advanceTimersByTime( 1 );
				await Promise.resolve();
				await Promise.resolve();
			} );

			expect(
				actions.__experimentalSendDistributedEditingPresenceHeartbeat
			).toHaveBeenCalledTimes( 1 );

			setupDistributedEditingStatusSelect( {
				editedPostContent,
				editorSettings,
				sessionState,
			} );
			rerender( <DistributedEditingPresenceToolbar /> );

			await act( async () => {
				jest.advanceTimersByTime( 500 );
				await Promise.resolve();
				await Promise.resolve();
			} );

			expect(
				actions.__experimentalSendDistributedEditingPresenceHeartbeat
			).toHaveBeenCalledTimes( 2 );
			expect(
				actions.__experimentalSaveDistributedEditingRetryAfterProof
			).not.toHaveBeenCalled();
		} finally {
			unmount();
			jest.clearAllTimers();
			jest.useRealTimers();
		}
	} );

	it( 'does not send another presence heartbeat for dirty editor bookkeeping without content changes', async () => {
		jest.useFakeTimers();

		const actions = setupDistributedEditingStatusDispatch();
		const baseContent =
			'<!-- wp:paragraph --><p>Presence clean base.</p><!-- /wp:paragraph -->';
		const editorSettings = {
			distributedEditing: {
				enabled: true,
				presenceStorageReadiness: {
					status: 'ready',
					tableExists: true,
					schemaCurrent: true,
				},
			},
		};
		const sessionState = {
			serverVersion: '12',
			clientBaseContent: baseContent,
			distributedEditingPostStateHash:
				'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
			presenceRosterStatus: 'empty',
		};
		setupDistributedEditingStatusSelect( {
			editedPostContent: baseContent,
			editorSettings,
			sessionState,
		} );

		const { rerender, unmount } = render(
			<DistributedEditingPresenceToolbar />
		);

		try {
			await act( async () => {
				jest.advanceTimersByTime( 500 );
				await Promise.resolve();
				await Promise.resolve();
			} );

			expect(
				actions.__experimentalSendDistributedEditingPresenceHeartbeat
			).toHaveBeenCalledTimes( 1 );

			setupDistributedEditingStatusSelect( {
				editedPostContent: baseContent,
				editorSettings,
				isEditedPostDirty: true,
				sessionState,
			} );
			rerender( <DistributedEditingPresenceToolbar /> );

			await act( async () => {
				jest.advanceTimersByTime( 500 );
				await Promise.resolve();
				await Promise.resolve();
			} );

			expect(
				actions.__experimentalSendDistributedEditingPresenceHeartbeat
			).toHaveBeenCalledTimes( 1 );
			expect(
				actions.__experimentalSaveDistributedEditingRetryAfterProof
			).not.toHaveBeenCalled();
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

		const { unmount } = render(
			<DistributedEditingPresenceStatusHarness />
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
			<DistributedEditingPresenceStatusHarness />
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
			rerender( <DistributedEditingPresenceStatusHarness /> );
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

	it( 'keeps expired-only roster evidence after the heartbeat-first repeated presence refresh', async () => {
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
			<DistributedEditingPresenceStatusHarness />
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
			rerender( <DistributedEditingPresenceStatusHarness /> );

			await waitFor( () =>
				expect( presence ).toHaveAttribute(
					'data-distributed-editing-presence-heartbeat-command-status',
					'sending'
				)
			);
			expect( presence ).toHaveAttribute(
				'data-distributed-editing-presence-refresh-command-status',
				'idle'
			);
			expect(
				actions.__experimentalRefreshDistributedEditingPresenceSnapshot
			).not.toHaveBeenCalled();
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
			rerender( <DistributedEditingPresenceStatusHarness /> );

			await waitFor( () =>
				expect( presence ).toHaveAttribute(
					'data-distributed-editing-presence-heartbeat-command-status',
					'sent'
				)
			);
			await waitFor( () =>
				expect( presence ).toHaveAttribute(
					'data-distributed-editing-presence-refresh-command-status',
					'refreshed'
				)
			);
			expect(
				actions.__experimentalSendDistributedEditingPresenceHeartbeat
					.mock.invocationCallOrder[ 0 ]
			).toBeLessThan(
				actions.__experimentalRefreshDistributedEditingPresenceSnapshot
					.mock.invocationCallOrder[ 0 ]
			);
			expect( sessionState ).toMatchObject( {
				presenceHeartbeatMarksLocalEditorCurrent: true,
				presenceHeartbeatMarksLocalEditorDelayed: false,
				presenceHeartbeatLocalRosterEntryVisible: true,
				presenceHeartbeatLocalRosterEntryFreshness: 'current',
				presenceRosterStatus: 'recent',
				presenceRosterVisibleCount: 1,
				presenceRosterTotalKnownCount: 3,
				presenceRosterExpiredCount: 2,
				presenceRosterEntries: [
					{
						relationship: 'current_user_current_tab',
						freshness: 'recent',
					},
				],
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
				'data-distributed-editing-presence-summary-expired-count',
				'2'
			);
			expect( presence ).toHaveTextContent(
				'Your presence may be delayed.'
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
			<DistributedEditingPresenceStatusHarness />
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
			rerender( <DistributedEditingPresenceStatusHarness /> );

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

		const { unmount } = render(
			<DistributedEditingPresenceStatusHarness />
		);

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

	it( 'keeps fresh-review jump inspection controls out of production chrome', () => {
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
			screen.queryByRole( 'group', {
				name: 'Distributed editing fresh review jump status',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', {
				name: 'Inspect jump target for Chrome jump HTML change',
			} )
		).not.toBeInTheDocument();
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

	it( 'keeps fresh-review compare inspection controls out of production chrome', () => {
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
			screen.queryByRole( 'group', {
				name: 'Distributed editing fresh review compare status',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', {
				name: 'Inspect compare evidence for Chrome compare paragraph change',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Original chrome comparison text.' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Updated chrome comparison text.' )
		).not.toBeInTheDocument();
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

	it( 'keeps fresh-review compare plan diagnostics out of production chrome', () => {
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

		expect(
			screen.queryByRole( 'group', {
				name: 'Distributed editing fresh review compare plan',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Compare plan ready' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( /fresh-review-chrome-compare-plan-raw|script/i )
		).not.toBeInTheDocument();
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

		render(
			<>
				<DistributedEditingEnabledShell />
				<DistributedEditingStatus placement="editor-interface-notices" />
			</>
		);

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
			'ready_to_edit'
		);
		expect(
			screen.queryByText( 'Local changes protected' )
		).not.toBeInTheDocument();
		expect( screen.queryByText( 'Keep editing' ) ).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Use Save when you are ready.' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Save checks WordPress before updating.' )
		).not.toBeInTheDocument();
		expect( screen.getByText( 'Save needed' ) ).toBeVisible();
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

		render(
			<>
				<DistributedEditingEnabledShell />
				<DistributedEditingStatus placement="editor-interface-notices" />
			</>
		);

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
				'WordPress cannot update the post until risky changes are approved or removed.'
			)
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Review changes' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Review changes' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(
				'Save will open review before WordPress updates the post.'
			)
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Review changes before saving.' )
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
			'Protected local changes need review before WordPress can update the post.'
		);
		expect( saveJourney ).toHaveAttribute(
			'data-distributed-editing-save-journey-authority-state',
			'review_required_before_update'
		);
		expect( saveJourney ).toHaveAttribute(
			'data-distributed-editing-save-journey-authority-summary',
			'WordPress cannot update the post until risky changes are approved or removed.'
		);
	} );

	it( 'keeps review payload controls out of production editor chrome', () => {
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

		expect(
			screen.queryByRole( 'button', {
				name: 'Run review check',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'textbox', {
				name: 'Review payload',
			} )
		).not.toBeInTheDocument();
		expect(
			actions.__experimentalImportDistributedEditingLocalUpdates
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
	} );

	it.each( [
		[
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.MALFORMED_PAYLOAD,
			'Review check blocked: the pasted protected-changes text is missing or malformed. Local changes remain protected.',
		],
		[
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.POST_CONTENT_HASH_MISMATCH,
			'Review check blocked: the protected changes do not match the approved review. Local changes remain protected.',
		],
		[
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.POST_ROUTE_MISMATCH,
			'Review check blocked: the protected changes are for a different editor route. Local changes remain protected.',
		],
		[
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.MISSING_REVIEW_APPROVAL_PROOF,
			'Review check blocked: this admin review is missing accepted approval. Local changes remain protected.',
		],
		[
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.EXPIRED_REVIEW_APPROVAL_PROOF,
			'Review check blocked: the admin-reviewed changes token or approval has expired. Local changes remain protected and exportable.',
		],
		[
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.FRESH_REVIEW_REQUIRED,
			'Review needs checking: this reviewed copy needs a fresh admin check before WordPress can Save it. Your local changes remain protected and exportable.',
		],
		[
			DISTRIBUTED_EDITING_LOCAL_UPDATES_IMPORT_REASONS.EXTRA_SESSION_STATE_OVEREXPOSED,
			'Review check blocked: this reviewed copy exposes extra editor session state. Local changes remain protected.',
		],
	] )(
		'reports blocked local-updates review check for %s without saving',
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

			render(
				<DistributedEditingLocalUpdatesImportControls forceVisible />
			);

			await user.click(
				screen.getByRole( 'button', {
					name: 'Run review check',
				} )
			);
			fireEvent.change(
				screen.getByRole( 'textbox', {
					name: 'Review payload',
				} ),
				{ target: { value: '{"version":1}' } }
			);
			await user.click(
				screen.getByRole( 'button', {
					name: 'Run review check',
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

	it( 'shows fresh-review check action transcript reports without exposing raw review details', async () => {
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
						'Fresh-review Save confirmation was recorded; use WordPress Save evidence to confirm persistence.',
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

		render( <DistributedEditingLocalUpdatesImportControls forceVisible /> );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Run review check',
			} )
		);
		fireEvent.change(
			screen.getByRole( 'textbox', {
				name: 'Review payload',
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
				name: 'Run review check',
			} )
		);

		const status = await screen.findByRole( 'status' );
		expect( status ).toHaveTextContent(
			'Review needs checking: this reviewed copy needs a fresh admin check before WordPress can Save it. Your local changes remain protected and exportable.'
		);
		expect( status ).toHaveTextContent(
			'Fresh-review Save confirmation was recorded; use WordPress Save evidence to confirm persistence. Recorded 4 redacted transcript events; 2 unsafe entries were dropped.'
		);
		expect( status ).toHaveTextContent(
			'This transcript is diagnostic only; WordPress Save evidence is still required before treating these changes as saved.'
		);
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect( status ).not.toHaveTextContent(
			/turn0146-hidden-proof|turn0146-reviewer-id|turn0146 raw content|proofSignature|reviewerId|postContent/
		);
	} );

	it( 'renders retry-save in-progress feedback from production editor chrome without saving', async () => {
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
		expect( screen.getAllByText( 'Saving' ).length ).toBeGreaterThan( 0 );
		expect(
			screen.getAllByText( 'WordPress is saving your changes.' ).length
		).toBeGreaterThan( 0 );
		expect(
			screen.queryByText( 'Changes pending' )
		).not.toBeInTheDocument();
		expect(
			screen.getAllByText( 'WordPress is saving your changes.' ).length
		).toBeGreaterThan( 0 );

		expect(
			screen.queryByRole( 'button', {
				name: 'Export local changes',
			} )
		).not.toBeInTheDocument();
		expect( writeText ).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
	} );

	it( 'keeps already-confirmed retry-save state out of production notice chrome', () => {
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
				screen.queryByRole( 'region', {
					name: 'Distributed editing status',
				} )
			).not.toBeInTheDocument();
			expect(
				screen.queryByText(
					'WordPress saved your changes. Ready for new edits.'
				)
			).not.toBeInTheDocument();
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

			expect(
				screen.queryByText(
					'WordPress saved your changes. Ready for new edits.'
				)
			).not.toBeInTheDocument();
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

		expect(
			screen.getAllByText( 'WordPress is saving your changes.' ).length
		).toBeGreaterThan( 0 );
		expect(
			screen.queryByRole( 'button', {
				name: 'Export local changes',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(
				/Protected local changes remain exportable; keep this tab open/
			)
		).not.toBeInTheDocument();
		expect( writeText ).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			screen.getAllByText( 'WordPress is saving your changes.' ).length
		).toBeGreaterThan( 0 );
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
				'Protected local changes exported. Keep this copy until WordPress confirms the update.'
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

	it( 'renders dismissible review-required retry-save chrome without export or refetch actions', async () => {
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
				canExportLocalUpdates: false,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
				retrySaveReason:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		expect( screen.getByText( 'Safe parts saved' ) ).toBeVisible();
		expect(
			screen.getByText(
				'WordPress saved the safe parts, but one block was blocked.'
			)
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: 'Export local changes' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', {
				name: 'Export changes for review',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Get latest post' } )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Close' } ) ).toBeVisible();
		expect( writeText ).not.toHaveBeenCalled();
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalPrepareDistributedEditingRetrySubmitAfterLocalRebase
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof
		).not.toHaveBeenCalled();

		await user.click( screen.getByRole( 'button', { name: 'Close' } ) );

		expect(
			screen.queryByText( 'Safe parts saved' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(
				'WordPress saved the safe parts, but one block was blocked.'
			)
		).not.toBeInTheDocument();
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalPrepareDistributedEditingRetrySubmitAfterLocalRebase
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof
		).not.toHaveBeenCalled();
	} );

	it( 'auto-dismisses review-required retry-save chrome after the notice hold', () => {
		const previousHoldMs =
			globalThis.__experimentalDistributedEditingDismissibleStatusHoldMs;
		globalThis.__experimentalDistributedEditingDismissibleStatusHoldMs = 1000;
		jest.useFakeTimers();

		try {
			setupDistributedEditingStatusDispatch();
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
					canExportLocalUpdates: false,
					retrySaveStatus:
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
					retrySaveReason:
						DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
				},
			} );

			render( <DistributedEditingStatusChrome /> );

			expect( screen.getByText( 'Safe parts saved' ) ).toBeVisible();

			act( () => {
				jest.advanceTimersByTime( 1000 );
			} );

			expect(
				screen.queryByText( 'Safe parts saved' )
			).not.toBeInTheDocument();
			expect(
				screen.queryByText(
					'WordPress saved the safe parts, but one block was blocked.'
				)
			).not.toBeInTheDocument();
		} finally {
			jest.useRealTimers();
			if ( previousHoldMs === undefined ) {
				delete globalThis.__experimentalDistributedEditingDismissibleStatusHoldMs;
			} else {
				globalThis.__experimentalDistributedEditingDismissibleStatusHoldMs =
					previousHoldMs;
			}
		}
	} );

	it( 'renders a changed dismissible status after an earlier one is dismissed', async () => {
		const user = userEvent.setup();
		const firstDescriptor = {
			id: 'de-rtc-retry-save',
			kind: DISTRIBUTED_EDITING_NOTICE_KINDS.RETRY_SAVE,
			status: 'warning',
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
			retrySaveStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
			retrySaveReason:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
			retrySaveReviewRequired: true,
			noticeOptions: {
				isDismissible: true,
			},
		};
		const secondDescriptor = {
			...firstDescriptor,
			status: 'error',
			reasonCode:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML,
			disposition:
				DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
			retrySaveStatus:
				DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_PERMISSION_DENIED,
			retrySaveReason:
				DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML,
		};

		const { rerender } = render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ [ firstDescriptor ] }
			/>
		);

		expect( screen.getByText( 'Safe parts saved' ) ).toBeVisible();

		await user.click( screen.getByRole( 'button', { name: 'Close' } ) );

		expect(
			screen.queryByText( 'Safe parts saved' )
		).not.toBeInTheDocument();

		rerender(
			<DistributedEditingStatusSurface
				noticeDescriptors={ [ secondDescriptor ] }
			/>
		);

		expect(
			screen.getByText( 'Save needs HTML permission' )
		).toBeVisible();
		expect(
			screen.getByText(
				'The HTML review was accepted, but this account cannot perform the final HTML-capable save. Ask someone with HTML permission to complete the save.'
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
				'The reviewed changes token could not be found in server storage and is no longer usable for Save. No server save was made. Request a fresh admin review before trying again; protected local changes remain exportable.'
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
				'Fresh-review handoff copied. Send it to an admin reviewer; local changes remain protected until a new review is completed.'
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
		expect( screen.getByText( 'Load latest version' ) ).toBeVisible();
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

	it( 'loads latest post for review when the standalone Review changes action is clicked', async () => {
		const user = userEvent.setup();
		const actions = setupDistributedEditingStatusDispatch();
		const onAction = jest.fn();

		actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase.mockResolvedValueOnce(
			{
				result: 'server_state_refetched',
				serverVersion: 'server-version-2',
				content: {
					raw: '<!-- wp:paragraph --><p>Server changed first block.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Server added second block.</p><!-- /wp:paragraph -->',
				},
			}
		);
		setupDistributedEditingStatusSelect( {
			editedPostContent:
				'<!-- wp:paragraph --><p>Local changed first block.</p><!-- /wp:paragraph -->',
			sessionState: {
				remoteChangeCount: 1,
				hasRemoteChanges: true,
				pendingChangeCount: 1,
				canExportLocalUpdates: true,
				clientBaseContent:
					'<!-- wp:paragraph --><p>Original first block.</p><!-- /wp:paragraph -->',
			},
		} );

		render(
			<SlotFillProvider>
				<DistributedEditingStatusChrome onAction={ onAction } />
				<PluginPrePublishPanel.Slot />
			</SlotFillProvider>
		);

		expect( screen.getByText( 'Remote changes received' ) ).toBeVisible();
		expect(
			screen.getByText( '1 remote change is available for review.' )
		).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Review changes',
			} )
		);

		expect( onAction ).toHaveBeenCalledWith(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.REVIEW_REMOTE_CHANGES,
			expect.objectContaining( {
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.REMOTE_CHANGES_RECEIVED,
				actionKeys: [
					DISTRIBUTED_EDITING_NOTICE_ACTIONS.REVIEW_REMOTE_CHANGES,
				],
			} )
		);
		expect(
			actions.__experimentalRefreshDistributedEditingServerStateAfterStaleBase
		).toHaveBeenCalledTimes( 1 );
		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		expect(
			actions.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof
		).not.toHaveBeenCalled();
		expect( actions.openPublishSidebar ).toHaveBeenCalledTimes( 1 );
		expect( await screen.findByRole( 'status' ) ).toHaveAttribute(
			'data-distributed-editing-action-status',
			'info'
		);
		expect(
			screen.getByText( 'Review loaded. Nothing was saved.' )
		).toBeVisible();
		const reviewPanel = screen.getByRole( 'group', {
			name: 'Remote changes review',
		} );

		expect( reviewPanel ).toBeVisible();
		expect( reviewPanel ).toHaveAttribute(
			'data-distributed-editing-remote-changes-review-item-count',
			'2'
		);
		expect( reviewPanel ).toHaveAttribute(
			'data-distributed-editing-remote-changes-review-calls-normal-save',
			'false'
		);
		expect( screen.getByText( 'Changed block 1' ) ).toBeVisible();
		expect( screen.getByText( 'Added block 2' ) ).toBeVisible();
		expect( screen.getByText( 'Original first block.' ) ).toBeVisible();
		expect(
			screen.getByText( 'Server changed first block.' )
		).toBeVisible();
		expect(
			screen.getByText( 'Server added second block.' )
		).toBeVisible();

		await user.click( within( reviewPanel ).getAllByText( 'Reject' )[ 0 ] );
		await user.click(
			within( reviewPanel ).getAllByText( 'Approve' )[ 1 ]
		);

		expect(
			actions.__experimentalSaveDistributedEditingRetryAfterProof
		).not.toHaveBeenCalled();
		await waitFor( () =>
			expect( actions.editPost ).toHaveBeenCalledWith(
				{
					content:
						'<!-- wp:paragraph --><p>Local changed first block.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Server added second block.</p><!-- /wp:paragraph -->',
				},
				{ undoIgnore: true }
			)
		);
		expect(
			actions.__experimentalRefreshDistributedEditingRetrySubmitProof
		).toHaveBeenCalledWith(
			expect.objectContaining( {
				clientBaseVersion: 'server-version-2',
				pendingChangeCount: 2,
			} )
		);
		expect(
			actions.__experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof
		).toHaveBeenCalledWith( {
			requiresExplicitSaveClick: true,
		} );
		expect(
			screen.getByText( 'Ready to Save. Use Save to update the post.' )
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
				name: 'Continue Save',
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
				name: 'Continue Save',
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
				'These changes are ready. Continue Save before updating the post.'
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
				name: 'Continue Save',
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
		expect( screen.getByText( 'Version checked' ) ).toBeVisible();
		expect(
			screen.getByText(
				'This version is ready. Continue Save before updating the post; the WordPress post has not changed yet.'
			)
		).toBeVisible();
		expect(
			screen.getByText(
				'Continue Save, then use Save to ask WordPress to update the post.'
			)
		).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Continue Save',
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
				'Ready to Save this version. Use Save to ask WordPress to update the post; local changes remain protected until WordPress confirms.'
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
		expect( screen.getByText( 'Save needed' ) ).toBeVisible();
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

	it( 'renders server-state acceptance without the unsupported accept action', () => {
		const onAction = jest.fn();
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
				onAction={ onAction }
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
			screen.getByRole( 'button', {
				name: 'Export local changes',
			} )
		).toBeVisible();
		expect( onAction ).not.toHaveBeenCalled();
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
		expect(
			screen.queryByText( /tracks remote activity separately/ )
		).not.toBeInTheDocument();
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
			'false'
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
		).toEqual( [ 'Apply local changes', 'Export local changes' ] );

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
		expect(
			screen.queryByText( /tracks remote activity separately/ )
		).not.toBeInTheDocument();
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
		).toEqual( [ 'Export local changes' ] );
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
				'The latest post is loaded and local changes were applied in this editor. Continue Save before updating the post.'
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

		expect( screen.getByText( 'Choose block structure' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Blocks moved while you were editing. Choose which structure to keep before saving.'
			)
		).toBeVisible();
		expect( screen.getByText( 'Next step:' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Choose saved WordPress or local structure below before saving.'
			)
		).toBeVisible();
		expect(
			screen.getByText(
				'Save is paused until you choose a block structure.'
			)
		).toBeVisible();
		const reorderStatusItem = screen
			.getByText( 'Choose block structure' )
			// eslint-disable-next-line testing-library/no-node-access
			.closest( '[data-distributed-editing-next-step]' );
		expect( reorderStatusItem ).toHaveAttribute(
			'data-distributed-editing-next-step',
			'choose_structural_version'
		);
		expect( reorderStatusItem ).toHaveAttribute(
			'data-distributed-editing-save-now-action',
			'choose_block_structure'
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

		expect( screen.getByText( 'Ready to continue Save' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Local changes are ready against the latest post. Continue Save before updating the post.'
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

		expect( screen.getByText( 'Save needed' ) ).toBeVisible();
		expect(
			screen.getByText(
				'These changes are ready. Continue Save before updating the post; local changes remain pending.'
			)
		).toBeVisible();
		expect(
			screen.queryByText(
				/retry save applied|post saved|saved successfully|changes are saved/i
			)
		).not.toBeInTheDocument();
	} );

	it( 'renders reviewed protected changes as local guarded-save readiness', () => {
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

		expect( screen.getByText( 'Save needed' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Admin-reviewed changes are ready for WordPress Save. They remain protected and exportable until WordPress confirms the update.'
			)
		).toBeVisible();
		expect( screen.queryByText( /saved/i ) ).not.toBeInTheDocument();
	} );

	it( 'renders generic protected readiness separately from reviewed proof readiness', () => {
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

		expect( screen.getByText( 'Save needed' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Protected recovery changes are ready for WordPress Save. They remain protected and exportable until WordPress confirms the update.'
			)
		).toBeVisible();
		expect(
			screen.queryByText( /Admin-reviewed changes are ready/ )
		).not.toBeInTheDocument();
	} );

	it( 'renders fresh-review check blockers as no-save review requests', async () => {
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
				'This reviewed copy needs a fresh admin check before WordPress can Save it. Request a new admin review before saving; nothing was saved or sent to WordPress.'
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
				'Protected changes need admin HTML review before Save can continue. Risky block evidence remains redacted until the review surface opens. No normal Save has run; protected local changes remain exportable.'
			)
		).toBeVisible();
		expect(
			screen.getByText(
				'Fresh-review Save confirmation was recorded; use WordPress Save evidence to confirm persistence. Recorded 4 redacted transcript events; 2 unsafe entries were dropped. This transcript is diagnostic only; WordPress Save evidence is still required before treating these changes as saved.'
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
			screen.queryByTestId( 'distributed-editing-fresh-review-authority' )
		).not.toBeInTheDocument();
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
				'Protected changes need admin HTML review before Save can continue. 1 risky block is represented only by redacted review evidence. No normal Save has run; protected local changes remain exportable.'
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
			screen.queryByTestId( 'distributed-editing-fresh-review-authority' )
		).not.toBeInTheDocument();
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
				'WordPress is checking the review before it can update the post. Local changes remain protected until this finishes.'
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
			screen.queryByTestId( 'distributed-editing-fresh-review-authority' )
		).not.toBeInTheDocument();
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

		expect( screen.getByText( 'Ready to Save' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Save will ask WordPress to check the reviewed changes before updating the post. Local changes remain protected until WordPress confirms Save.'
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
			screen.queryByTestId( 'distributed-editing-fresh-review-authority' )
		).not.toBeInTheDocument();
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
				title: 'Load latest version',
				message: 'Load the latest post before saving again.',
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
					'One block still needs review from someone with HTML permission. Safe edits that WordPress accepted stay in the post, and the blocked block stays pending in this editor.',
				refetch: true,
				expectNoExport: true,
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_SYNC_META_TAMPERED,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED,
				title: 'Fresh-review Save rejected',
				message:
					'WordPress could not verify the reviewed Save before saving. Protected local changes are still exportable for a new review; no normal save fallback was used.',
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
			expect(
				screen.getAllByText( statusCase.title )[ 0 ]
			).toBeVisible();
			expect(
				screen.getAllByText( statusCase.message )[ 0 ]
			).toBeVisible();
			expect(
				screen.queryAllByRole( 'button', {
					name: 'Export for fresh review',
				} )
			).toHaveLength( statusCase.expectNoExport ? 0 : 1 );
			expect(
				screen.queryAllByRole( 'button', {
					name: 'Get latest post',
				} )
			).toHaveLength( 0 );
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
		expect(
			screen.queryByTestId( 'distributed-editing-fresh-review-authority' )
		).not.toBeInTheDocument();
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
				'Fresh-review Save confirmation was recorded; use WordPress Save evidence to confirm persistence. Recorded 4 redacted transcript events; 2 unsafe entries were dropped. This transcript is diagnostic only; WordPress Save evidence is still required before treating these changes as saved.'
			)
		).toBeVisible();
		expect( screen.getByText( 'Awaiting review' ) ).toBeVisible();
		expect( screen.getByText( 'Approve paragraph change' ) ).toBeVisible();
		expect( screen.getByText( 'Reject HTML change' ) ).toBeVisible();
		expect(
			screen.getAllByText(
				'Activity context: Fresh-review Save confirmed; 4 redacted transcript events, 2 unsafe entries dropped. Diagnostic only; WordPress Save evidence is still required.'
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
				'Fresh-review decision recorded locally. No save was made, and the reviewed-block evidence remains redacted.'
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
				'Fresh-review decision recorded for the request. No save was made, and the reviewed-block evidence remained redacted.'
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
				'Fresh-review decision recorded locally. No save was made, and the reviewed-block evidence remains redacted.'
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

		expect( screen.getByText( 'Save needed' ) ).toBeVisible();
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

		expect( screen.getByText( 'Saving' ) ).toBeVisible();
		expect(
			screen.getAllByText( 'WordPress is saving your changes.' ).length
		).toBeGreaterThan( 0 );

		rerender(
			<DistributedEditingStatusSurface
				noticeDescriptors={ savedDescriptors }
			/>
		);

		expect(
			screen.queryByText(
				'WordPress saved your changes. Ready for new edits.'
			)
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'region', {
				name: 'Distributed editing status',
			} )
		).not.toBeInTheDocument();

		rerender(
			<DistributedEditingStatusSurface
				noticeDescriptors={ mergedSavedDescriptors }
			/>
		);

		expect(
			screen.queryByText(
				'WordPress saved the merged edits. Ready for new edits.'
			)
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'region', {
				name: 'Distributed editing status',
			} )
		).not.toBeInTheDocument();
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
			screen.getAllByText( 'Save will check WordPress' )
		).toHaveLength( 2 );
		expect(
			screen.getByText(
				'Save will check the current WordPress copy before updating.'
			)
		).toBeVisible();
		expect(
			screen.getByText( 'Save will check WordPress before trying again.' )
		).toBeVisible();

		rerender(
			<DistributedEditingStatusSurface
				noticeDescriptors={ tamperedDescriptors }
			/>
		);

		expect( screen.getByText( 'Save not completed' ) ).toBeVisible();
		expect(
			screen.getByText(
				'WordPress could not verify this Save. Your changes remain in this editor.'
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
					'The HTML review was accepted, but this account cannot perform the final HTML-capable save. Ask someone with HTML permission to complete the save.',
				expectNoExport: true,
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
					'The reviewed changes token could not be found in server storage and is no longer usable for Save. No server save was made. Request a fresh admin review before trying again; protected local changes remain exportable.',
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
					'The reviewed changes token has expired and is no longer usable for Save. No server save was made. Request a fresh admin review before trying again; protected local changes remain exportable.',
				exportLabel: 'Export for fresh review',
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
				title: 'Safe parts saved',
				message:
					'WordPress saved the safe parts, but one block was blocked.',
				expectNoExport: true,
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
			const exportLabel =
				statusCase.exportLabel || 'Export local changes';
			const expectsExport = ! statusCase.expectNoExport;
			expect( screen.queryAllByText( exportLabel ) ).toHaveLength(
				expectsExport ? 1 : 0
			);
			expect(
				screen.queryAllByText( 'Export changes for review' )
			).toHaveLength( 0 );
			expect(
				screen.queryAllByRole( 'button', {
					name: 'Get latest post',
				} )
			).toHaveLength( 0 );
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
	} );

	it( 'renders blocked retry-save handoff copy and actions', () => {
		const cases = [
			{
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_PROOF_NOT_ACCEPTED,
				title: 'Save unavailable',
				message: 'Try Save again in a moment.',
				nextStep:
					'Try Save again after WordPress accepts these changes.',
				nextStepAction: 'wait_for_save_proof',
			},
			{
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
				title: 'Load latest version',
				message: 'Load the latest post before saving again.',
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
				title: 'Saving',
				message: 'WordPress is saving your changes.',
				nextStep: 'WordPress is saving your changes.',
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
			expect(
				screen.getAllByText( statusCase.message ).length
			).toBeGreaterThan( 0 );
			expect( screen.getByText( 'Next step:' ) ).toBeVisible();
			expect(
				screen.getAllByText( statusCase.nextStep ).length
			).toBeGreaterThan( 0 );
			const blockedHandoffStatusItem = screen
				.getByText( statusCase.title )
				// eslint-disable-next-line testing-library/no-node-access
				.closest( '[data-distributed-editing-next-step]' );
			expect( blockedHandoffStatusItem ).toHaveAttribute(
				'data-distributed-editing-next-step',
				statusCase.nextStepAction
			);
			expect(
				screen.queryAllByText( 'Export local changes' )
			).toHaveLength(
				statusCase.nextStepAction === 'keep_tab_open' ? 0 : 1
			);
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

		expect( screen.getByText( 'Load latest version' ) ).toBeVisible();
		expect(
			screen.getByText( 'Load the latest post before saving again.' )
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
