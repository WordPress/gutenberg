/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import Dropdown from '../';

describe( 'Dropdown', () => {
	it( 'should toggle the dropdown properly', () => {
		const wrapper = mount( <Dropdown
			className="container"
			contentClassName="content"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<button aria-expanded={ isOpen } onClick={ onToggle }>Toggleee</button>
			) }
			renderContent={ () => 'content' }
		/> );

		const button = wrapper.find( 'button' );
		const popover = wrapper.find( 'Popover' );

		expect( button ).toHaveLength( 1 );
		expect( popover.prop( 'isOpen' ) ).toBe( false );
		expect( button.prop( 'aria-expanded' ) ).toBe( false );
		button.simulate( 'click' );
		expect( popover.prop( 'isOpen' ) ).toBe( true );
		expect( button.prop( 'aria-expanded' ) ).toBe( true );
	} );

	it( 'should close the dropdown when calling onClose', () => {
		const wrapper = mount( <Dropdown
			className="container"
			contentClassName="content"
			renderToggle={ ( { isOpen, onToggle, onClose } ) => [
				<button key="open" className="open" aria-expanded={ isOpen } onClick={ onToggle }>Toggleee</button>,
				<button key="close" className="close" onClick={ onClose } >closee</button>,
			] }
			renderContent={ () => 'content' }
		/> );

		const openButton = wrapper.find( '.open' );
		const closeButton = wrapper.find( '.close' );
		const popover = wrapper.find( 'Popover' );
		expect( popover.prop( 'isOpen' ) ).toBe( false );
		openButton.simulate( 'click' );
		expect( popover.prop( 'isOpen' ) ).toBe( true );
		closeButton.simulate( 'click' );
		expect( popover.prop( 'isOpen' ) ).toBe( false );
	} );
} );
