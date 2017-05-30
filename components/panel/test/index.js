/**
 * External dependencies
 */
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import Panel from '../';

describe( 'Panel', () => {
	describe( 'basic rendering', () => {
		it( 'without modifiers', () => {
			const panel = shallow( <Panel /> );
			expect( panel.hasClass( 'components-panel' ) ).to.be.true();
			expect( panel.type() ).to.equal( 'div' );
			expect( panel.find( 'div' ).shallow().children().length ).to.equal( 0 );
		} );

		it( 'with header', () => {
			const panel = shallow( <Panel header="Header Label" /> );
			const panelHeader = panel.find( 'PanelHeader' );
			expect( panelHeader.node.props.label ).to.equal( 'Header Label' );
			expect( panel.find( 'div' ).shallow().children().length ).to.equal( 1 );
		} );

		it( 'with additional class name', () => {
			const panel = shallow( <Panel className="the-panel" /> );
			expect( panel.hasClass( 'the-panel' ) ).to.be.true();
		} );

		it( 'with additional children', () => {
			const panel = shallow( <Panel children="The Panel" /> );
			expect( panel.instance().props.children ).to.equal( 'The Panel' );
			expect( panel.text() ).to.equal( 'The Panel' );
			expect( panel.find( 'div' ).shallow().children().length ).to.equal( 1 );
		} );

		it( 'with children and header', () => {
			const panel = shallow( <Panel children="The Panel" header="The Header" /> );
			expect( panel.find( 'div' ).shallow().children().length ).to.equal( 2 );
		} );
	} );
} );
