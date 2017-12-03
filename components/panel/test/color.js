/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import PanelColor from '../color';

describe( 'PanelColor', () => {
	it( 'should match snapshot', () => {
		const wrapper = shallow( <PanelColor colorValue="red" title="sample title" /> );
		expect( wrapper ).toMatchSnapshot();
	} );
	it( 'should match snapshot when title is empty', () => {
		const wrapper = shallow( <PanelColor colorValue="red" /> );
		expect( wrapper ).toMatchSnapshot();
	} );
} );
