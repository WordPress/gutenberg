/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DistributedEditingStatus, {
	DistributedEditingLocalRebaseStateInspector,
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
import {
	DISTRIBUTED_EDITING_DISPOSITIONS,
	DISTRIBUTED_EDITING_LOCAL_REBASE_PLAN_STATUSES,
	DISTRIBUTED_EDITING_LOCAL_REBASE_RESULT_STATUSES,
	DISTRIBUTED_EDITING_NOTICE_ACTIONS,
	DISTRIBUTED_EDITING_NOTICE_KINDS,
	DISTRIBUTED_EDITING_REASON_CODES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_PROOF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_REASONS,
	DISTRIBUTED_EDITING_RETRY_SUBMIT_SAVE_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES,
	DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS,
	DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES,
	DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS,
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
		expect( JSON.parse( writeText.mock.calls[ 0 ][ 0 ] ) ).toMatchObject( {
			version: 1,
			format: 'wp/de-rtc-local-updates',
			post: {
				id: 43,
				type: 'post',
			},
			postContent:
				'<!-- wp:paragraph --><p>Saving update</p><!-- /wp:paragraph -->',
			distributedEditingSessionState: {
				pendingChangeCount: 1,
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
				canExportLocalUpdates: true,
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
		expect( JSON.parse( writeText.mock.calls[ 0 ][ 0 ] ) ).toMatchObject( {
			post: {
				id: 44,
				type: 'post',
			},
			postContent:
				'<!-- wp:paragraph --><p>Blocked update</p><!-- /wp:paragraph -->',
			distributedEditingSessionState: {
				retrySaveStatus: DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING,
				retrySaveHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
				retrySaveHandoffReason:
					DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SAVE_IN_PROGRESS,
				canExportLocalUpdates: true,
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
			},
		} );

		render( <DistributedEditingStatusChrome /> );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Export local changes',
			} )
		);

		expect( writeText ).toHaveBeenCalledTimes( 1 );
		expect( JSON.parse( writeText.mock.calls[ 0 ][ 0 ] ) ).toMatchObject( {
			version: 1,
			format: 'wp/de-rtc-local-updates',
			post: {
				id: 42,
				type: 'post',
			},
			postContent:
				'<!-- wp:paragraph --><p>Local update</p><!-- /wp:paragraph -->',
			distributedEditingSessionState: {
				pendingChangeCount: 1,
				retrySaveHandoffStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_HANDOFF_STATUSES.RETRY_SAVE_BLOCKED,
				retrySaveHandoffReason:
					DISTRIBUTED_EDITING_RETRY_SAVE_POLICY_REASONS.RETRY_SUBMIT_PROOF_NOT_ACCEPTED,
				canExportLocalUpdates: true,
			},
		} );
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
		expect( screen.queryByText( /saved/i ) ).not.toBeInTheDocument();
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
					'The retry-save request targeted a different post route than this editor. Protected local changes are still exportable; reload the editor only after exporting them.',
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
					DISTRIBUTED_EDITING_DISPOSITIONS.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
				reasonCode:
					DISTRIBUTED_EDITING_REASON_CODES.DE_RTC_UNFILTERED_HTML_WOULD_CHANGE_CONTENT,
				retrySaveStatus:
					DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.REJECTED_UNFILTERED_HTML_REVIEW_REQUIRED,
				title: 'Retry save needs HTML review',
				message:
					'The server rejected this retry save because the change could alter unfiltered HTML written by another collaborator. Protected local changes are still exportable; export them, ask an unfiltered HTML reviewer for help, or refresh the server version before retrying.',
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
						retrySaveReason: statusCase.reasonCode,
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
			if ( statusCase.refetch ) {
				expect(
					screen.getByText( 'Refresh server version' )
				).toBeVisible();
			}
		}
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
					'The editor could not identify the post route for retry-save. Protected local changes are still exportable; reload the editor only after exporting them.',
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
