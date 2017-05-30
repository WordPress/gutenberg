/**
 * External dependencies
 */
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import Toolbar from '../';

describe( 'Toolbar', () => {
	describe( 'basic rendering', () => {
		it( 'should render an empty node controls are not passed', () => {
			const toolbar = shallow( <Toolbar /> );
			expect( toolbar.type() ).to.be.null();
		} );

		it( 'should render an empty node controls are empty', () => {
			const toolbar = shallow( <Toolbar controls={ [] } /> );
			expect( toolbar.type() ).to.be.null();
		} );

		it( 'should render a list of controls with IconButtons', () => {
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
			const listItem = toolbar.find( 'IconButton' );
			expect( toolbar.type() ).to.equal( 'ul' );
			expect( listItem.props().icon ).to.equal( 'wordpress' );
			expect( listItem.props().label ).to.equal( 'WordPress' );
			expect( listItem.props()[ 'data-subscript' ] ).to.equal( 'wp' );
			expect( listItem.props()[ 'aria-pressed' ] ).to.equal( false );
			expect( listItem.props().className ).to.equal( 'components-toolbar__control' );
		} );

		it( 'should render a list of controls with IconButtons and active control', () => {
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
			const listItem = toolbar.find( 'IconButton' );
			expect( listItem.props()[ 'aria-pressed' ] ).to.equal( true );
			expect( listItem.props().className ).to.equal( 'components-toolbar__control is-active' );
		} );

		it( 'should call the clickHandler on click.', () => {
			let clicked = false;
			const clickHandler = ( event ) => {
				clicked = true;
				return event;
			};
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
			const listItem = toolbar.find( 'IconButton' );
			listItem.simulate( 'click', { stopPropagation: () => undefined } );
			expect( clicked ).to.be.true();
		} );
	} );
} );
