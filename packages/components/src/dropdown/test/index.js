/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import Dropdown from '..';

describe( 'Dropdown', () => {
	it( 'should toggle the dropdown properly', async () => {
		render(
			<Dropdown
				renderToggle={ ( { isOpen, onToggle } ) => (
					<button aria-expanded={ isOpen } onClick={ onToggle }>
						Toggle
					</button>
				) }
				renderContent={ () => 'Content' }
			/>
		);

		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );
		const button = screen.getByRole( 'button' );

		expect( screen.queryByText( 'Content' ) ).not.toBeInTheDocument();
		expect( button ).toBeInTheDocument();
		expect( button ).toHaveAttribute( 'aria-expanded', 'false' );

		await user.click( button );
		expect( button ).toHaveAttribute( 'aria-expanded', 'true' );
		expect( screen.getByText( 'Content' ) ).toBeInTheDocument();
	} );

	it( 'should close the dropdown when calling onClose', async () => {
		render(
			<Dropdown
				renderToggle={ ( { isOpen, onToggle, onClose } ) => (
					<>
						<button aria-expanded={ isOpen } onClick={ onToggle }>
							Toggle
						</button>
						<button onClick={ onClose }>Close</button>
					</>
				) }
				renderContent={ () => 'Content' }
			/>
		);

		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );
		const openButton = screen.getByRole( 'button', { name: 'Toggle' } );
		const closeButton = screen.getByRole( 'button', { name: 'Close' } );

		expect( screen.queryByText( 'Content' ) ).not.toBeInTheDocument();

		await user.click( openButton );
		expect( screen.getByText( 'Content' ) ).toBeInTheDocument();

		await user.click( closeButton );
		expect( screen.queryByText( 'Content' ) ).not.toBeInTheDocument();
	} );
} );
