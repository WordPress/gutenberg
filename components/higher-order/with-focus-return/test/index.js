/**
 * External dependencies
 */
import { mount } from 'enzyme';
import { Component } from '../../../../element';

/**
 * Internal dependencies
 */
import withFocusReturn from '../';

class Test extends Component {
	render( props ) {
		return (
			<div className="test" { ...props }>Testing</div>
		);
	}
}

describe( 'withFocusReturn()', () => {
	describe( 'testing rendering and focus handling', () => {
		const Composite = withFocusReturn( Test );
		const activeElement = document.createElement( 'button' );
		const switchFocusTo = document.createElement( 'input' );

		beforeEach( () => {
			activeElement.focus();
		} );

		afterEach( () => {
			activeElement.blur();
		} );

		it( 'should render a basic Test component inside the HOC', () => {
			const renderedComposite = mount( <Composite /> );
			expect( renderedComposite ).toMatchSnapshot();
		} );

		it( 'should pass additional props through to the wrapped element', () => {
			const renderedComposite = mount( <Composite data-test="test" /> );
			expect( renderedComposite ).toMatchSnapshot();
		} );

		it( 'should focus the container on mount', () => {
			mount( <Composite data-test="test" /> );
			expect( document.activeElement.outerHTML ).toMatchSnapshot();
		} );

		it( 'should not switch focus back to the bound focus element', () => {
			const mountedComposite = mount( <Composite /> );
			expect( mountedComposite.instance().activeElementOnMount ).toBe( activeElement );

			// Change activeElement.
			switchFocusTo.focus();
			expect( document.activeElement ).toBe( switchFocusTo );

			// Should keep focus on switchFocusTo, because it is not within HOC.
			mountedComposite.unmount();
			expect( document.activeElement ).toBe( switchFocusTo );
		} );

		it( 'should return focus to element associated with HOC', () => {
			const mountedComposite = mount( <Composite /> );
			expect( mountedComposite.instance().activeElementOnMount ).toBe( activeElement );

			// Change activeElement.
			document.activeElement.blur();
			expect( document.activeElement ).toBe( document.body );

			// Should return to the activeElement saved with this component.
			mountedComposite.unmount();
			expect( document.activeElement ).toBe( activeElement );
		} );
	} );
} );
