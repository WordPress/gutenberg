/**
 * External dependencies
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import useConstrainedTabbing from '../';

describe( 'useConstrainedTabbing', () => {
	function ConstrainedTabbingComponent() {
		const constrainedTabbingRef = useConstrainedTabbing();
		return (
			<div ref={ constrainedTabbingRef } data-testid="test-component">
				<button type="button">Button 1</button>
				<div data-testid="test-component" tabIndex={ -1 } />
				<button type="button">Button 2</button>
				<button
					type="button"
					onClick={ () => {
						const placeholder =
							screen.getByTestId( 'test-component' );
						placeholder.focus();
					} }
				>
					Button 3
				</button>
			</div>
		);
	}

	it( 'should constrain tabbing when tabbing forwards', async () => {
		const user = userEvent.setup( { delay: 100 } );

		render(
			<div>
				<button type="button">Focusable element before</button>
				<ConstrainedTabbingComponent />
				<button type="button">Focusable element after</button>
			</div>
		);

		const focusableBefore = screen.getByRole( 'button', {
			name: 'Focusable element before',
		} );
		const button1 = screen.getByRole( 'button', {
			name: 'Button 1',
		} );
		const button2 = screen.getByRole( 'button', {
			name: 'Button 2',
		} );
		const button3 = screen.getByRole( 'button', {
			name: 'Button 3',
		} );

		await user.keyboard( '{Tab}' );
		expect( focusableBefore ).toHaveFocus();

		await user.keyboard( '{Tab}' );
		expect( button1 ).toHaveFocus();

		await user.keyboard( '{Tab}' );
		expect( button2 ).toHaveFocus();

		await user.keyboard( '{Tab}' );
		expect( button3 ).toHaveFocus();

		// Looks like the React Testing Library didn't implement event.keycode.
		// Also, we can't use user.Tab() and the like, as the trap element is
		// injected in the DOM while the Tab key is being pressed.
		fireEvent.keyDown( button3, { code: 'Tab' } );

		const component = screen.getByTestId( 'test-component' );
		// eslint-disable-next-line testing-library/no-node-access
		const trap = component.firstChild;

		await waitFor( () =>
			expect( trap.outerHTML ).toEqual( '<div tabindex="-1"></div>' )
		);

		expect( trap ).toHaveFocus();

		// At this point, the trap element should be blurred.
		// Then, the focused element should be Button 1.
	} );
} );
