/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { Circle, Icon, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockIcon from '../';

describe( 'BlockIcon', () => {
	it( 'renders a Icon', () => {
		const wrapper = shallow( <BlockIcon icon="format-image" /> );

		expect( wrapper.containsMatchingElement( <Icon icon="format-image" /> ) ).toBe( true );
	} );

	it( 'renders a div without the has-colors classname', () => {
		const wrapper = shallow( <BlockIcon icon="format-image" /> );

		expect( wrapper.find( 'div' ).hasClass( 'has-colors' ) ).toBe( false );
	} );

	it( 'renders a div with the has-colors classname', () => {
		const wrapper = shallow( <BlockIcon icon="format-image" showColors /> );

		expect( wrapper.find( 'div' ).hasClass( 'has-colors' ) ).toBe( true );
	} );

	it( 'skips adding background and foreground styles when colors are not enabled', () => {
		const wrapper = shallow( <BlockIcon icon={ { background: 'white', foreground: 'black' } } /> );

		expect( wrapper.find( 'div' ).prop( 'style' ) ).toEqual( {} );
	} );

	it( 'adds background and foreground styles when colors are enabled', () => {
		const wrapper = shallow( <BlockIcon icon={ { background: 'white', foreground: 'black' } } showColors /> );

		expect( wrapper.find( 'div' ).prop( 'style' ) ).toEqual( {
			backgroundColor: 'white',
			color: 'black',
		} );
	} );

	it( 'adds background and foreground styles when an icon with background and a custom svg', () => {
		const icon = {
			background: '#f00',
			src: (
				<SVG width="20" height="20" viewBox="0 0 20 20">
					<Circle cx="10" cy="10" r="10" fill="red" stroke="blue" strokeWidth="10" />
				</SVG>
			),
		};
		const wrapper = shallow( <BlockIcon icon={ icon } showColors /> );

		expect( wrapper.find( 'div' ).prop( 'style' ) ).toEqual( {
			backgroundColor: '#f00',
			color: '#191e23',
		} );
	} );
} );
