/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import Toolbar from '../';

describe( 'Toolbar', () => {
	describe( 'basic rendering', () => {
		it( 'should render an empty node, when controls are not passed', () => {
			const toolbar = shallow( <Toolbar /> );
			expect( toolbar.type() ).toBeNull();
		} );

		it( 'should render an empty node, when controls are empty', () => {
			const toolbar = shallow( <Toolbar controls={ [] } /> );
			expect( toolbar.type() ).toBeNull();
		} );

		it( 'should render a list of controls with ToolbarButtons', () => {
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
			const toolbar = shallow( <Toolbar controls={ controls } /> );
			const listItem = toolbar.find( 'ToolbarButton' );
			expect( listItem.props() ).toMatchObject( {
				containerClassName: null,
				icon: 'wordpress',
				title: 'WordPress',
				subscript: 'wp',
				onClick: clickHandler,
				isActive: false,
			} );
		} );

		it( 'should render a list of controls with ToolbarButtons and active control', () => {
			const clickHandler = ( event ) => event;
			const controls = [
				{
					icon: 'wordpress',
					title: 'WordPress',
					subscript: 'wp',
					onClick: clickHandler,
					isActive: true,
				},
			];
			const toolbar = shallow( <Toolbar controls={ controls } /> );
			const listItem = toolbar.find( 'ToolbarButton' );
			expect( listItem.props() ).toMatchObject( {
				containerClassName: null,
				icon: 'wordpress',
				title: 'WordPress',
				subscript: 'wp',
				onClick: clickHandler,
				isActive: true,
			} );
		} );

		it( 'should render a nested list of controls with separator between', () => {
			const controls = [
				[ // First set
					{
						icon: 'wordpress',
						title: 'WordPress',
					},
				],
				[ // Second set
					{
						icon: 'wordpress',
						title: 'WordPress',
					},
				],
			];

			const toolbar = shallow( <Toolbar controls={ controls } /> );
			expect( toolbar.children() ).toHaveLength( 2 );
			expect( toolbar.childAt( 0 ).prop( 'containerClassName' ) ).toBeNull();
			expect( toolbar.childAt( 1 ).prop( 'containerClassName' ) ).toBe( 'has-left-divider' );
		} );

		it( 'should call the clickHandler on click.', () => {
			const clickHandler = jest.fn();
			const event = { stopPropagation: () => undefined };
			const controls = [
				{
					icon: 'wordpress',
					title: 'WordPress',
					subscript: 'wp',
					onClick: clickHandler,
					isActive: true,
				},
			];
			const toolbar = shallow( <Toolbar controls={ controls } /> );
			const listItem = toolbar.find( 'ToolbarButton' );
			listItem.simulate( 'click', event );
			expect( clickHandler ).toHaveBeenCalledTimes( 1 );
			expect( clickHandler ).toHaveBeenCalledWith( event );
		} );
	} );
} );
