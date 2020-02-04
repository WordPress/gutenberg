/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import ToolbarGroup from '../';

describe( 'ToolbarGroup', () => {
	describe( 'basic rendering', () => {
		it( 'should render an empty node, when controls are not passed', () => {
			const wrapper = mount( <ToolbarGroup /> );
			expect( wrapper.html() ).toBeNull();
		} );

		it( 'should render an empty node, when controls are empty', () => {
			const wrapper = mount( <ToolbarGroup controls={ [] } /> );
			expect( wrapper.html() ).toBeNull();
		} );

		it( 'should render a list of controls with buttons', () => {
			const clickHandler = ( event ) => event;
			const controls = [
				{
					icon: 'wordpress',
					title: 'WordPress',
					onClick: clickHandler,
					isActive: false,
				},
			];
			const wrapper = mount( <ToolbarGroup controls={ controls } /> );
			const button = wrapper
				.find( '[aria-label="WordPress"]' )
				.hostNodes();
			expect( button.props() ).toMatchObject( {
				'aria-label': 'WordPress',
				'aria-pressed': false,
				type: 'button',
			} );
		} );

		it( 'should render a list of controls with buttons and active control', () => {
			const clickHandler = ( event ) => event;
			const controls = [
				{
					icon: 'wordpress',
					title: 'WordPress',
					onClick: clickHandler,
					isActive: true,
				},
			];
			const wrapper = mount( <ToolbarGroup controls={ controls } /> );
			const button = wrapper
				.find( '[aria-label="WordPress"]' )
				.hostNodes();
			expect( button.props() ).toMatchObject( {
				'aria-label': 'WordPress',
				'aria-pressed': true,
				type: 'button',
			} );
		} );

		it( 'should render a nested list of controls with separator between', () => {
			const controls = [
				[
					// First set
					{
						icon: 'wordpress',
						title: 'WordPress',
					},
				],
				[
					// Second set
					{
						icon: 'wordpress',
						title: 'WordPress',
					},
				],
			];

			const wrapper = mount( <ToolbarGroup controls={ controls } /> );
			const buttons = wrapper.find( 'button' ).hostNodes();
			const hasLeftDivider = wrapper
				.find( '.has-left-divider' )
				.hostNodes();
			expect( buttons ).toHaveLength( 2 );
			expect( hasLeftDivider ).toHaveLength( 1 );
			expect( hasLeftDivider.html() ).toContain( buttons.at( 1 ).html() );
		} );

		it( 'should call the clickHandler on click.', () => {
			const clickHandler = jest.fn();
			const controls = [
				{
					icon: 'wordpress',
					title: 'WordPress',
					onClick: clickHandler,
					isActive: true,
				},
			];
			const wrapper = mount( <ToolbarGroup controls={ controls } /> );
			const button = wrapper
				.find( '[aria-label="WordPress"]' )
				.hostNodes();
			button.simulate( 'click' );
			expect( clickHandler ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
