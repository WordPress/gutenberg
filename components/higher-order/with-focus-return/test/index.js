/**
 * External dependencies
 */
import { expect } from 'chai';
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
	describe( 'expected behavior', () => {
		const Composite = withFocusReturn( Test );
		const activeElement = document.createElement( 'button' );
		const switchFocusTo = document.createElement( 'input' );

		beforeEach( () => {
			activeElement.focus();
		} );

		afterEach( () => {
			activeElement.blur();
		} );

		it( 'rendering with a basic <div> element', () => {
			const renderedComposite = shallow( <Composite /> );
			const wrappedElement = renderedComposite.find( 'Test' );
			const wrappedElementShallow = wrappedElement.shallow();
			expect( wrappedElementShallow.hasClass( 'test' ) ).to.be.true();
			expect( wrappedElementShallow.type() ).to.equal( 'div' );
			expect( wrappedElementShallow.text() ).to.equal( 'Testing' );
		} );

		it( 'passing additonal props', () => {
			const renderedComposite = shallow( <Composite test="test" /> );
			const wrappedElement = renderedComposite.find( 'Test' );
			// Ensure that the wrapped Test element has the appropriate props.
			expect( wrappedElement.node.props.test ).to.equal( 'test' );
		} );

		it( 'when component mounts and unmounts', () => {
			const mountedComposite = mount( <Composite /> );
			expect( mountedComposite.instance().activeElement ).to.equal( activeElement );

			// Change activeElement.
			switchFocusTo.focus();
			expect( document.activeElement ).to.equal( switchFocusTo );

			// Should keep focus on switchFocusTo because it is not within HOC.
			mountedComposite.unmount();
			expect( document.activeElement ).to.equal( switchFocusTo );
		} );

		it( 'should return focus to element associated with HOC', () => {
			const mountedComposite = mount( <Composite /> );
			expect( mountedComposite.instance().activeElement ).to.equal( activeElement );

			// Change activeElement.
			document.activeElement.blur();
			expect( document.activeElement ).to.equal( document.body );

			// Should not return to original activeElement because it is not contained in.
			mountedComposite.unmount();
			expect( document.activeElement ).to.equal( activeElement );
		} );
	} );
} );
