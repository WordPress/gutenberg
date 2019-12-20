/**
 * External dependencies
 */
import { shallow, mount } from 'enzyme';

/**
 * WordPress dependencies
 */
import { DOWN } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import DropdownMenu from '../';
import { IconButton, MenuItem, NavigableMenu } from '../../';

describe( 'DropdownMenu', () => {
	const children = ( { onClose } ) => <MenuItem onClick={ onClose } />;

	let controls;
	beforeEach( () => {
		controls = [
			{
				title: 'Up',
				icon: 'arrow-up-alt',
				onClick: jest.fn(),
			},
			{
				title: 'Right',
				icon: 'arrow-right-alt',
				onClick: jest.fn(),
			},
			{
				title: 'Down',
				icon: 'arrow-down-alt',
				onClick: jest.fn(),
			},
			{
				title: 'Left',
				icon: 'arrow-left-alt',
				onClick: jest.fn(),
			},
		];
	} );

	describe( 'basic rendering', () => {
		it( 'should render a null element when neither controls nor children are assigned', () => {
			const wrapper = shallow( <DropdownMenu /> );

			expect( wrapper.type() ).toBeNull();
		} );

		it( 'should render a null element when controls are empty and children is not specified', () => {
			const wrapper = shallow( <DropdownMenu controls={ [] } /> );

			expect( wrapper.type() ).toBeNull();
		} );

		it( 'should open menu on arrow down (controls)', () => {
			const wrapper = mount( <DropdownMenu controls={ controls } /> );
			const button = wrapper.find( IconButton ).filter( '.components-dropdown-menu__toggle' );

			button.simulate( 'keydown', {
				stopPropagation: () => {},
				preventDefault: () => {},
				keyCode: DOWN,
			} );

			expect( wrapper.find( NavigableMenu ) ).toHaveLength( 1 );
			expect( wrapper.find( IconButton ).filter( '.components-dropdown-menu__menu-item' ) ).toHaveLength( controls.length );
		} );

		it( 'should open menu on arrow down (children)', () => {
			const wrapper = mount( <DropdownMenu children={ children } /> );
			const button = wrapper.find( IconButton ).filter( '.components-dropdown-menu__toggle' );

			button.simulate( 'keydown', {
				stopPropagation: () => {},
				preventDefault: () => {},
				keyCode: DOWN,
			} );

			expect( wrapper.find( NavigableMenu ) ).toHaveLength( 1 );

			wrapper.find( MenuItem ).props().onClick();
			wrapper.update();

			expect( wrapper.find( NavigableMenu ) ).toHaveLength( 0 );
		} );
	} );
} );
