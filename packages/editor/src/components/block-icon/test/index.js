/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { RawIcon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockIcon from '../';

describe( 'BlockIcon', () => {
	it( 'renders a RawIcon', () => {
		const wrapper = shallow( <BlockIcon icon="format-image" /> );

		expect( wrapper.containsMatchingElement( <RawIcon icon="format-image" /> ) ).toBe( true );
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
} );
