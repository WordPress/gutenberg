/**
 * External dependencies
 */
import renderer from 'react-test-renderer';
import { render, fireEvent } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import withFocusReturn from '../';

class Test extends Component {
	render() {
		return (
			<div className="test">
				<textarea />
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
			const renderedComposite = renderer.create( <Composite /> );
			const wrappedElement = renderedComposite.root.findByType( Test );
			const wrappedElementShallow = wrappedElement.children[ 0 ];
			expect( wrappedElementShallow.props.className ).toBe( 'test' );
			expect( wrappedElementShallow.type ).toBe( 'div' );
			expect( wrappedElementShallow.children[ 0 ].type ).toBe(
				'textarea'
			);
		} );

		it( 'should pass own props through to the wrapped element', () => {
			const renderedComposite = renderer.create(
				<Composite test="test" />
			);
			const wrappedElement = renderedComposite.root.findByType( Test );
			// Ensure that the wrapped Test element has the appropriate props.
			expect( wrappedElement.props.test ).toBe( 'test' );
		} );

		it( 'should not pass any withFocusReturn context props through to the wrapped element', () => {
			const renderedComposite = renderer.create(
				<Composite test="test" />
			);
			const wrappedElement = renderedComposite.root.findByType( Test );
			// Ensure that the wrapped Test element has the appropriate props.
			expect( wrappedElement.props.focusHistory ).toBeUndefined();
		} );

		it( 'should not switch focus back to the bound focus element', () => {
			const { unmount } = render( <Composite />, {
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
			const { container, unmount } = render( <Composite />, {
				container: document.body.appendChild(
					document.createElement( 'div' )
				),
			} );

			const textarea = container.querySelector( 'textarea' );
			fireEvent.focusIn( textarea, { target: textarea } );
			textarea.focus();
			expect( document.activeElement ).toBe( textarea );

			// Should return to the activeElement saved with this component.
			unmount();
			render( <div></div>, {
				container,
			} );
			expect( document.activeElement ).toBe( activeElement );
		} );
	} );
} );
