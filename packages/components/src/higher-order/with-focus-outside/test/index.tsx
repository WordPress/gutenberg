/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import withFocusOutside from '..';

interface TestComponentProps {
	onFocusOutside: ( event: FocusEvent ) => void;
}

let onFocusOutside: () => void;

describe( 'withFocusOutside', () => {
	let origHasFocus: typeof document.hasFocus;

	const EnhancedComponent = withFocusOutside(
		class extends Component< TestComponentProps > {
			handleFocusOutside() {
				this.props.onFocusOutside( new FocusEvent( 'blur' ) );
			}

			render() {
				return (
					<div>
						<input type="text" />
						<input type="button" />
					</div>
				);
			}
		}
	);

	const TestComponent: React.FC< TestComponentProps > = ( props ) => {
		return <EnhancedComponent { ...props } />;
	};

	beforeEach( () => {
		// Mock document.hasFocus() to always be true for testing
		// note: we override this for some tests.
		origHasFocus = document.hasFocus;
		document.hasFocus = () => true;

		onFocusOutside = jest.fn();
	} );

	afterEach( () => {
		document.hasFocus = origHasFocus;
	} );

	it( 'should not call handler if focus shifts to element within component', async () => {
		render( <TestComponent onFocusOutside={ onFocusOutside } /> );

		const input = screen.getByRole( 'textbox' );
		const button = screen.getByRole( 'button' );

		input.focus();
		input.blur();
		button.focus();

		await waitFor( () => expect( onFocusOutside ).not.toHaveBeenCalled() );
	} );

	it( 'should not call handler if focus transitions via click to button', async () => {
		const user = userEvent.setup();
		render( <TestComponent onFocusOutside={ onFocusOutside } /> );

		const input = screen.getByRole( 'textbox' );
		const button = screen.getByRole( 'button' );

		input.focus();
		await user.click( button );

		await waitFor( () => expect( onFocusOutside ).not.toHaveBeenCalled() );
	} );

	it( 'should call handler if focus doesn’t shift to element within component', async () => {
		render( <TestComponent onFocusOutside={ onFocusOutside } /> );

		const input = screen.getByRole( 'textbox' );
		input.focus();
		input.blur();

		await waitFor( () => expect( onFocusOutside ).toHaveBeenCalled() );
	} );

	it( 'should not call handler if focus shifts outside the component when the document does not have focus', async () => {
		render( <TestComponent onFocusOutside={ onFocusOutside } /> );

		// Force document.hasFocus() to return false to simulate the window/document losing focus
		// See https://developer.mozilla.org/en-US/docs/Web/API/Document/hasFocus.
		document.hasFocus = () => false;

		const input = screen.getByRole( 'textbox' );
		input.focus();
		input.blur();

		await waitFor( () => expect( onFocusOutside ).not.toHaveBeenCalled() );
	} );

	it( 'should cancel check when unmounting while queued', async () => {
		const { rerender } = render(
			<TestComponent onFocusOutside={ onFocusOutside } />
		);

		const input = screen.getByRole( 'textbox' );
		input.focus();
		input.blur();

		rerender( <div /> );

		await waitFor( () => expect( onFocusOutside ).not.toHaveBeenCalled() );
	} );
} );
