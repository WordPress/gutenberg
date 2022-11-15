/**
 * External dependencies
 */
import { fireEvent, render, within } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Dropdown from '..';

function getButtonElement( container: HTMLElement ) {
	const button = container?.querySelector( 'button' );
	if ( ! button ) {
		fail( 'Could not find the open close button' );
	}

	return button;
}
function getOpenCloseButton( container: HTMLElement, selector: string ) {
	const button = container.querySelector( selector );
	if ( ! button ) {
		fail( 'Could not find the open close button' );
	}

	return button;
}

describe( 'Dropdown', () => {
	function expectPopoverVisible( container: ChildNode, value: boolean ) {
		const popover = container.contains(
			document.querySelector( '.components-popover' )
		);
		if ( value ) {
			expect( popover ).toBeTruthy();
		} else {
			expect( popover ).toBeFalsy();
		}
	}

	it( 'should toggle the dropdown properly', () => {
		const expectButtonExpanded = (
			container: HTMLElement,
			expanded: boolean
		) => {
			expect(
				within( container ).getByRole( 'button' )
			).toBeInTheDocument();
			expect( getButtonElement( container ) ).toHaveAttribute(
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

		if ( ! container ) {
			fail( 'Did not find the dropdown container' );
		}

		expectButtonExpanded( container, false );
		expectPopoverVisible( container, false );

		const button = getButtonElement( container );
		fireEvent.click( button );

		expectButtonExpanded( container, true );
		expectPopoverVisible( container, true );
	} );

	it( 'should close the dropdown when calling onClose', () => {
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

		if ( ! container ) {
			fail( 'Did not find the dropdown container' );
		}

		expectPopoverVisible( container, false );

		const openButton = getOpenCloseButton( container, '.open' );
		fireEvent.click( openButton );

		expectPopoverVisible( container, true );

		const closeButton = getOpenCloseButton( container, '.close' );
		fireEvent.click( closeButton );

		expectPopoverVisible( container, false );
	} );
} );
