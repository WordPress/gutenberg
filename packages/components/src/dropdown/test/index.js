/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import Dropdown from '../';

function getOpenCloseButton( container, selector ) {
	return container.querySelector( selector );
}

describe( 'Dropdown', () => {
	it( 'should toggle the dropdown properly', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );
		render(
			<Dropdown
				className="container"
				contentClassName="content"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<button aria-expanded={ isOpen } onClick={ onToggle }>
						Toggleee
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
		expect( screen.getByTestId( 'popover' ) ).toBeVisible();
	} );

	it( 'should close the dropdown when calling onClose', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );
		const {
			container: { firstChild: dropdownContainer },
		} = render(
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
						Toggleee
					</button>,
					<button key="close" className="close" onClick={ onClose }>
						closee
					</button>,
				] }
				renderContent={ () => null }
			/>
		);

		expect( screen.queryByTestId( 'popover' ) ).not.toBeInTheDocument();

		const openButton = getOpenCloseButton( dropdownContainer, '.open' );
		await user.click( openButton );

		expect( screen.getByTestId( 'popover' ) ).toBeVisible();

		const closeButton = getOpenCloseButton( dropdownContainer, '.close' );
		await user.click( closeButton );

		expect( screen.queryByTestId( 'popover' ) ).not.toBeInTheDocument();
	} );
} );
