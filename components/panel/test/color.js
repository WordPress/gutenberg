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

	it( 'should have color when provided', () => {
		const wrapper = shallow( <PanelColor colorValue="red" title="sample title" /> );

		expect( wrapper.prop( 'title' ) ).toContainEqual(
			<span className="components-panel__color-area" key="color" style={ { background: 'red' } } />
		);
	} );
} );
