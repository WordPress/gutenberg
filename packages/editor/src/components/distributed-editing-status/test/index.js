/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import {
	DistributedEditingStatusSurface,
	getDistributedEditingStatusSurfaceItems,
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
