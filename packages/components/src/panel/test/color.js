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

		expect( console ).toHaveWarnedWith(
			'wp.components.PanelColor is deprecated and will be removed from Gutenberg in 4.3. Please use wp.editor.PanelColorSettings instead.'
		);
	} );
} );
