/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import TestUtils from 'react-dom/test-utils';

/**
 * WordPress dependencies
 */
import { DOWN } from '@wordpress/keycodes';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DropdownMenu from '../';

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

		it( 'should open menu on arrow down', () => {
			// needed because TestUtils.renderIntoDocument returns null for stateless
			// components
			class Menu extends Component {
				render() {
					return <DropdownMenu { ...this.props } />;
				}
			}
			const wrapper = TestUtils.renderIntoDocument( <Menu controls={ controls } /> );
			const buttonElement = TestUtils.findRenderedDOMComponentWithClass(
				wrapper,
				'components-dropdown-menu__toggle'
			);
			// Close menu by keyup
			TestUtils.Simulate.keyDown(
				buttonElement,
				{
					stopPropagation: () => {},
					preventDefault: () => {},
					keyCode: DOWN,
				}
			);

			expect( TestUtils.scryRenderedDOMComponentsWithClass( wrapper, 'components-popover' ) ).toHaveLength( 1 );
		} );
	} );
} );
