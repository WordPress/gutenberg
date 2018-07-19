/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import TestUtils from 'react-dom/test-utils';
import ReactDOM from 'react-dom';

/**
 * Internal dependencies
 */
import URLInput from '../';
import URLInputButton from '../button';

describe( 'URLInputButton', () => {
	const clickEditLink = ( wrapper ) => wrapper.find( 'IconButton.components-toolbar__control' ).simulate( 'click' );

	it( 'should have a valid class name in the wrapper tag', () => {
		const wrapper = shallow( <URLInputButton /> );
		expect( wrapper.hasClass( 'editor-url-input__button' ) ).toBe( true );
	} );
	it( 'should not have is-active class when url prop not defined', () => {
		const wrapper = shallow( <URLInputButton /> );
		expect( wrapper.find( 'IconButton' ).hasClass( 'is-active' ) ).toBe( false );
	} );
	it( 'should have is-active class name if url prop defined', () => {
		const wrapper = shallow( <URLInputButton url="https://example.com" /> );
		expect( wrapper.find( 'IconButton' ).hasClass( 'is-active' ) ).toBe( true );
	} );
	it( 'should have hidden form by default', () => {
		const wrapper = shallow( <URLInputButton /> );
		expect( wrapper.find( 'form' ) ).toHaveLength( 0 );
		expect( wrapper.state().expanded ).toBe( false );
	} );
	it( 'should have visible form when Edit Link button clicked', () => {
		const wrapper = shallow( <URLInputButton /> );
		clickEditLink( wrapper );
		expect( wrapper.find( 'form' ) ).toHaveLength( 1 );
		expect( wrapper.state().expanded ).toBe( true );
	} );
	it( 'should call onChange function once when value changes once', () => {
		const onChangeMock = jest.fn();
		const wrapper = shallow( <URLInputButton onChange={ onChangeMock } /> );
		clickEditLink( wrapper );
		wrapper.find( URLInput ).simulate( 'change' );
		expect( onChangeMock ).toHaveBeenCalledTimes( 1 );
	} );
	it( 'should call onChange function twice when value changes twice', () => {
		const onChangeMock = jest.fn();
		const wrapper = shallow( <URLInputButton onChange={ onChangeMock } /> );
		clickEditLink( wrapper );
		wrapper.find( URLInput ).simulate( 'change' );
		wrapper.find( URLInput ).simulate( 'change' );
		expect( onChangeMock ).toHaveBeenCalledTimes( 2 );
	} );
	it( 'should close the form when user clicks Close button', () => {
		const wrapper = shallow( <URLInputButton /> );
		clickEditLink( wrapper );
		expect( wrapper.state().expanded ).toBe( true );
		wrapper.find( '.editor-url-input__back' ).simulate( 'click' );
		expect( wrapper.state().expanded ).toBe( false );
	} );
	it( 'should close the form when user submits it', () => {
		const wrapper = TestUtils.renderIntoDocument( <URLInputButton /> );
		const buttonElement = () => TestUtils.findRenderedDOMComponentWithClass(
			wrapper,
			'components-toolbar__control'
		);
		const formElement = () => TestUtils.findRenderedDOMComponentWithTag(
			wrapper,
			'form'
		);
		TestUtils.Simulate.click( buttonElement() );
		expect( wrapper.state.expanded ).toBe( true );
		TestUtils.Simulate.submit( formElement() );
		expect( wrapper.state.expanded ).toBe( false );
		/* eslint-disable react/no-find-dom-node */
		ReactDOM.unmountComponentAtNode( ReactDOM.findDOMNode( wrapper ).parentNode );
		/* eslint-enable react/no-find-dom-node */
	} );
} );
