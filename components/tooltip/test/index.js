/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import Tooltip from '../';

describe( 'Tooltip', () => {
	describe( '#render()', () => {
		// Disable reason: The Tooltip component leverages array return values
		// from render, which is not available until React 16.x
		//
		// TODO: When on React 16.x, unskip test
		//
		// eslint-disable-next-line jest/no-disabled-tests
		it.skip( 'should render children (abort) if multiple children passed', () => {
			const wrapper = shallow(
				<Tooltip><div /><div /></Tooltip>
			);

			expect( wrapper.children() ).toHaveLength( 2 );
		} );

		it( 'should render children with additional popover', () => {
			const wrapper = shallow(
				<Tooltip position="bottom right" text="Help Text">
					<button>Hover Me!</button>
				</Tooltip>
			);

			const button = wrapper.find( 'button' );
			const popover = wrapper.find( 'Popover' );
			expect( wrapper.type() ).toBe( 'button' );
			expect( button.children() ).toHaveLength( 2 );
			expect( button.childAt( 0 ).text() ).toBe( 'Hover Me!' );
			expect( button.childAt( 1 ).name() ).toBe( 'Popover' );
			expect( popover.prop( 'isOpen' ) ).toBe( false );
			expect( popover.prop( 'position' ) ).toBe( 'bottom right' );
			expect( popover.children().text() ).toBe( 'Help Text' );
		} );

		it( 'should show popover on mouse over', () => {
			const originalMouseOver = jest.fn();
			const event = { type: 'mouseover' };
			const wrapper = shallow(
				<Tooltip text="Help Text">
					<button
						onMouseOver={ originalMouseOver }
						onFocus={ originalMouseOver }
					>
						Hover Me!
					</button>
				</Tooltip>
			);

			const button = wrapper.find( 'button' );
			button.simulate( 'mouseover', event );

			const popover = wrapper.find( 'Popover' );
			expect( originalMouseOver ).toHaveBeenCalledWith( event );
			expect( wrapper.state( 'isOver' ) ).toBe( true );
			expect( popover.prop( 'isOpen' ) ).toBe( true );
		} );
	} );
} );
