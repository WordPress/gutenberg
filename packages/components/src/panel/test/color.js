/**
 * External dependencies
 */
import { shallow, mount } from 'enzyme';

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
		const wrapper = mount( <PanelColor colorValue="red" title="sample title" /> );

		expect( wrapper.find( '[ariaLabel]' ).first().prop( 'ariaLabel' ) ).toBe( '(current color: red)' );
	} );

	it( 'should use color name in area label if provided', () => {
		const wrapper = mount( <PanelColor colorValue="#f00" colorName="red" title="sample title" /> );

		expect( wrapper.find( '[ariaLabel]' ).first().prop( 'ariaLabel' ) ).toBe( '(current color: red)' );
	} );
} );
