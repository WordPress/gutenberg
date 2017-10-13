/**
 * External dependencies
 */
import { shallow, mount } from 'enzyme';

/**
 * Internal dependencies
 */
import { IconButton } from '@wordpress/components';
import ToggleControl from '../../inspector-controls/toggle-control';
import UrlInputButton from '../button';
import UrlInput from '../';
import { LinkSettings } from '../link-settings';

describe( 'UrlInputButton', () => {
	it( 'renders `Edit Link` button', () => {
		const wrapper = shallow( <UrlInputButton /> );
		expect( wrapper.find( IconButton ).length ).toEqual( 1 );
	} );
	it( 'expands when `Edit` clicked', () => {
		const wrapper = mount( <UrlInputButton /> );
		wrapper.find( IconButton ).simulate( 'click' );
		expect( wrapper.find( 'form' ).length ).toEqual( 1 );
	} );
} );

describe( 'LinkSettings', () => {
	it( '`onChange` called with new url', () => {
		let newUrl = '';

		const wrapper = shallow( <LinkSettings url="https://www.ephox.com" showOpensInNewWindow={ true } opensInNewWindow={ true } onCancel={ () => {} } onChange={ ( { url } ) => {
			newUrl = url;
		} } /> );

		const input = wrapper.find( UrlInput );
		input.simulate( 'change', 'https://wordpress.org/' );

		wrapper.find( 'form' ).simulate( 'submit', { preventDefault: () => {} } ); // link entry
		wrapper.find( 'form' ).simulate( 'submit', { preventDefault: () => {} } ); // settings
		wrapper.find( 'form' ).simulate( 'submit', { preventDefault: () => {} } ); // display

		expect( newUrl ).toEqual( 'https://wordpress.org/' );
	} );
	it( '`onChange` called with un-linked url', () => {
		let newUrl = '';

		const wrapper = shallow( <LinkSettings url="https://www.ephox.com" showOpensInNewWindow={ true } opensInNewWindow={ true } onCancel={ () => {} } onChange={ ( { url } ) => {
			newUrl = url;
		} } /> );

		wrapper.find( '.blocks-url-input__unlink' ).simulate( 'click' );

		wrapper.find( 'form' ).simulate( 'submit', { preventDefault: () => {} } ); // done

		expect( newUrl ).toBeNull();
	} );

	it( '`onChange` called with new `opensInNewWindow`', () => {
		let newOpensInNewWindow = null;

		const wrapper = shallow( <LinkSettings url="https://www.ephox.com" showOpensInNewWindow={ true } opensInNewWindow={ true } onCancel={ () => {} } onChange={ ( { opensInNewWindow } ) => {
			newOpensInNewWindow = opensInNewWindow;
		} } /> );

		wrapper.find( 'form' ).simulate( 'submit', { preventDefault: () => {} } ); // link entry

		wrapper.find( ToggleControl ).simulate( 'change' );

		wrapper.find( 'form' ).simulate( 'submit', { preventDefault: () => {} } ); // settings
		wrapper.find( 'form' ).simulate( 'submit', { preventDefault: () => {} } ); // display

		expect( newOpensInNewWindow ).toEqual( false );
	} );

	it( 'displays url', () => {
		const wrapper = shallow( <LinkSettings url="https://www.ephox.com" showOpensInNewWindow={ true } opensInNewWindow={ true } onCancel={ () => {} } onChange={ () => {} } /> );

		wrapper.find( 'form' ).simulate( 'submit', { preventDefault: () => {} } ); // move to settings
		wrapper.find( 'form' ).simulate( 'submit', { preventDefault: () => {} } ); // move to display

		expect( wrapper.find( 'a' ).prop( 'href' ) ).toEqual( 'https://www.ephox.com' );
	} );

	it( 'doesn`t show settings per prop', () => {
		const wrapper = shallow( <LinkSettings url="https://www.ephox.com" showOpensInNewWindow={ false } opensInNewWindow={ true } onCancel={ () => {} } onChange={ () => {} } /> );

		wrapper.find( 'form' ).simulate( 'submit', { preventDefault: () => {} } ); // move to display

		expect( wrapper.find( 'a' ).prop( 'href' ) ).toEqual( 'https://www.ephox.com' );
	} );

	it( '`onCancel` called', () => {
		let onCancelCalled = false;

		const wrapper = shallow( <LinkSettings url="https://www.ephox.com" showOpensInNewWindow={ true } opensInNewWindow={ true } onChange={ () => {} } onCancel={ () => {
			onCancelCalled = true;
		} } /> );

		wrapper.find( '.blocks-url-input__back' ).simulate( 'click' );

		expect( onCancelCalled ).toEqual( true );
	} );
} );
