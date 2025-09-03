/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import useFocusOutside from '../';

const FocusOutsideComponent = ( { onFocusOutside: callback } ) => (
	<div>
		{ /* Wrapper */ }
		<div { ...useFocusOutside( callback ) }>
			<input type="text" />
			<button>Button inside the wrapper</button>
			<iframe title="test-iframe">
				<button>Inside the iframe</button>
			</iframe>
		</div>

		<button>Button outside the wrapper</button>
	</div>
);

describe( 'useFocusOutside', () => {
	it( 'should not call handler if focus shifts to element within component', async () => {
		const mockOnFocusOutside = jest.fn();
		const user = userEvent.setup();

		render(
			<FocusOutsideComponent onFocusOutside={ mockOnFocusOutside } />
		);

		// Tab through the interactive elements inside the wrapper,
		// causing multiple focus/blur events.
		await user.tab();
		expect( screen.getByRole( 'textbox' ) ).toHaveFocus();

		await user.tab();
		expect(
			screen.getByRole( 'button', { name: 'Button inside the wrapper' } )
		).toHaveFocus();

		expect( mockOnFocusOutside ).not.toHaveBeenCalled();
	} );

	it( 'should not call handler if focus transitions via click to button', async () => {
		const mockOnFocusOutside = jest.fn();
		const user = userEvent.setup();

		render(
			<FocusOutsideComponent onFocusOutside={ mockOnFocusOutside } />
		);

		// Click the input and the button, causing multiple focus/blur events.
		await user.click( screen.getByRole( 'textbox' ) );
		await user.click(
			screen.getByRole( 'button', { name: 'Button inside the wrapper' } )
		);

		expect( mockOnFocusOutside ).not.toHaveBeenCalled();
	} );

	it( 'should call handler if focus shifts to element outside component', async () => {
		const mockOnFocusOutside = jest.fn();
		const user = userEvent.setup();

		render(
			<FocusOutsideComponent onFocusOutside={ mockOnFocusOutside } />
		);

		// Click and focus button inside the wrapper
		await user.click(
			screen.getByRole( 'button', { name: 'Button inside the wrapper' } )
		);

		expect( mockOnFocusOutside ).not.toHaveBeenCalled();

		// Click and focus button outside the wrapper
		await user.click(
			screen.getByRole( 'button', { name: 'Button outside the wrapper' } )
		);

		expect( mockOnFocusOutside ).toHaveBeenCalled();
	} );

	it( 'should not call handler if focus shifts outside the component when the document does not have focus', async () => {
		// Force document.hasFocus() to return false to simulate the window/document losing focus
		// See https://developer.mozilla.org/en-US/docs/Web/API/Document/hasFocus.
		const mockedDocumentHasFocus = jest
			.spyOn( document, 'hasFocus' )
			.mockImplementation( () => false );
		const mockOnFocusOutside = jest.fn();
		const user = userEvent.setup();

		render(
			<FocusOutsideComponent onFocusOutside={ mockOnFocusOutside } />
		);

		// Click and focus button inside the wrapper, then click and focus
		// a button outside the wrapper.
		await user.click(
			screen.getByRole( 'button', { name: 'Button inside the wrapper' } )
		);
		await user.click(
			screen.getByRole( 'button', { name: 'Button outside the wrapper' } )
		);

		// The handler is not called thanks to the mocked return value of
		// `document.hasFocus()`
		expect( mockOnFocusOutside ).not.toHaveBeenCalled();

		// Restore the `document.hasFocus()` function to its original implementation.
		mockedDocumentHasFocus.mockRestore();
	} );

	it( 'should call handler when unmounting while queued', async () => {
		let resolvePromise;
		const promise = new Promise( ( resolve ) => {
			resolvePromise = resolve;
		} );
		const mockOnFocusOutside = jest
			.fn()
			.mockImplementation( resolvePromise );
		const user = userEvent.setup();

		const { unmount } = render(
			<FocusOutsideComponent onFocusOutside={ mockOnFocusOutside } />
		);

		// Click and focus button inside the wrapper.
		const button = screen.getByRole( 'button', {
			name: 'Button inside the wrapper',
		} );
		await user.click( button );

		// Click outside the wrapper to trigger a blur event and queue the callback
		const outsideButton = screen.getByRole( 'button', {
			name: 'Button outside the wrapper',
		} );
		await user.click( outsideButton );

		// Immediately unmount the component while the blur event is queued
		// The callback should still be called.
		unmount();

		// Wait for the callback to be called
		await promise;

		expect( mockOnFocusOutside ).toHaveBeenCalled();
	} );
} );
