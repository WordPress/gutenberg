/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { prettyDOM } from '@testing-library/dom';
import NavigationMenuSelector from '../navigation-menu-selector';
// import useNavigationMenu from '../../use-navigation-menu';

jest.mock( '../../use-navigation-menu', () => {} );

describe( 'NavigationMenuSelector', () => {
	describe( 'Toggle', () => {
		it( 'should show dropdown toggle with loading state', async () => {
			render( <NavigationMenuSelector /> );

			expect( screen.getByRole( 'button' ) ).toHaveAttribute(
				'aria-label',
				'Loading …'
			);
		} );

		it( 'should show dropdown toggle with loading state', async () => {
			const user = userEvent.setup();
			render( <NavigationMenuSelector /> );

			const button = screen.getByRole( 'button' );

			await user.click( button );
		} );
	} );
} );
