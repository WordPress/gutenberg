/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import Dropdown from '../';

describe( 'Dropdown', () => {
	const expectPopoverOpened = ( wrapper, opened ) => expect( wrapper.find( 'Popover' ) ).toHaveProp( 'isOpen', opened );

	it( 'should toggle the dropdown properly', () => {
		const expectButtonExpanded = ( wrapper, expanded ) => {
			expect( wrapper.find( 'button' ) ).toHaveLength( 1 );
			expect( wrapper.find( 'button' ) ).toHaveProp( 'aria-expanded', expanded );
		};
		const wrapper = mount( <Dropdown
			className="container"
			contentClassName="content"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<button aria-expanded={ isOpen } onClick={ onToggle }>Toggleee</button>
			) }
			renderContent={ () => null }
		/> );

		expectButtonExpanded( wrapper, false );
		expectPopoverOpened( wrapper, false );

		wrapper.find( 'button' ).simulate( 'click' );
		wrapper.update();

		expectButtonExpanded( wrapper, true );
		expectPopoverOpened( wrapper, true );
	} );

	it( 'should close the dropdown when calling onClose', () => {
		const wrapper = mount( <Dropdown
			className="container"
			contentClassName="content"
			renderToggle={ ( { isOpen, onToggle, onClose } ) => [
				<button key="open" className="open" aria-expanded={ isOpen } onClick={ onToggle }>Toggleee</button>,
				<button key="close" className="close" onClick={ onClose } >closee</button>,
			] }
			renderContent={ () => null }
		/> );

		expectPopoverOpened( wrapper, false );

		wrapper.find( '.open' ).simulate( 'click' );
		wrapper.update();

		expectPopoverOpened( wrapper, true );

		wrapper.find( '.close' ).simulate( 'click' );
		wrapper.update();

		expectPopoverOpened( wrapper, false );
	} );
} );
