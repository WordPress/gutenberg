/**
 * External dependencies
 */
import renderer, { act } from 'react-test-renderer';
import { render, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import withFocusReturn from '../';

const Textarea = () => {
	return <textarea />;
};
const WrappedTextarea = withFocusReturn( Textarea );

function Test( { rendered = true, ...props } ) {
	return (
		<div className="test">
			{ rendered && <WrappedTextarea { ...props } /> }
		</div>
	);
}

describe( 'withFocusReturn()', () => {
	describe( 'testing rendering and focus handling', () => {
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
			const renderedComposite = renderer.create( <Test /> );
			const wrappedElement = renderedComposite.root.findByType(
				Textarea
			);
			expect( wrappedElement.children[ 0 ].type ).toBe( 'textarea' );
		} );

		it( 'should pass own props through to the wrapped element', () => {
			const renderedComposite = renderer.create( <Test test="test" /> );
			const wrappedElement = renderedComposite.root.findByType(
				Textarea
			);
			// Ensure that the wrapped Test element has the appropriate props.
			expect( wrappedElement.props.test ).toBe( 'test' );
		} );

		it( 'should not pass any withFocusReturn context props through to the wrapped element', () => {
			const renderedComposite = renderer.create( <Test test="test" /> );
			const wrappedElement = renderedComposite.root.findByType(
				Textarea
			);
			// Ensure that the wrapped Test element has the appropriate props.
			expect( wrappedElement.props.focusHistory ).toBeUndefined();
		} );

		it( 'should not switch focus back to the bound focus element', () => {
			const { unmount } = render( <Test />, {
				container: document.body.appendChild(
					document.createElement( 'div' )
				),
			} );

			// Change activeElement.
			switchFocusTo.focus();
			expect( document.activeElement ).toBe( switchFocusTo );

			// Should keep focus on switchFocusTo, because it is not within HOC.
			unmount();
			expect( document.activeElement ).toBe( switchFocusTo );
		} );

		it( 'should switch focus back when unmounted while having focus', () => {
			const { container } = render( <Test />, {
				container: document.body.appendChild(
					document.createElement( 'div' )
				),
			} );

			const textarea = container.querySelector( 'textarea' );
			act( () => {
				fireEvent.focusIn( textarea, { target: textarea } );
				textarea.focus();
			} );
			expect( document.activeElement ).toBe( textarea );

			act( () => {
				render( <Test rendered={ false } />, {
					container,
				} );
			} );

			expect( document.activeElement ).toBe( activeElement );
		} );
	} );
} );
