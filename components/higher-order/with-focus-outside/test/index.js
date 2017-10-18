/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { Component } from '../../../../element';

/**
 * Internal dependencies
 */
import withFocusOutside from '../';

class Test extends Component {
	render() {
		return (
			<div className="test">Testing</div>
		);
	}
}

describe( 'withFocusOutside()', () => {
	const Composite = withFocusOutside( Test );

	it( 'should render a basic Test component inside the HOC', () => {
		const renderedComposite = shallow( <Composite /> );
		const wrappedElement = renderedComposite.find( Test );
		const wrappedElementShallow = wrappedElement.shallow();
		expect( wrappedElementShallow.hasClass( 'test' ) ).toBe( true );
		expect( wrappedElementShallow.type() ).toBe( 'div' );
		expect( wrappedElementShallow.text() ).toBe( 'Testing' );
	} );

	it( 'should pass additional props through to the wrapped element', () => {
		const renderedComposite = shallow( <Composite test="test" /> );
		const wrappedElement = renderedComposite.find( Test );
		// Ensure that the wrapped Test element has the appropriate props.
		expect( wrappedElement.props().test ).toBe( 'test' );
	} );
} );
