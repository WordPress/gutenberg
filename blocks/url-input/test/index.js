/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { IconButton } from '@wordpress/components';
import ToggleControl from '../../inspector-controls/toggle-control';
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
	it( '`onChange` called with new url', () => {
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
	it( '`onChange` called with un-linked url', () => {
		let newUrl = '';

		const wrapper = shallow( <UrlInputButton url="https://wordpress.org/" onChange={ ( { url } ) => {
			newUrl = url;
		} } /> );

		wrapper.find( IconButton ).simulate( 'click' );
		wrapper.find( '.blocks-url-input__unlink' ).simulate( 'click' );

		wrapper.find( 'form' ).simulate( 'submit', { preventDefault: () => {} } ); // done

		expect( newUrl ).toBeNull();
		expect( wrapper.find( 'form' ).length ).toEqual( 0 );
	} );

	it( '`onChange` called with new `opensInNewWindow`', () => {
		let newOpensInNewWindow = null;

		const wrapper = shallow( <UrlInputButton url="https://wordpress.org/" opensInNewWindow={ true } onChange={ ( { opensInNewWindow } ) => {
			newOpensInNewWindow = opensInNewWindow;
		} } /> );

		wrapper.find( IconButton ).simulate( 'click' ); // expand link entry
		wrapper.find( 'form' ).simulate( 'submit', { preventDefault: () => {} } ); // link entry

		wrapper.find( ToggleControl ).simulate( 'change' );

		wrapper.find( 'form' ).simulate( 'submit', { preventDefault: () => {} } ); // settings
		wrapper.find( 'form' ).simulate( 'submit', { preventDefault: () => {} } ); // display

		expect( newOpensInNewWindow ).toEqual( false );
		expect( wrapper.find( 'form' ).length ).toEqual( 0 ); // link entry collapsed
	} );

	it( 'displays url', () => {
		const wrapper = shallow( <UrlInputButton url="https://wordpress.org/" /> );
		wrapper.find( IconButton ).simulate( 'click' ); // expand link entry

		wrapper.find( 'form' ).simulate( 'submit', { preventDefault: () => {} } ); // move to settings
		wrapper.find( 'form' ).simulate( 'submit', { preventDefault: () => {} } ); // move to display

		expect( wrapper.find( 'a' ).prop( 'href' ) ).toEqual( 'https://wordpress.org/' );
	} );
} );
