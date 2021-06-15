/**
 * External dependencies
 */
import { render, fireEvent } from '@testing-library/react';

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
	// This allows us to tweak the returned value on each test
	const mock = jest.fn();
	return mock;
} );

describe( 'DownloadableBlockListItem', () => {
	it( 'should render a block item', () => {
		useSelect.mockImplementation( () => ( {
			isInstalling: false,
			isInstallable: true,
		} ) );

		const { queryByText } = render(
			<DownloadableBlockListItem onClick={ jest.fn() } item={ plugin } />
		);
		const author = queryByText( `by ${ plugin.author }` );
		const description = queryByText( plugin.description );
		expect( author ).not.toBeNull();
		expect( description ).not.toBeNull();
	} );

	it( 'should show installing status when installing the block', () => {
		useSelect.mockImplementation( () => ( {
			isInstalling: true,
			isInstallable: true,
		} ) );

		const { queryByText } = render(
			<DownloadableBlockListItem onClick={ jest.fn() } item={ plugin } />
		);
		const statusLabel = queryByText( 'Installing…' );
		expect( statusLabel ).not.toBeNull();
	} );

	it( "should be disabled when a plugin can't be installed", () => {
		useSelect.mockImplementation( () => ( {
			isInstalling: false,
			isInstallable: false,
		} ) );

		const { getByRole } = render(
			<DownloadableBlockListItem onClick={ jest.fn() } item={ plugin } />
		);
		const button = getByRole( 'option' );
		expect( button.disabled ).toBe( true );
		expect( button.getAttribute( 'aria-disabled' ) ).toBe( 'true' );
	} );

	it( 'should try to install the block plugin', () => {
		useSelect.mockImplementation( () => ( {
			isInstalling: false,
			isInstallable: true,
		} ) );
		const onClick = jest.fn();
		const { getByRole } = render(
			<DownloadableBlockListItem onClick={ onClick } item={ plugin } />
		);

		const button = getByRole( 'option' );
		fireEvent.click( button );

		expect( onClick ).toHaveBeenCalledTimes( 1 );
	} );
} );
