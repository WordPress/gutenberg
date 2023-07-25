/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { more } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MenuItem from '../';

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
} );
