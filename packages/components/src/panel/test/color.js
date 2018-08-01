/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import PanelColor from '../color';

describe( 'PanelColor', () => {
	it( 'should match snapshot when title is provided', () => {
		const wrapper = shallow( <PanelColor title="sample title" /> );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
