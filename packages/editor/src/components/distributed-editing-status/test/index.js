/**
 * External dependencies
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
	DISTRIBUTED_EDITING_REASON_CODES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS,
	DISTRIBUTED_EDITING_RETRY_SAVE_REVIEW_APPROVAL_PROOF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES,
	DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS,
	getDistributedEditingLocalUpdatesExportPayload,
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
		expect(
			screen.getByText(
				'Remote editing activity was recorded for review without exposing post content.'
			)
		).toBeVisible();
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
				'WordPress confirmed the fresh-review guarded save and kept the activity record content-free.'
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
		expect(
			screen.getByText( 'Distributed Editing enabled' )
		).toBeVisible();
		expect(
			screen.getByText(
				'WordPress will protect local changes and show sync status here when review, refresh, or server confirmation is needed.'
			)
		).toBeVisible();
		expect( screen.getByText( 'Save state' ) ).toBeVisible();
		expect(
			screen.getByText( 'Save can update the authoritative post.' )
		).toBeVisible();
		expect( screen.getByText( 'WordPress post' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Save can update the authoritative WordPress post.'
			)
		).toBeVisible();
		expect(
			screen.queryByRole( 'region', {
				name: 'Distributed editing status',
			} )
		).not.toBeInTheDocument();
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
						blockLabel: 'Chrome compare HTML change',
						baseContentHash:
							'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
						proposedContentHash:
							'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
						rawBlockContent:
							'<script>fresh-review-chrome-compare-raw</script>',
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
				name: 'Inspect compare evidence for Chrome compare HTML change',
			} )
		);

		expect(
			screen.getByText(
				'Compare evidence checked. The editor found hash evidence for this review item; no comparison was opened, no content changed, and no save was made.'
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
			screen.getByText(
				'Updates may be delayed. Local changes remain protected and exportable.'
			)
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
		expect(
			screen.getByText(
				'Protected local changes need review before the authoritative post can update.'
			)
		).toBeVisible();
		expect(
			screen.getByText(
				'The authoritative WordPress post cannot be updated until risky changes are approved or removed.'
			)
		).toBeVisible();
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
			'Admin-reviewed changes were imported into this editor only, with route, hash, and signed review proof checks passing. They remain protected until guarded save is confirmed; no server request was sent.'
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
			'Import blocked: this reviewed-changes handoff needs a fresh admin review before it can be imported for retry save. Nothing was imported, and local changes remain protected and exportable.',
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
						'Fresh-review guarded save confirmation was recorded; use save-authority evidence to confirm persistence.',
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
			'Import blocked: this reviewed-changes handoff needs a fresh admin review before it can be imported for retry save. Nothing was imported, and local changes remain protected and exportable.'
		);
		expect( status ).toHaveTextContent(
			'Fresh-review guarded save confirmation was recorded; use save-authority evidence to confirm persistence. Recorded 4 redacted transcript events; 2 unsafe entries were dropped.'
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
		expect( screen.getByText( 'Retry save in progress' ) ).toBeVisible();
		expect(
			screen.getByText(
				'The editor is sending rebased changes through the guarded retry-save path. Keep this tab open; protected local changes remain exportable until the server confirms the save.'
			)
		).toBeVisible();
		expect( screen.getByText( 'Changes pending' ) ).toBeVisible();
		expect(
			screen.getByText(
				'The guarded retry save is waiting for server confirmation. Protected local changes remain pending and exportable until confirmation.'
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

	it( 'renders already-confirmed retry-save state from production editor chrome without recovery actions', () => {
		setupDistributedEditingStatusSelect( {
			sessionState: {
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
		expect( screen.getByText( 'Retry save confirmed' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Server confirmed the guarded retry-save, advanced the sync version from 7 to 8, and recorded 1 revision. Protected local changes are no longer pending for this save.'
			)
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', {
				name: 'Export local changes',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', {
				name: 'Refresh server version',
			} )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Changes pending' )
		).not.toBeInTheDocument();
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

		expect(
			screen.getByText( 'Retry save already in progress' )
		).toBeVisible();
		expect(
			screen.getByText(
				'A retry save is already waiting for server confirmation. Protected local changes remain exportable; keep this tab open until it finishes.'
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
				name: 'Refresh server version',
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
				'Server version refreshed for review. Protected local changes remain in this editor session and can still be exported before retrying.'
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
				'Save did not update the authoritative post because these changes may alter unfiltered HTML. Export them for review by someone with unfiltered HTML permission, or refresh the server version before deciding how to continue. Protected local changes remain exportable.'
			)
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: 'Export local changes' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Export changes for review' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Refresh server version' } )
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
				name: 'Refresh server version',
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
				'Server version refreshed for HTML review. Protected local changes remain in this editor session and can still be exported before retrying.'
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
				'The imported reviewed-changes token could not be found in server storage and is no longer usable for retry save. No server save was made. Export a fresh-review handoff for an admin reviewer; protected local changes remain exportable.'
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
				name: 'Refresh server version',
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
				'Server version could not be refreshed. Protected local changes remain in this editor session and can still be exported; keep this tab open before trying again.'
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
			screen.getByText( 'Retry save needs server refresh' )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', {
				name: 'Export local changes',
			} )
		).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Refresh server version',
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
				'Server version refreshed for review. Protected local changes remain in this editor session and can still be exported before retrying.'
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
				name: 'Retry local changes',
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
			await screen.findByText( 'Local rebase readiness refreshed.' )
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
				name: 'Retry local changes',
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
				'Local changes retried over the refreshed server version.'
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
				name: 'Prepare retry submit',
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
				'Retry submit prepared. Request server proof when ready.'
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
				name: 'Refresh retry proof',
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
				'Retry submit proof refreshed. Save again to continue through the guarded retry path.'
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
				name: 'Prepare guarded save',
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
				'Guarded save path prepared. Save again to submit through the retry path.'
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

		expect( screen.getByText( 'Server version available' ) ).toBeVisible();
		expect(
			screen.getByText( 'Accept the server version before continuing.' )
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', {
				name: 'Accept server version',
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

		expect( screen.getByText( 'Local rebase ready' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Local changes can be rebased over the refreshed server version.'
			)
		).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Refresh server version',
			} )
		);

		expect( onAction ).toHaveBeenCalledWith(
			DISTRIBUTED_EDITING_NOTICE_ACTIONS.REFETCH_SERVER_STATE,
			expect.objectContaining( {
				kind: DISTRIBUTED_EDITING_NOTICE_KINDS.STALE_BASE_REJECTED,
			} )
		);
		expect(
			screen.getByRole( 'button', {
				name: 'Retry local changes',
			} )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', {
				name: 'Export local changes',
			} )
		).toBeVisible();
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

		expect(
			screen.getByText( 'Local rebase inputs missing' )
		).toBeVisible();
		expect(
			screen.getByText(
				'Retain both the client base and refreshed server version before retrying local changes.'
			)
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', {
				name: 'Retry local changes',
			} )
		).not.toBeInTheDocument();
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

		expect( screen.getByText( 'Local changes rebased' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Local changes were merged with the server version and are ready for the next submit.'
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

		expect( screen.getByText( 'Local rebase needs review' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Blocks were reordered while local edits were pending. Review the local and server versions before continuing.'
			)
		).toBeVisible();
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

		expect( screen.getByText( 'Local rebase blocked' ) ).toBeVisible();
		expect(
			screen.getByText(
				'The content is not represented by whole serialized blocks and needs manual review.'
			)
		).toBeVisible();
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

		expect( screen.getByText( 'Retry submit prepared' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Local changes are staged for the future retry path. No save has been sent yet.'
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
				'Retry submit accepted the rebased changes for a future save. Local changes are still awaiting confirmation.'
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
				'Admin-reviewed changes were imported locally with signed review proof and are ready for guarded save. They remain protected and exportable until the server confirms that path.'
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
				'Protected recovery changes were imported locally and are ready for guarded save. They remain protected and exportable until the server confirms that path.'
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
				'This fresh-review handoff cannot be imported for retry save because it has no usable accepted review proof. Request a new admin review before retry save; nothing was imported, saved, or sent to the server.'
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
				'Protected changes need hash-only admin review before Save can continue. Risky block evidence remains redacted until the review surface opens. No normal save or retry save has run; protected local changes remain exportable.'
			)
		).toBeVisible();
		expect(
			screen.getByText(
				'Fresh-review guarded save confirmation was recorded; use save-authority evidence to confirm persistence. Recorded 4 redacted transcript events; 2 unsafe entries were dropped. This transcript is diagnostic only; save authority evidence is still required before treating these changes as saved.'
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
				'Protected changes need hash-only admin review before Save can continue. 1 risky block is represented only by redacted review evidence. No normal save or retry save has run; protected local changes remain exportable.'
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
				'The editor is validating hash-only fresh-review proof before any guarded retry save. No normal save has run; keep protected local changes exportable until validation finishes.'
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
				'Reviewed changes are ready for server validation before guarded retry save. Save should continue only through fresh-review validation; no normal save fallback has run, and protected local changes remain exportable.'
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
			screen.getByText( 'Fresh-review retry save confirmed' )
		).toBeVisible();
		expect(
			screen.getByText(
				'Server confirmed the fresh-review retry-save, advanced the sync version from 12 to 13, and recorded 1 revision. Protected local changes are no longer pending for this save.'
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
				title: 'Fresh-review retry save stale',
				message:
					'The server changed after fresh review was validated. Protected local changes are still exportable; refresh the server version before trying again.',
				refetch: true,
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
				reasonCode: DISTRIBUTED_EDITING_REASON_CODES.REST_CANNOT_EDIT,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_PERMISSION_DENIED,
				title: 'Fresh-review retry save needs permission',
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
				title: 'Fresh-review retry save disabled',
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
				title: 'Fresh-review retry save route changed',
				message:
					'The reviewed retry-save request targeted a different editor route. Protected local changes are still exportable; reload only after exporting them.',
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_SYNC_META_TAMPERED,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_SYNC_META_TAMPERED,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_SYNC_META_TAMPERED,
				title: 'Fresh-review retry save proof rejected',
				message:
					'The server rejected the reviewed retry-save proof before saving. Protected local changes are still exportable for a new review; no normal save fallback was used.',
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_MALFORMED_SYNC_PAYLOAD,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD,
				title: 'Fresh-review retry save payload rejected',
				message:
					'The reviewed retry-save payload was incomplete or malformed. Protected local changes are still exportable for a new review before trying again.',
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

		rerender( renderStatus( cases[ 0 ] ) );
		expect(
			screen.getAllByRole( 'button', {
				name: 'Refresh server version',
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
				'This fresh-review decision was already used by a server retry save. Protected local changes remain exportable; request a new fresh review or refresh the server version before continuing.'
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
				name: 'Refresh server version',
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
						blockLabel: 'Approve HTML change',
						baseContentHash:
							'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
						proposedContentHash:
							'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
						rawBlockContent:
							'<script>fresh-approve-raw-content</script>',
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
				'Fresh-review guarded save confirmation was recorded; use save-authority evidence to confirm persistence. Recorded 4 redacted transcript events; 2 unsafe entries were dropped. This transcript is diagnostic only; save authority evidence is still required before treating these changes as saved.'
			)
		).toBeVisible();
		expect( screen.getByText( 'Awaiting review' ) ).toBeVisible();
		expect( screen.getByText( 'Approve HTML change' ) ).toBeVisible();
		expect( screen.getByText( 'Reject HTML change' ) ).toBeVisible();
		expect(
			screen.getAllByText(
				'Activity context: Fresh-review guarded save confirmed; 4 redacted transcript events, 2 unsafe entries dropped. Diagnostic only; save-authority evidence is still required.'
			)
		).toHaveLength( 2 );
		expect( screen.getAllByText( 'Jump target identified.' ) ).toHaveLength(
			2
		);
		expect(
			screen.getAllByText( 'Compare evidence available.' )
		).toHaveLength( 2 );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Inspect jump target for Approve HTML change',
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
				name: 'Inspect compare evidence for Approve HTML change',
			} )
		);

		expect(
			actions.__experimentalResolveDistributedEditingFreshReviewDecisionItem
		).not.toHaveBeenCalled();
		expect(
			screen.getByText(
				'Compare evidence checked. The editor found hash evidence for this review item; no comparison was opened, no content changed, and no save was made.'
			)
		).toBeVisible();

		await user.click(
			screen.getByRole( 'button', {
				name: 'Approve Approve HTML change',
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
				'Retry submit is ready for the guarded save path. Local changes remain pending until that save finishes.'
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

		const { rerender } = render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ savingDescriptors }
			/>
		);

		expect( screen.getByText( 'Retry save in progress' ) ).toBeVisible();
		expect(
			screen.getByText(
				'The editor is sending rebased changes through the guarded retry-save path. Keep this tab open; protected local changes remain exportable until the server confirms the save.'
			)
		).toBeVisible();

		rerender(
			<DistributedEditingStatusSurface
				noticeDescriptors={ savedDescriptors }
			/>
		);

		expect( screen.getByText( 'Retry save confirmed' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Server confirmed the guarded retry-save. Protected local changes are no longer pending for this save.'
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

		expect( screen.getAllByText( 'Retry save stale' ) ).toHaveLength( 2 );
		expect(
			screen.getAllByText(
				'The server changed again before this retry save finished. Protected local changes are still exportable; refresh the server version before trying again.'
			)
		).toHaveLength( 2 );

		rerender(
			<DistributedEditingStatusSurface
				noticeDescriptors={ tamperedDescriptors }
			/>
		);

		expect( screen.getByText( 'Retry save proof rejected' ) ).toBeVisible();
		expect(
			screen.getByText(
				'The server rejected the retry-save proof because the sync metadata or proof flags changed unexpectedly. Protected local changes are still exportable; export them before continuing.'
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
				title: 'Retry save permission changed',
				message:
					'Editing permission changed before the retry save finished. Protected local changes are still exportable; ask for access before retrying.',
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_PERMISSION_DENIED,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_REVIEW_APPROVAL_REQUIRES_UNFILTERED_HTML,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_PERMISSION_DENIED,
				title: 'Retry save needs HTML permission',
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
				title: 'Retry save disabled',
				message:
					'Distributed Editing was disabled before the retry save finished. Protected local changes are still exportable; retry after Distributed Editing is enabled.',
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_ROUTE_MISMATCH,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.REST_POST_INVALID_ID,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_ROUTE_MISMATCH,
				title: 'Retry save route changed',
				message:
					'The retry-save request targeted a different editor route. Protected local changes are still exportable; reload the editor only after exporting them.',
			},
			{
				disposition:
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_MALFORMED_SYNC_PAYLOAD,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_MALFORMED_SYNC_PAYLOAD,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_MALFORMED_SYNC_PAYLOAD,
				title: 'Retry save payload rejected',
				message:
					'The retry-save payload was incomplete or malformed. Protected local changes are still exportable; export them before trying again.',
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
					'The imported reviewed-changes token could not be found in server storage and is no longer usable for retry save. No server save was made. Export a fresh-review handoff for an admin reviewer; protected local changes remain exportable.',
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
					'The imported reviewed-changes token has expired and is no longer usable for retry save. No server save was made. Export a fresh-review handoff for an admin reviewer; protected local changes remain exportable.',
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
					'Save did not update the authoritative post because these changes may alter unfiltered HTML. Export them for review by someone with unfiltered HTML permission, or refresh the server version before deciding how to continue. Protected local changes remain exportable.',
				exportLabel: 'Export changes for review',
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

		rerender(
			renderStatus( cases.find( ( statusCase ) => statusCase.refetch ) )
		);
		expect( screen.getByText( 'Refresh server version' ) ).toBeVisible();
	} );

	it( 'renders blocked retry-save handoff copy and actions', () => {
		const cases = [
			{
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_PROOF_NOT_ACCEPTED,
				title: 'Retry save needs accepted proof',
				message:
					'The editor could not verify accepted retry-save proof for this save. Protected local changes are still exportable; retry after the proof is ready.',
			},
			{
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.SERVER_STATE_REFETCH_REQUIRED,
				title: 'Retry save needs server refresh',
				message:
					'The server state must be refreshed before retry-save can continue. Protected local changes are still exportable; refreshing only fetches server state and does not save over local changes.',
				refetch: true,
			},
			{
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.MISSING_POST_ROUTE,
				title: 'Retry save route unavailable',
				message:
					'The editor could not identify the route for retry-save. Protected local changes are still exportable; reload the editor only after exporting them.',
			},
			{
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.MISSING_PROPOSED_CONTENT,
				title: 'Retry save content unavailable',
				message:
					'The editor could not read the proposed post content for retry-save. Protected local changes are still exportable; export them before trying again.',
			},
			{
				reason: DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS,
				title: 'Retry save already in progress',
				message:
					'A retry save is already waiting for server confirmation. Protected local changes remain exportable; keep this tab open until it finishes.',
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
			expect( screen.getByText( 'Export local changes' ) ).toBeVisible();
		}

		rerender( renderStatus( cases[ 1 ] ) );
		expect( screen.getByText( 'Refresh server version' ) ).toBeVisible();
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

		expect( screen.getByText( 'Retry submit stale' ) ).toBeVisible();
		expect(
			screen.getByText(
				'The server changed after retry submit was prepared. Protected local changes remain exportable; refresh the server version before continuing.'
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
