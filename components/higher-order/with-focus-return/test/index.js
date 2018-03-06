/**
 * External dependencies
 */
import { shallow, mount } from 'enzyme';
import { Component } from '../../../../element';

/**
 * Internal dependencies
 */
import withFocusReturn from '../';

class Test extends Component {
	render() {
		return (
			<div className="test">Testing</div>
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
			const renderedComposite = shallow( <Composite /> );
			const wrappedElement = renderedComposite.find( 'Test' );
			const wrappedElementShallow = wrappedElement.shallow();
			expect( wrappedElementShallow.hasClass( 'test' ) ).toBe( true );
			expect( wrappedElementShallow.type() ).toBe( 'div' );
			expect( wrappedElementShallow.text() ).toBe( 'Testing' );
		} );

		it( 'should pass additional props through to the wrapped element', () => {
			const renderedComposite = shallow( <Composite test="test" /> );
			const wrappedElement = renderedComposite.find( 'Test' );
			// Ensure that the wrapped Test element has the appropriate props.
			expect( wrappedElement.props().test ).toBe( 'test' );
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
