/**
 * External dependencies
 */
import { shallow, mount } from 'enzyme';

/**
 * WordPress dependencies
 */
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import { DropdownMenu } from '../';

const { TAB, ESCAPE, LEFT, UP, RIGHT, DOWN } = keycodes;

describe( 'DropdownMenu', () => {
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
		it( 'should render a null element when controls are not assigned', () => {
			const wrapper = shallow( <DropdownMenu /> );

			expect( wrapper.type() ).toBeNull();
		} );

		it( 'should render a null element when controls are empty', () => {
			const wrapper = shallow( <DropdownMenu controls={ [] } /> );

			expect( wrapper.type() ).toBeNull();
		} );

		it( 'should render a collapsed menu button', () => {
			const wrapper = shallow(
				<DropdownMenu
					label="Select a direction"
					controls={ controls }
				/>
			);

			expect( wrapper.state( 'open' ) ).toBe( false );
			expect( wrapper.state( 'activeIndex' ) ).toBeNull();
			expect( wrapper.find( '> IconButton' ).prop( 'label' ) ).toBe( 'Select a direction' );
			expect( wrapper.find( '> IconButton' ).prop( 'icon' ) ).toBe( 'menu' );
			expect( wrapper.find( '.components-dropdown-menu__menu' ) ).toHaveLength( 0 );
		} );

		it( 'should render an expanded menu upon click', () => {
			const wrapper = shallow( <DropdownMenu controls={ controls } /> );

			// Open menu
			wrapper.find( '> IconButton' ).simulate( 'click' );

			const options = wrapper.find( '.components-dropdown-menu__menu > IconButton' );
			expect( wrapper.state( 'open' ) ).toBe( true );
			expect( wrapper.state( 'activeIndex' ) ).toBe( 0 );
			expect( options ).toHaveLength( controls.length );
			expect( options.at( 0 ).prop( 'icon' ) ).toBe( 'arrow-up-alt' );
			expect( options.at( 0 ).children().text() ).toBe( 'Up' );
		} );

		it( 'should open menu on arrow down', () => {
			const wrapper = shallow( <DropdownMenu controls={ controls } /> );

			// Close menu by keyup
			wrapper.simulate( 'keydown', {
				stopPropagation: () => {},
				preventDefault: () => {},
				keyCode: DOWN,
			} );

			expect( wrapper.state( 'open' ) ).toBe( true );
		} );

		it( 'should call the control onClick callback and close menu', () => {
			const wrapper = shallow( <DropdownMenu controls={ controls } /> );

			// Open menu
			wrapper.find( '> IconButton' ).simulate( 'click' );

			// Select option
			const options = wrapper.find( '.components-dropdown-menu__menu > IconButton' );
			options.at( 0 ).simulate( 'click', { stopPropagation: () => {} } );

			expect( controls[ 0 ].onClick ).toHaveBeenCalled();
			expect( wrapper.state( 'open' ) ).toBe( false );
		} );

		it( 'should navigate by keypresses', () => {
			const wrapper = shallow( <DropdownMenu controls={ controls } /> );

			// Open menu
			wrapper.find( '> IconButton' ).simulate( 'click' );

			// Navigate options
			function assertKeyDown( keyCode, expectedActiveIndex ) {
				wrapper.simulate( 'keydown', {
					stopPropagation: () => {},
					preventDefault: () => {},
					keyCode,
				} );

				const activeIndex = wrapper.state( 'activeIndex' );
				expect( activeIndex ).toBe( expectedActiveIndex );
			}

			assertKeyDown( RIGHT, 1 );
			assertKeyDown( DOWN, 2 );
			assertKeyDown( DOWN, 3 );
			assertKeyDown( DOWN, 0 ); // Reset to beginning
			assertKeyDown( DOWN, 1 );
			assertKeyDown( LEFT, 0 );
			assertKeyDown( UP, 3 ); // Reset to end
		} );

		it( 'should close menu on escape', () => {
			// Mount: We need to access DOM node of rendered menu IconButton
			const wrapper = mount( <DropdownMenu controls={ controls } /> );

			// Open menu
			wrapper.find( '> IconButton' ).simulate( 'click' );

			// Close menu by escape
			wrapper.simulate( 'keydown', {
				stopPropagation: () => {},
				preventDefault: () => {},
				keyCode: ESCAPE,
			} );

			expect( wrapper.state( 'open' ) ).toBe( false );
		} );

		it( 'should close menu on click outside', () => {
			const wrapper = shallow( <DropdownMenu controls={ controls } /> );

			// Open menu
			wrapper.find( '> IconButton' ).simulate( 'click' );

			// Close menu by click outside
			wrapper.instance().handleClickOutside();

			expect( wrapper.state( 'open' ) ).toBe( false );
		} );

		it( 'should close menu on tab', () => {
			const wrapper = shallow( <DropdownMenu controls={ controls } /> );

			// Open menu
			wrapper.find( '> IconButton' ).simulate( 'click' );

			// Close menu by tab
			wrapper.simulate( 'keydown', {
				stopPropagation: () => {},
				preventDefault: () => {},
				keyCode: TAB,
			} );

			expect( wrapper.state( 'open' ) ).toBe( false );
		} );
	} );
} );
