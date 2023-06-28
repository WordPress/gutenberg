/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import useFocusOutside from '../';

const FocusOutsideComponent = ( { onFocusOutside: callback } ) => {
	const focusOutsideProps = useFocusOutside( callback );

	return (
		<div>
			{ /* Wrapper */ }
			<div { ...focusOutsideProps }>
				<input type="text" />
				<button>Button inside the wrapper</button>
				<iframe title="test-iframe">
					<button>Inside the iframe</button>
				</iframe>
			</div>

			<button>Button outside the wrapper</button>
		</div>
	);
};

describe( 'useFocusOutside', () => {
	let mockedDocumentHasFocus;

	beforeEach( () => {
		mockedDocumentHasFocus = jest
			.spyOn( document, 'hasFocus' )
			.mockImplementation( () => true );
	} );

	afterEach( () => {
		mockedDocumentHasFocus.mockRestore();
	} );

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
		const buttonInside = screen.getByRole( 'button', {
			name: 'Button inside the wrapper',
		} );
		await user.click( buttonInside );

		// TODO: find a way to guarantee that the callback does not fire
		await new Promise( ( r ) => setTimeout( r, 200 ) );

		expect( mockOnFocusOutside ).not.toHaveBeenCalled();
		// Click and focus button outside the wrapper
		const buttonOutside = screen.getByRole( 'button', {
			name: 'Button outside the wrapper',
		} );
		await user.click( buttonOutside );

		await waitFor( () =>
			expect( mockOnFocusOutside ).toHaveBeenCalledTimes( 1 )
		);
	} );

	it( 'should not call handler if focus shifts outside the component when the document does not have focus', async () => {
		// Force document.hasFocus() to return false to simulate the window/document losing focus
		// See https://developer.mozilla.org/en-US/docs/Web/API/Document/hasFocus.
		mockedDocumentHasFocus = jest
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

	it( 'should cancel check when unmounting while queued', async () => {
		const mockOnFocusOutside = jest.fn();
		const user = userEvent.setup();

		const { unmount } = render(
			<FocusOutsideComponent onFocusOutside={ mockOnFocusOutside } />
		);

		// Click and focus button inside the wrapper.
		const button = screen.getByRole( 'button', {
			name: 'Button inside the wrapper',
		} );
		await user.click( button );

		// Simulate a blur event and the wrapper unmounting while the blur event
		// handler is queued
		button.blur();
		unmount();

		expect( mockOnFocusOutside ).not.toHaveBeenCalled();
	} );
} );
