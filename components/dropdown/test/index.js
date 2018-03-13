/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * WordPress dependencies
 */
import { keycodes, focus } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import Dropdown from '../';

jest.mock( '@wordpress/utils', () => {
	const utils = require.requireActual( '@wordpress/utils' );
	return {
		...utils,
		focus: {
			tabbable: {
				find: jest.fn().mockReturnValue( [] ),
			},
		},
	};
} );

describe( 'Dropdown', () => {
	const expectPopoverVisible = ( wrapper, visible ) => expect( wrapper.find( 'Popover' ) ).toHaveLength( visible ? 1 : 0 );

	it( 'should toggle the dropdown properly', () => {
		const expectButtonExpanded = ( wrapper, expanded ) => {
			expect( wrapper.find( 'button' ) ).toHaveLength( 1 );
			expect( wrapper.find( 'button' ) ).toHaveProp( 'aria-expanded', expanded );
		};
		const wrapper = mount( <Dropdown
			className="container"
			contentClassName="content"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<button aria-expanded={ isOpen } onClick={ () => onToggle() }>Toggle</button>
			) }
			renderContent={ () => null }
		/> );

		expectButtonExpanded( wrapper, false );
		expectPopoverVisible( wrapper, false );

		wrapper.find( 'button' ).simulate( 'click' );
		wrapper.update();

		expectButtonExpanded( wrapper, true );
		expectPopoverVisible( wrapper, true );
	} );

	it( 'should close the dropdown when calling onClose', () => {
		const wrapper = mount( <Dropdown
			className="container"
			contentClassName="content"
			renderToggle={ ( { isOpen, onToggle, onClose } ) => [
				<button key="open" className="open" aria-expanded={ isOpen } onClick={ () => onToggle() }>Toggle</button>,
				<button key="close" className="close" onClick={ onClose } >closee</button>,
			] }
			renderContent={ () => null }
		/> );

		expectPopoverVisible( wrapper, false );

		wrapper.find( '.open' ).simulate( 'click' );
		wrapper.update();

		expectPopoverVisible( wrapper, true );

		wrapper.find( '.close' ).simulate( 'click' );
		wrapper.update();

		expectPopoverVisible( wrapper, false );
	} );

	it( 'should open to first tabbable on keydown', () => {
		focus.tabbable.find.mockImplementation( ( content ) => {
			return [ content.querySelector( 'input' ) ];
		} );

		const wrapper = mount(
			<Dropdown
				renderToggle={ () => <button /> }
				renderContent={ () => <input type="button" /> }
			/>
		);

		wrapper.find( 'button' ).simulate( 'keydown', {
			keyCode: keycodes.DOWN,
		} );

		expectPopoverVisible( wrapper, true );
		expect( document.activeElement.nodeName ).toBe( 'INPUT' );
	} );
} );
