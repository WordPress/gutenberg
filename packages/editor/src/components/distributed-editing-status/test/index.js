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
	DISTRIBUTED_EDITING_NOTICE_ACTIONS,
	DISTRIBUTED_EDITING_NOTICE_KINDS,
	DISTRIBUTED_EDITING_REASON_CODES,
	DISTRIBUTED_EDITING_UNLOAD_WARNING_REASONS,
	getDistributedEditingNoticeDescriptorsForSessionState,
	getDistributedEditingUnloadWarningStateForSessionState,
} from '../../../store/distributed-editing';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/data/src/components/use-dispatch', () => ( {
	useDispatch: jest.fn(),
} ) );

function setupDistributedEditingStatusSelect( {
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
			getDistributedEditingSessionState: () => sessionState,
			getDistributedEditingNoticeDescriptors: () => noticeDescriptors,
			getDistributedEditingUnloadWarningState: () => unloadWarningState,
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
		resetDistributedEditingSessionState: jest.fn(),
		setDistributedEditingSessionState: jest.fn(),
	};

	useDispatch.mockReturnValue( actions );

	return actions;
}

afterEach( () => {
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
			screen.getByRole( 'region', {
				name: 'Distributed editing status',
			} )
		).toBeVisible();
		expect( screen.getByText( 'Remote changes received' ) ).toBeVisible();
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
			} );

		render(
			<DistributedEditingStatusSurface
				noticeDescriptors={ noticeDescriptors }
				onAction={ onAction }
			/>
		);

		expect( screen.getByText( 'Server version changed' ) ).toBeVisible();
		expect(
			screen.getByText(
				'Refresh the server version before retrying local changes.'
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
