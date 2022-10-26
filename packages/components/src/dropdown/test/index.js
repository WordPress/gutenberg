/**
 * External dependencies
 */
import { act, fireEvent, render, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Dropdown from '../';

function getPopover( container ) {
	return container.querySelector( '.components-popover' );
}

describe( 'Dropdown', () => {
	it( 'should toggle the dropdown properly', async () => {
		const expectButtonExpanded = ( container, expanded ) => {
			expect( container.querySelectorAll( 'button' ) ).toHaveLength( 1 );
			expect( container.querySelector( 'button' ) ).toHaveAttribute(
				'aria-expanded',
				expanded.toString()
			);
		};

		const { container } = render(
			<Dropdown
				className="container"
				contentClassName="content"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<button aria-expanded={ isOpen } onClick={ onToggle }>
						Toggleee
					</button>
				) }
				renderContent={ () => <span>test</span> }
			/>
		);

		const dropdownContainer = container.firstChild;

		expectButtonExpanded( dropdownContainer, false );
		expect( getPopover( dropdownContainer ) ).not.toBeInTheDocument();

		const button = dropdownContainer.querySelector( 'button' );
		fireEvent.click( button );

		// Wait for the `floating-ui` effects in `DropDown`/`Popover` to finish running
		// See also: https://floating-ui.com/docs/react-dom#testing
		await act( () => Promise.resolve() );

		expectButtonExpanded( dropdownContainer, true );

		// we need to wait because showing the dropdown is animated
		await waitFor( () =>
			expect( getPopover( dropdownContainer ) ).toBeVisible()
		);
	} );

	it( 'should close the dropdown when calling onClose', async () => {
		const { container } = render(
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

		const dropdownContainer = container.firstChild;

		expect( getPopover( dropdownContainer ) ).not.toBeInTheDocument();

		const openButton = dropdownContainer.querySelector( '.open' );
		fireEvent.click( openButton );

		// Wait for the `floating-ui` effects in `Dropdown`/`Popover` to finish running
		// See also: https://floating-ui.com/docs/react-dom#testing
		await act( () => Promise.resolve() );

		// we need to wait because showing the dropdown is animated
		await waitFor( () =>
			expect( getPopover( dropdownContainer ) ).toBeVisible()
		);

		const closeButton = dropdownContainer.querySelector( '.close' );
		fireEvent.click( closeButton );

		// Wait for the `floating-ui` effects in `Dropdown`/`Popover` to finish running
		// See also: https://floating-ui.com/docs/react-dom#testing
		await act( () => Promise.resolve() );

		expect( getPopover( dropdownContainer ) ).not.toBeInTheDocument();
	} );
} );
