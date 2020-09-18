/**
 * External dependencies
 */
import { fireEvent, render } from '@testing-library/react';

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
	function expectPopoverVisible( container, value ) {
		const popover = container.querySelector( '.components-popover' );
		if ( value ) {
			expect( popover ).toBeTruthy();
		} else {
			expect( popover ).toBeFalsy();
		}
	}

	it( 'should toggle the dropdown properly', () => {
		const expectButtonExpanded = ( container, expanded ) => {
			expect( container.querySelectorAll( 'button' ) ).toHaveLength( 1 );
			expect(
				getButtonElement( container ).getAttribute( 'aria-expanded' )
			).toBe( expanded.toString() );
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
			/>
		);

		expectButtonExpanded( dropdownContainer, false );
		expectPopoverVisible( dropdownContainer, false );

		const button = getButtonElement( dropdownContainer );
		fireEvent.click( button );

		expectButtonExpanded( dropdownContainer, true );
		expectPopoverVisible( dropdownContainer, true );
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

		expectPopoverVisible( dropdownContainer, false );

		const openButton = getOpenCloseButton( dropdownContainer, '.open' );
		fireEvent.click( openButton );

		expectPopoverVisible( dropdownContainer, true );

		const closeButton = getOpenCloseButton( dropdownContainer, '.close' );
		fireEvent.click( closeButton );

		expectPopoverVisible( dropdownContainer, false );
	} );
} );
