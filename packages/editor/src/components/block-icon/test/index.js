/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockIcon from '../';

describe( 'BlockIcon', () => {
	it( 'renders a Icon', () => {
		const wrapper = shallow( <BlockIcon icon="format-image" /> );

		expect( wrapper.containsMatchingElement( <Icon icon="format-image" /> ) ).toBe( true );
	} );

	it( 'renders a span without the has-colors classname', () => {
		const wrapper = shallow( <BlockIcon icon="format-image" /> );

		expect( wrapper.find( 'span' ).hasClass( 'has-colors' ) ).toBe( false );
	} );

	it( 'renders a span with the has-colors classname', () => {
		const wrapper = shallow( <BlockIcon icon="format-image" showColors /> );

		expect( wrapper.find( 'span' ).hasClass( 'has-colors' ) ).toBe( true );
	} );

	it( 'skips adding background and foreground styles when colors are not enabled', () => {
		const wrapper = shallow( <BlockIcon icon={ { background: 'white', foreground: 'black' } } /> );

		expect( wrapper.find( 'span' ).prop( 'style' ) ).toEqual( {} );
	} );

	it( 'adds background and foreground styles when colors are enabled', () => {
		const wrapper = shallow( <BlockIcon icon={ { background: 'white', foreground: 'black' } } showColors /> );

		expect( wrapper.find( 'span' ).prop( 'style' ) ).toEqual( {
			backgroundColor: 'white',
			color: 'black',
		} );
	} );
} );
