/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Dropdown from '../';

function getButtonElement( container ) {
	return container.querySelector( 'button' );
}
function getOpenCloseButton( container, selector ) {
	return container.querySelector( selector );
}

describe( 'Dropdown', () => {
	it( 'should toggle the dropdown properly', () => {
		const expectButtonExpanded = ( container, expanded ) => {
			expect( container.querySelectorAll( 'button' ) ).toHaveLength( 1 );
			expect( getButtonElement( container ) ).toHaveAttribute(
				'aria-expanded',
				expanded.toString()
			);
		};

		const {
			container: { firstChild: dropdownContainer },
		} = render(
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

		expectButtonExpanded( dropdownContainer, false );
		expect( screen.queryByTestId( 'popover' ) ).not.toBeInTheDocument();

		const button = getButtonElement( dropdownContainer );
		fireEvent.click( button );

		expectButtonExpanded( dropdownContainer, true );
		expect( screen.getByTestId( 'popover' ) ).toBeVisible();
	} );

	it( 'should close the dropdown when calling onClose', () => {
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
		fireEvent.click( openButton );

		expect( screen.getByTestId( 'popover' ) ).toBeVisible();

		const closeButton = getOpenCloseButton( dropdownContainer, '.close' );
		fireEvent.click( closeButton );

		expect( screen.queryByTestId( 'popover' ) ).not.toBeInTheDocument();
	} );
} );
