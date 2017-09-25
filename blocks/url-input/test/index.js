/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { IconButton } from '@wordpress/components';
import UrlInputButton from '../button';
import UrlInput from '../';

describe( 'UrlInputButton', () => {
	it( 'renders `Edit Link` button', () => {
		const wrapper = shallow( <UrlInputButton /> );
		expect( wrapper.find( IconButton ).length ).toEqual( 1 );
	} );
	it( 'expands when `Edit` clicked', () => {
		const wrapper = shallow( <UrlInputButton /> );
		wrapper.find( IconButton ).simulate( 'click' );
		expect( wrapper.find( 'form' ).length ).toEqual( 1 );
	} );
	it( 'allows url to be input', () => {
		const wrapper = shallow( <UrlInputButton /> );
		wrapper.find( IconButton ).simulate( 'click' );
		const input = wrapper.find( UrlInput );
		input.simulate( 'change', 'https://wordpress.org/' );
		expect( wrapper.find( UrlInput ).prop( 'value' ) ).toEqual( 'https://wordpress.org/' );
	} );
	it( 'call `onChange` when url submitted', () => {
		let newUrl = '';

		const wrapper = shallow( <UrlInputButton onChange={ ( { url } ) => {
			newUrl = url;
		} } /> );

		wrapper.find( IconButton ).simulate( 'click' );
		const input = wrapper.find( UrlInput );
		input.simulate( 'change', 'https://wordpress.org/' );

		wrapper.find( 'form' ).simulate( 'submit', { preventDefault: () => {} } ); // link entry
		wrapper.find( 'form' ).simulate( 'submit', { preventDefault: () => {} } ); // settings
		wrapper.find( 'form' ).simulate( 'submit', { preventDefault: () => {} } ); // display

		expect( newUrl ).toEqual( 'https://wordpress.org/' );
		expect( wrapper.find( 'form' ).length ).toEqual( 0 );
	} );
} );
