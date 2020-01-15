/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import Toolbar from '../';
import ToolbarButton from '../../toolbar-button';

describe( 'Toolbar', () => {
	describe( 'basic rendering', () => {
		it( 'should render a toolbar with toolbar buttons', () => {
			const wrapper = mount(
				<Toolbar __experimentalAccessibilityLabel="blocks">
					<ToolbarButton label="control1" />
					<ToolbarButton label="control2" />
				</Toolbar>
			);
			const control1 = wrapper.find( 'button[aria-label="control1"]' );
			const control2 = wrapper.find( 'button[aria-label="control1"]' );
			expect( control1 ).toHaveLength( 1 );
			expect( control2 ).toHaveLength( 1 );
		} );
	} );

	describe( 'ToolbarGroup', () => {
		it( 'should render an empty node, when controls are not passed', () => {
			const wrapper = mount( <Toolbar /> );
			expect( wrapper.html() ).toBeNull();
		} );

		it( 'should render an empty node, when controls are empty', () => {
			const wrapper = mount( <Toolbar controls={ [] } /> );
			expect( wrapper.html() ).toBeNull();
		} );

		it( 'should render a list of controls with buttons', () => {
			const clickHandler = ( event ) => event;
			const controls = [
				{
					icon: 'wordpress',
					title: 'WordPress',
					subscript: 'wp',
					onClick: clickHandler,
					isActive: false,
				},
			];
			const wrapper = mount( <Toolbar controls={ controls } /> );
			const button = wrapper.find( '[aria-label="WordPress"]' ).hostNodes();
			expect( button.props() ).toMatchObject( {
				'aria-label': 'WordPress',
				'aria-pressed': false,
				'data-subscript': 'wp',
				type: 'button',
			} );
		} );
	} );
} );
