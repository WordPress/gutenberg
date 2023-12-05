/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';
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
				<div data-testid="test-focusable-element" tabIndex={ -1 } />
				<button type="button">Button 2</button>
				<button
					type="button"
					onClick={ () => {
						const placeholder = screen.getByTestId(
							'test-focusable-element'
						);
						placeholder.focus();
					} }
				>
					Button 3
				</button>
			</div>
		);
	}

	it( 'should allow native tab behavior after focus is programmatically set on elements with negative tabindex', async () => {
		const user = userEvent.setup();

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
		const focusableDiv = screen.getByTestId( 'test-focusable-element' );

		await user.tab();
		expect( focusableBefore ).toHaveFocus();

		await user.tab();
		expect( button1 ).toHaveFocus();

		await user.tab();
		expect( button2 ).toHaveFocus();

		await user.tab();
		expect( button3 ).toHaveFocus();

		await button3.click();

		expect( focusableDiv ).toHaveFocus();

		await user.tab();
		expect( button2 ).toHaveFocus();
	} );

	it( 'should prepend and focus the trap element when tabbing forwards', async () => {
		const user = userEvent.setup();

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

		await user.tab();
		expect( focusableBefore ).toHaveFocus();

		await user.tab();
		expect( button1 ).toHaveFocus();

		await user.tab();
		expect( button2 ).toHaveFocus();

		await user.tab();
		expect( button3 ).toHaveFocus();

		const component = screen.getByTestId( 'test-component' );

		// Looks like the React Testing Library didn't implement event.keycode.
		// Note: Using await user.tab() would make the test fail.
		fireEvent.keyDown( component, { code: 'Tab' } );

		// eslint-disable-next-line testing-library/no-node-access
		const trap = component.firstChild;

		expect( trap.outerHTML ).toEqual( '<div tabindex="-1"></div>' );
		expect( trap ).toHaveFocus();
	} );

	it( 'should constrain tabbing when tabbing forwards using await user.tab', async () => {
		const user = userEvent.setup();

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

		await user.tab();
		expect( focusableBefore ).toHaveFocus();

		await user.tab();
		expect( button1 ).toHaveFocus();

		await user.tab();
		expect( button2 ).toHaveFocus();

		await user.tab();
		expect( button3 ).toHaveFocus();

		// Fails. Focus goes to `<button type="button">Focusable element after</button>`
		await user.tab();
		expect( button1 ).toHaveFocus();
	} );

	it( 'should constrain tabbing when tabbing forwards using user.tab with no await', async () => {
		const user = userEvent.setup();

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

		await user.tab();
		expect( focusableBefore ).toHaveFocus();

		await user.tab();
		expect( button1 ).toHaveFocus();

		await user.tab();
		expect( button2 ).toHaveFocus();

		await user.tab();
		expect( button3 ).toHaveFocus();

		// Fails. Focus is still on `<button type="button">Button 3</button>`
		user.tab();
		expect( button1 ).toHaveFocus();
	} );
} );
