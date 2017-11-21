/**
 * External dependencies
 */
import { shallow, mount } from 'enzyme';

/**
 * Internal dependencies
 */
import UrlInputButton from '../button';

describe( 'UrlInputButton', () => {
	const startEditing = ( wrapper ) => wrapper.find( 'IconButton.components-toolbar__control' ).simulate( 'click' );
	it( 'should has valid class in wrapper tag', () => {
		const wrapper = shallow( <UrlInputButton /> );
		expect( wrapper.hasClass( 'blocks-url-input__button' ) ).toBe( true );
	} );
	it( 'should not have is-active class if url prop not defined', () => {
		const wrapper = shallow( <UrlInputButton /> );
		expect( wrapper.find( 'IconButton' ).hasClass( 'is-active' ) ).toBe( false );
	} );
	it( 'should have is-active class if url prop defined', () => {
		const wrapper = shallow( <UrlInputButton url="https://example.com" /> );
		expect( wrapper.find( 'IconButton' ).hasClass( 'is-active' ) ).toBe( true );
	} );
	it( 'should hidden form for default', () => {
		const wrapper = shallow( <UrlInputButton /> );
		expect( wrapper.find( 'form' ).length ).toBe( 0 );
		expect( wrapper.state().expanded ).toBe( false );
	} );
	it( 'should visible form if Edit Link button clicked', () => {
		const wrapper = shallow( <UrlInputButton /> );
		startEditing( wrapper );
		expect( wrapper.find( 'form' ).length ).toBe( 1 );
		expect( wrapper.state().expanded ).toBe( true );
	} );
	it( 'should call onChange function at once if value changes at once', () => {
		const onChangeMock = jest.fn();
		const wrapper = shallow( <UrlInputButton onChange={ onChangeMock } /> );
		wrapper.setState( { expanded: true } );
		wrapper.find( '[data-test=\'UrlInput\']' ).simulate( 'change' );
		expect( onChangeMock ).toHaveBeenCalledTimes( 1 );
	} );
	it( 'should call onChange function at twice if value changes at twice', () => {
		const onChangeMock = jest.fn();
		const wrapper = shallow( <UrlInputButton onChange={ onChangeMock } /> );
		wrapper.setState( { expanded: true } );
		wrapper.find( '[data-test=\'UrlInput\']' ).simulate( 'change' );
		wrapper.find( '[data-test=\'UrlInput\']' ).simulate( 'change' );
		expect( onChangeMock ).toHaveBeenCalledTimes( 2 );
	} );
	it( 'should close form if user clicked Close button', () => {
		const wrapper = shallow( <UrlInputButton /> );
		wrapper.setState( { expanded: true } );
		expect( wrapper.state().expanded ).toBe( true );
		wrapper.find( '.blocks-url-input__back' ).simulate( 'click' );
		expect( wrapper.state().expanded ).toBe( false );
	} );
	it( 'should close form if user submit the form', () => {
		const wrapper = mount( <UrlInputButton /> );
		wrapper.setState( { expanded: true } );
		expect( wrapper.state().expanded ).toBe( true );
		wrapper.find( 'form' ).simulate( 'submit' );
		expect( wrapper.state().expanded ).toBe( false );
		wrapper.unmount();
	} );
} );
