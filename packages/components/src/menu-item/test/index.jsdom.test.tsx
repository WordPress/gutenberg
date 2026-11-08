import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { more } from '@wordpress/icons';
import MenuItem from '../';
import { NavigableMenu } from '../../navigable-container';

const noop = () => {};

describe( 'MenuItem', () => {
	it( 'should match snapshot when only label provided', () => {
		render( <MenuItem>My item</MenuItem> );

		expect( screen.getByRole( 'menuitem' ) ).toMatchSnapshot();
	} );

	it( 'should match snapshot when all props provided', () => {
		render(
			<MenuItem
				className="my-class"
				icon={ more }
				isSelected
				role="menuitemcheckbox"
				onClick={ noop }
				shortcut="mod+shift+alt+w"
			>
				My item
			</MenuItem>
		);

		expect( screen.getByRole( 'menuitemcheckbox' ) ).toMatchSnapshot();
	} );

	it( 'should match snapshot when isSelected and role are optionally provided', () => {
		render(
			<MenuItem
				className="my-class"
				icon={ more }
				onClick={ noop }
				shortcut="mod+shift+alt+w"
			>
				My item
			</MenuItem>
		);

		expect( screen.getByRole( 'menuitem' ) ).toMatchSnapshot();
	} );

	it( 'should match snapshot when info is provided', () => {
		render(
			<MenuItem info="Extended description of My Item">My item</MenuItem>
		);

		expect( screen.getByRole( 'menuitem' ) ).toMatchSnapshot();
	} );

	it( 'should avoid using aria-label if only has non-string children', () => {
		render(
			<MenuItem>
				<div />
			</MenuItem>
		);

		expect( screen.getByRole( 'menuitem' ) ).not.toHaveAttribute(
			'aria-label'
		);
	} );

	it( 'should avoid using aria-checked if only menuitem is set as aria-role', () => {
		render(
			<MenuItem role="menuitem" isSelected>
				<div />
			</MenuItem>
		);

		const menuItem = screen.getByRole( 'menuitem' );
		expect( menuItem ).not.toBeChecked();
	} );

	it( 'should use aria-checked if menuitemradio or menuitemcheckbox is set as aria-role', () => {
		const { rerender } = render(
			<MenuItem role="menuitemradio" isSelected>
				<div />
			</MenuItem>
		);

		const radioMenuItem = screen.getByRole( 'menuitemradio' );
		expect( radioMenuItem ).toBeChecked();

		rerender(
			<MenuItem role="menuitemcheckbox" isSelected>
				<div />
			</MenuItem>
		);

		const checkboxMenuItem = screen.getByRole( 'menuitemcheckbox' );
		expect( checkboxMenuItem ).toBeChecked();
	} );

	it( 'should not render shortcut or right icon if suffix provided', () => {
		render(
			<MenuItem
				icon={ <span>Icon</span> }
				iconPosition="right"
				role="menuitemcheckbox"
				shortcut="Shortcut"
				suffix="Suffix"
			>
				My item
			</MenuItem>
		);

		expect( screen.getByText( 'Suffix' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Shortcut' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Icon' ) ).not.toBeInTheDocument();
	} );

	it( 'should render left icon despite suffix being provided', () => {
		render(
			<MenuItem
				icon={ <span>Icon</span> }
				iconPosition="left"
				role="menuitemcheckbox"
				shortcut="Shortcut"
				suffix="Suffix"
			>
				My item
			</MenuItem>
		);

		expect( screen.getByText( 'Icon' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Suffix' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Shortcut' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps text focus when hovering an option', () => {
		render(
			<>
				<input aria-label="Search" />
				<MenuItem role="option">Result</MenuItem>
			</>
		);
		const input = screen.getByRole( 'textbox', { name: 'Search' } );
		input.focus();
		fireEvent.mouseMove( screen.getByRole( 'option', { name: 'Result' } ) );
		expect( input ).toHaveFocus();
	} );

	it( 'keeps focus in a text field beside a menu', () => {
		render(
			<>
				<input aria-label="URL" />
				<NavigableMenu>
					<MenuItem>Link to image file</MenuItem>
				</NavigableMenu>
			</>
		);
		const input = screen.getByRole( 'textbox', { name: 'URL' } );
		input.focus();
		fireEvent.mouseMove(
			screen.getByRole( 'menuitem', { name: 'Link to image file' } )
		);
		expect( input ).toHaveFocus();
	} );

	it( 'moves focus between menu items only while that menu contains focus', () => {
		render(
			<>
				<NavigableMenu aria-label="First menu" tabIndex={ -1 }>
					<MenuItem>First</MenuItem>
					<MenuItem>Second</MenuItem>
				</NavigableMenu>
				<NavigableMenu>
					<MenuItem>Other</MenuItem>
				</NavigableMenu>
			</>
		);
		const first = screen.getByRole( 'menuitem', { name: 'First' } );
		const second = screen.getByRole( 'menuitem', { name: 'Second' } );
		const other = screen.getByRole( 'menuitem', { name: 'Other' } );
		other.focus();
		fireEvent.mouseMove( first );
		expect( other ).toHaveFocus();

		screen.getByRole( 'menu', { name: 'First menu' } ).focus();
		fireEvent.mouseMove( first );
		expect( first ).toHaveFocus();
		fireEvent.mouseMove( second );
		expect( second ).toHaveFocus();
	} );

	it( 'lets an item hover handler own focus across repeated movement', () => {
		render(
			<NavigableMenu>
				<MenuItem>Original</MenuItem>
				<MenuItem>Destination</MenuItem>
				<MenuItem
					onMouseMove={ ( event ) => {
						event.preventDefault();
						screen
							.getByRole( 'menuitem', { name: 'Destination' } )
							.focus();
					} }
				>
					Item
				</MenuItem>
			</NavigableMenu>
		);
		const original = screen.getByRole( 'menuitem', { name: 'Original' } );
		const item = screen.getByRole( 'menuitem', { name: 'Item' } );
		const destination = screen.getByRole( 'menuitem', {
			name: 'Destination',
		} );
		for ( const initialFocus of [ original, destination ] ) {
			initialFocus.focus();
			for ( let move = 0; move < 3; move++ ) {
				fireEvent.mouseMove( item );
				expect( destination ).toHaveFocus();
			}
		}
	} );
} );
