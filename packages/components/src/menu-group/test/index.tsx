/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { MenuGroup } from '../';

describe( 'MenuGroup', () => {
	test( 'should render null when no children provided', () => {
		render( <MenuGroup /> );

		expect( screen.queryByRole( 'group' ) ).not.toBeInTheDocument();
	} );

	test( 'should render children', () => {
		render(
			<MenuGroup>
				<p>My item</p>
			</MenuGroup>
		);

		expect( screen.queryByRole( 'group' ) ).toBeVisible();
		expect( screen.queryByText( 'My item' ) ).toBeVisible();
	} );

	test( 'should render with an accessible label', () => {
		render( <MenuGroup label="My group">Example</MenuGroup> );

		expect(
			screen.queryByRole( 'group', {
				name: 'My group',
			} )
		).toBeVisible();
	} );
} );
