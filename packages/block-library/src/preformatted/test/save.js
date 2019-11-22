/**
 * External dependencies
 */
import renderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import Preformatted from '../save';

describe( 'core/more/save', () => {
	it( 'saves a simple content without crashing', () => {
		const wrapper = renderer.create( <Preformatted attributes={ { content: '<b>Hello World!</b>' } } /> );
		const rendered = wrapper.toJSON();
		expect( rendered ).toMatchSnapshot();
		wrapper.unmount();
	} );
} );
