/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import withFocusReturn from '..';

class Test extends Component< { className: string; focusHistory: unknown } > {
	render() {
		const { className, focusHistory } = this.props;
		return (
			<div
				className={ className }
				data-testid="test-element"
				data-focus-history={ focusHistory }
			>
				<textarea aria-label="Textarea" />
			</div>
		);
	}
}

describe( 'withFocusReturn()', () => {
	describe( 'testing rendering and focus handling', () => {
		const Composite = withFocusReturn( Test );
		const activeElement = document.createElement( 'button' );
		const switchFocusTo = document.createElement( 'input' );
		document.body.appendChild( activeElement );
		document.body.appendChild( switchFocusTo );

		beforeEach( () => {
			activeElement.focus();
		} );

		afterEach( () => {
			activeElement.blur();
		} );

		it( 'should render a basic Test component inside the HOC', () => {
			render( <Composite /> );

			expect( screen.getByTestId( 'test-element' ) ).toBeVisible();
		} );

		it( 'should pass own props through to the wrapped element', () => {
			render( <Composite className="test" /> );

			expect( screen.getByTestId( 'test-element' ) ).toHaveClass(
				'test'
			);
		} );

		it( 'should not pass any withFocusReturn context props through to the wrapped element', () => {
			render( <Composite className="test" /> );

			expect( screen.getByTestId( 'test-element' ) ).not.toHaveAttribute(
				'data-focus-history'
			);
		} );

		it( 'should not switch focus back to the bound focus element', () => {
			const { unmount } = render( <Composite />, {
				container: document.body.appendChild(
					document.createElement( 'div' )
				),
			} );

			// Change activeElement.
			switchFocusTo.focus();
			expect( switchFocusTo ).toHaveFocus();

			// Should keep focus on switchFocusTo, because it is not within HOC.
			unmount();
			expect( switchFocusTo ).toHaveFocus();
		} );

		it( 'should switch focus back when unmounted while having focus', async () => {
			const user = userEvent.setup();

			const { unmount } = render( <Composite />, {
				container: document.body.appendChild(
					document.createElement( 'div' )
				),
			} );

			// Click inside the textarea to focus it.
			await user.click(
				screen.getByRole( 'textbox', {
					name: 'Textarea',
				} )
			);

			// Should return to the activeElement saved with this component.
			unmount();
			expect( activeElement ).toHaveFocus();
		} );
	} );
} );
