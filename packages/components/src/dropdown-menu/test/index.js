/**
 * External dependencies
 */
import { fireEvent, render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { DOWN } from '@wordpress/keycodes';
import { arrowLeft, arrowRight, arrowUp, arrowDown } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import DropdownMenu from '../';
import { MenuItem } from '../../';

function getMenuToggleButton( container ) {
	return container.querySelector( '.components-dropdown-menu__toggle' );
}
function getNavigableMenu( container ) {
	return container.querySelector( '.components-dropdown-menu__menu' );
}

describe( 'DropdownMenu', () => {
	const children = ( { onClose } ) => <MenuItem onClick={ onClose } />;

	let controls;
	beforeEach( () => {
		controls = [
			{
				title: 'Up',
				icon: arrowUp,
				onClick: jest.fn(),
			},
			{
				title: 'Right',
				icon: arrowRight,
				onClick: jest.fn(),
			},
			{
				title: 'Down',
				icon: arrowDown,
				onClick: jest.fn(),
			},
			{
				title: 'Left',
				icon: arrowLeft,
				onClick: jest.fn(),
			},
		];
	} );

	describe( 'basic rendering', () => {
		it( 'should render a null element when neither controls nor children are assigned', () => {
			const { container } = render( <DropdownMenu /> );

			expect( container.firstChild ).toBeNull();
		} );

		it( 'should render a null element when controls are empty and children is not specified', () => {
			const { container } = render( <DropdownMenu controls={ [] } /> );

			expect( container.firstChild ).toBeNull();
		} );

		it( 'should open menu on arrow down (controls)', () => {
			const {
				container: { firstChild: dropdownMenuContainer },
			} = render( <DropdownMenu controls={ controls } /> );

			const button = getMenuToggleButton( dropdownMenuContainer );
			button.focus();
			fireEvent.keyDown( button, {
				keyCode: DOWN,
				stopPropagation: () => {},
				preventDefault: () => {},
			} );
			const menu = getNavigableMenu( dropdownMenuContainer );
			expect( menu ).toBeTruthy();

			expect(
				dropdownMenuContainer.querySelectorAll(
					'.components-dropdown-menu__menu-item'
				)
			).toHaveLength( controls.length );
		} );

		it( 'should open menu on arrow down (children)', () => {
			const {
				container: { firstChild: dropdownMenuContainer },
			} = render( <DropdownMenu children={ children } /> );

			const button = getMenuToggleButton( dropdownMenuContainer );
			button.focus();
			fireEvent.keyDown( button, {
				keyCode: DOWN,
				stopPropagation: () => {},
				preventDefault: () => {},
			} );

			expect( getNavigableMenu( dropdownMenuContainer ) ).toBeTruthy();

			const menuItem = dropdownMenuContainer.querySelector(
				'.components-menu-item__button'
			);
			fireEvent.click( menuItem );

			expect( getNavigableMenu( dropdownMenuContainer ) ).toBeNull();
		} );
	} );
} );
