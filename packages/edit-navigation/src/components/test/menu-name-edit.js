/**
 * External dependencies
 */
import { shallow } from 'enzyme';
/**
 * WordPress dependencies
 */
import * as mockWpElement from '@wordpress/element';
import * as mockWpData from '@wordpress/data';
/**
 * Internal dependencies
 */
import { NameEditor } from '../name-editor';

describe( 'Menu name editor', () => {
	it( 'can be focused by the outside action', () => {
		jest.spyOn( mockWpElement, 'useContext' ).mockImplementation( () => [
			true,
		] );
		const wrapper = shallow( <NameEditor /> );
		const input = wrapper.find( 'input' );
		expect( input.is( ':focus' ) ).toBe( true );
	} );
	it( 'edits menu entity record on input change', () => {
		const menuName = 'name';
		let updatedName = '';
		jest.spyOn( mockWpData, 'useDispatch' ).mockImplementation( () => ( {
			editEntityRecord: ( x ) => ( updatedName = x ),
		} ) );
		const wrapper = shallow( <NameEditor /> );
		const input = wrapper.find( 'input' );
		input.simulate( 'change', { target: { value: menuName } } );
		expect( updatedName ).toBe( menuName );
	} );
} );
