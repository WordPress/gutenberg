/**
 * External dependencies
 */
import { shallow, mount } from 'enzyme';

/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import UrlInputButton from '../button';

describe( 'UrlInputButton', () => {
	it( 'should has valid class in wrapper tag', () => {
		const wrapper = shallow( <UrlInputButton /> );
		expect( wrapper.hasClass( 'blocks-url-input__button' ) ).toBeTruthy();
	} );
	it( 'should not have is-active class if url prop not defined', () => {
		const wrapper = shallow( <UrlInputButton /> );
		expect( wrapper.find( 'IconButton' ).hasClass( 'is-active' ) ).toBeFalsy();
	} );
	it( 'should have is-active class if url prop defined', () => {
		const wrapper = shallow( <UrlInputButton url="https://example.com" /> );
		expect( wrapper.find( 'IconButton' ).hasClass( 'is-active' ) ).toBeTruthy();
	} );
	it( 'should hidden form for default', () => {
		const wrapper = shallow( <UrlInputButton /> );
		expect( wrapper.find( 'form' ).length ).toBe( 0 );
		expect( wrapper.state().expanded ).toBeFalsy();
	} );
	it( 'should visible form if Edit Link button clicked', () => {
		const wrapper = shallow( <UrlInputButton /> );
		wrapper.find( 'IconButton.components-toolbar__control' ).simulate( 'click' );
		expect( wrapper.find( 'form' ).length ).toBe( 1 );
		expect( wrapper.state().expanded ).toBeTruthy();
	} );
	it( 'should call onChange function at once if value changes at once', () => {
		const onChangeMock = jest.fn();
		const wrapper = shallow( <UrlInputButton onChange={ onChangeMock } /> );
		wrapper.setState( { expanded: true } );
		wrapper.find( { value: '' } ).simulate( 'change' );
		expect( onChangeMock.mock.calls.length ).toBe( 1 );
	} );
	it( 'should call onChange function at twice if value changes at twice', () => {
		const onChangeMock = jest.fn();
		const wrapper = shallow( <UrlInputButton onChange={ onChangeMock } /> );
		wrapper.setState( { expanded: true } );
		wrapper.find( { value: '' } ).simulate( 'change' );
		wrapper.find( { value: '' } ).simulate( 'change' );
		expect( onChangeMock.mock.calls.length ).toBe( 2 );
	} );
	it( 'should close form if user clicked Close button', () => {
		const wrapper = shallow( <UrlInputButton /> );
		wrapper.setState( { expanded: true } );
		expect( wrapper.state().expanded ).toBeTruthy();
		wrapper.find( '.blocks-url-input__back' ).simulate( 'click' );
		expect( wrapper.state().expanded ).toBeFalsy();
	} );
	it( 'should close form if user submit the form', () => {
		const wrapper = mount( <UrlInputButton /> );
		wrapper.setState( { expanded: true } );
		expect( wrapper.state().expanded ).toBeTruthy();
		wrapper.find( 'form' ).simulate( 'submit' );
		expect( wrapper.state().expanded ).toBeFalsy();
		wrapper.unmount();
	} );
} );
