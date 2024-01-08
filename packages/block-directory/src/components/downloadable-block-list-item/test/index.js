/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DownloadableBlockListItem from '../';
import { plugin } from '../../test/fixtures';

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

describe( 'DownloadableBlockListItem', () => {
	it( 'should render a block item', () => {
		useSelect.mockImplementation( () => ( {
			isInstalling: false,
			isInstallable: true,
		} ) );

		render(
			<DownloadableBlockListItem onClick={ jest.fn() } item={ plugin } />
		);
		const author = screen.queryByText( `by ${ plugin.author }` );
		const description = screen.queryByText( plugin.description );
		expect( author ).toBeInTheDocument();
		expect( description ).toBeInTheDocument();
	} );

	it( 'should show installing status when installing the block', () => {
		useSelect.mockImplementation( () => ( {
			isInstalling: true,
			isInstallable: true,
		} ) );

		render(
			<DownloadableBlockListItem onClick={ jest.fn() } item={ plugin } />
		);
		const statusLabel = screen.queryByText( 'Installing…' );
		expect( statusLabel ).toBeInTheDocument();
	} );

	it( "should be disabled when a plugin can't be installed", () => {
		useSelect.mockImplementation( () => ( {
			isInstalling: false,
			isInstallable: false,
		} ) );

		render(
			<DownloadableBlockListItem onClick={ jest.fn() } item={ plugin } />
		);
		const button = screen.getByRole( 'option' );
		// Keeping it false to avoid focus loss and disable it using aria-disabled.
		expect( button ).toBeEnabled();
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'should try to install the block plugin', async () => {
		const user = userEvent.setup();

		useSelect.mockImplementation( () => ( {
			isInstalling: false,
			isInstallable: true,
		} ) );
		const onClick = jest.fn();
		render(
			<DownloadableBlockListItem onClick={ onClick } item={ plugin } />
		);

		await user.click( screen.getByRole( 'option' ) );

		expect( onClick ).toHaveBeenCalledTimes( 1 );
	} );
} );
