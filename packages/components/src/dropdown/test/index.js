/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import Dropdown from '../';

describe( 'Dropdown', () => {
	it( 'should toggle the dropdown properly', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );
		const { unmount } = render(
			<Dropdown
				className="container"
				contentClassName="content"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<button aria-expanded={ isOpen } onClick={ onToggle }>
						Toggle
					</button>
				) }
				renderContent={ () => <span>test</span> }
				popoverProps={ { 'data-testid': 'popover' } }
			/>
		);

		const button = screen.getByRole( 'button', { expanded: false } );

		expect( button ).toBeVisible();
		expect( screen.queryByTestId( 'popover' ) ).not.toBeInTheDocument();

		await user.click( button );

		expect(
			screen.getByRole( 'button', { expanded: true } )
		).toBeVisible();

		await waitFor( () =>
			expect( screen.getByTestId( 'popover' ) ).toBeVisible()
		);

		// Cleanup remaining effects, like the popover positioning
		unmount();
	} );

	it( 'should close the dropdown when calling onClose', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );
		render(
			<Dropdown
				className="container"
				contentClassName="content"
				renderToggle={ ( { isOpen, onToggle, onClose } ) => [
					<button
						key="open"
						className="open"
						aria-expanded={ isOpen }
						onClick={ onToggle }
					>
						Toggle
					</button>,
					<button key="close" className="close" onClick={ onClose }>
						close
					</button>,
				] }
				renderContent={ () => null }
				popoverProps={ { 'data-testid': 'popover' } }
			/>
		);

		expect( screen.queryByTestId( 'popover' ) ).not.toBeInTheDocument();

		const openButton = screen.getByRole( 'button', { name: 'Toggle' } );
		await user.click( openButton );

		await waitFor( () =>
			expect( screen.getByTestId( 'popover' ) ).toBeVisible()
		);

		const closeButton = screen.getByRole( 'button', { name: 'close' } );
		await user.click( closeButton );

		expect( screen.queryByTestId( 'popover' ) ).not.toBeInTheDocument();
	} );
} );
