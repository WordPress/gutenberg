/**
 * External dependencies
 */
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';

/**
 * Internal dependencies
 */
import Toolbar from '../';

describe( 'Toolbar', () => {
	describe( 'basic rendering', () => {
		it( 'should render an empty node, when controls are not passed', () => {
			const toolbar = shallow( <Toolbar /> );
			expect( toolbar.type() ).to.be.null();
		} );

		it( 'should render an empty node, when controls are empty', () => {
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
			expect( listItem.props() ).to.include( {
				icon: 'wordpress',
				label: 'WordPress',
				'data-subscript': 'wp',
				'aria-pressed': false,
				className: 'components-toolbar__control',
				focus: undefined,
			} );
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
			expect( listItem.props() ).to.include( {
				'aria-pressed': true,
				className: 'components-toolbar__control is-active',
			} );
		} );

		it( 'should render a nested list of controls with separator between', () => {
			const controls = [
				[ {
					icon: 'wordpress',
					title: 'WordPress',
				} ],
				[ {
					icon: 'wordpress',
					title: 'WordPress',
				} ],
			];

			const toolbar = shallow( <Toolbar controls={ controls } /> );
			expect( toolbar.children() ).to.have.lengthOf( 2 );
			expect( toolbar.childAt( 0 ).hasClass( 'has-left-divider' ) ).to.be.false();
			expect( toolbar.childAt( 1 ).hasClass( 'has-left-divider' ) ).to.be.true();
		} );

		it( 'should call the clickHandler on click.', () => {
			const clickHandler = spy();
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
			const listItem = toolbar.find( 'IconButton' );
			listItem.simulate( 'click', event );
			expect( clickHandler ).to.have.been.calledOnce();
			expect( clickHandler ).to.have.been.calledWith();
		} );

		it( 'should have a focus property of true.', () => {
			const controls = [
				{
					icon: 'wordpress',
					title: 'WordPress',
					subscript: 'wp',
					isActive: true,
				},
			];
			const toolbar = shallow( <Toolbar controls={ controls } focus={ true } /> );
			const listItem = toolbar.find( 'IconButton' );
			expect( listItem.prop( 'focus' ) ).to.be.true();
		} );
	} );
} );
