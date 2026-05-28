/**
 * External dependencies
 */
import { act, fireEvent, render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DistributedEditingServerSyncButton from '../';

const mockSyncDistributedEditingWithServer = jest.fn();

jest.mock( '@wordpress/data/src/components/use-dispatch', () => {
	return {
		useDispatch: () => ( {
			__experimentalSyncDistributedEditingWithServer:
				mockSyncDistributedEditingWithServer,
		} ),
		useDispatchWithMap: jest.fn(),
	};
} );

jest.mock( '@wordpress/data/src/components/use-select', () => {
	const mock = jest.fn();
	return mock;
} );

jest.mock( '@wordpress/icons/src/icon', () => () => (
	<svg data-testid="distributed-editing-sync-cloud-icon" />
) );

function getSyncButtonState( {
	isDistributedEditingSaveInFlight = false,
	isSaving = false,
	intervalMilliseconds = 5000,
} = {} ) {
	return {
		isDistributedEditingEnabled: true,
		isDistributedEditingSaveInFlight,
		isSaving,
		postId: 44,
		syncPollingIntervalMilliseconds: intervalMilliseconds,
	};
}

async function advanceTimersByTime( milliseconds ) {
	await act( async () => {
		jest.advanceTimersByTime( milliseconds );
		await Promise.resolve();
	} );
}

describe( 'DistributedEditingServerSyncButton', () => {
	beforeEach( () => {
		mockSyncDistributedEditingWithServer.mockClear();
		mockSyncDistributedEditingWithServer.mockResolvedValue( {
			status: 'server_sync_current',
		} );
		useSelect.mockImplementation( () => getSyncButtonState() );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'renders the animated polling interval on the Sync button', () => {
		useSelect.mockImplementation( () =>
			getSyncButtonState( { intervalMilliseconds: 7500 } )
		);

		render( <DistributedEditingServerSyncButton /> );

		const syncButton = screen.getByRole( 'button', {
			name: 'Sync with WordPress',
		} );

		expect( syncButton ).toHaveAttribute(
			'data-distributed-editing-server-sync-polling',
			'true'
		);
		expect( syncButton ).toHaveAttribute(
			'data-distributed-editing-server-sync-poll-interval-ms',
			'7500'
		);
		expect(
			screen.getByTestId( 'distributed-editing-sync-cloud-icon' )
		).toBeVisible();
	} );

	it( 'syncs automatically when the polling animation cycle completes', async () => {
		jest.useFakeTimers();

		render( <DistributedEditingServerSyncButton /> );

		await advanceTimersByTime( 4999 );

		expect( mockSyncDistributedEditingWithServer ).not.toHaveBeenCalled();

		await advanceTimersByTime( 1 );

		expect( mockSyncDistributedEditingWithServer ).toHaveBeenCalledTimes(
			1
		);
	} );

	it( 'restarts the automatic polling cycle after a manual Sync click', async () => {
		jest.useFakeTimers();

		render( <DistributedEditingServerSyncButton /> );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Sync with WordPress' } )
		);

		await advanceTimersByTime( 0 );

		expect( mockSyncDistributedEditingWithServer ).toHaveBeenCalledTimes(
			1
		);

		await advanceTimersByTime( 5000 );

		expect( mockSyncDistributedEditingWithServer ).toHaveBeenCalledTimes(
			2
		);
	} );

	it( 'does not schedule automatic polling while the editor is saving', async () => {
		jest.useFakeTimers();
		useSelect.mockImplementation( () =>
			getSyncButtonState( { isSaving: true } )
		);

		render( <DistributedEditingServerSyncButton /> );

		expect(
			screen.getByRole( 'button', { name: 'Sync with WordPress' } )
		).toHaveAttribute( 'aria-disabled', 'true' );

		await advanceTimersByTime( 5000 );

		expect( mockSyncDistributedEditingWithServer ).not.toHaveBeenCalled();
	} );

	it( 'does not schedule automatic polling while Distributed Editing Save is in flight', async () => {
		jest.useFakeTimers();
		useSelect.mockImplementation( () =>
			getSyncButtonState( { isDistributedEditingSaveInFlight: true } )
		);

		render( <DistributedEditingServerSyncButton /> );

		expect(
			screen.getByRole( 'button', { name: 'Sync with WordPress' } )
		).toHaveAttribute( 'aria-disabled', 'true' );

		await advanceTimersByTime( 5000 );

		expect( mockSyncDistributedEditingWithServer ).not.toHaveBeenCalled();
	} );
} );
