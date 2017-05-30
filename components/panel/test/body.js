/**
 * External dependencies
 */
import { expect } from 'chai';
import { shallow, mount } from 'enzyme';

/**
 * Internal dependencies
 */
import PanelBody from '../body.js';

describe( 'PanelBody', () => {
	describe( 'basic rendering', () => {
		it( 'without modifiers', () => {
			const panelBody = shallow( <PanelBody /> );
			expect( panelBody.hasClass( 'components-panel__body' ) ).to.be.true();
			expect( panelBody.type() ).to.equal( 'div' );
			expect( panelBody.find( 'div' ).shallow().children().length ).to.equal( 0 );
		} );

		it( 'with title', () => {
			const panelBody = shallow( <PanelBody title="Some Text" /> );
			const panelBodyInstance = panelBody.instance();
			const iconButton = panelBody.find( 'IconButton' );
			expect( iconButton.shallow().hasClass( 'components-panel__body-toggle' ) ).to.be.true();
			expect( panelBodyInstance.state.opened ).to.be.true();
			expect( iconButton.node.props.onClick ).to.equal( panelBodyInstance.toggle );
			expect( iconButton.node.props.icon ).to.equal( 'arrow-down' );
			expect( iconButton.node.props.children ).to.equal( 'Some Text' );
		} );

		it( 'with title and sidebar closed', () => {
			const panelBody = shallow( <PanelBody title="Some Text" initialOpen={ false } /> );
			expect( panelBody.instance().state.opened ).to.be.false();
			const iconButton = panelBody.find( 'IconButton' );
			expect( iconButton.node.props.icon ).to.equal( 'arrow-right' );
		} );

		it( 'with children', () => {
			const panelBody = shallow( <PanelBody children="Some Text" /> );
			expect( panelBody.instance().props.children ).to.equal( 'Some Text' );
			expect( panelBody.text() ).to.equal( 'Some Text' );
		} );

		it( 'with children and sidebar closed', () => {
			const panelBody = shallow( <PanelBody children="Some Text" initialOpen={ false } /> );
			expect( panelBody.instance().props.children ).to.equal( 'Some Text' );
			// Text should be empty even though props.children is set.
			expect( panelBody.text() ).to.equal( '' );
		} );
	} );

	describe( 'mounting behavior', () => {
		it( 'without modifiers', () => {
			const panelBody = mount( <PanelBody /> );
			expect( panelBody.instance().state.opened ).to.be.true();
		} );

		it( 'with intialOpen set to false', () => {
			const panelBody = mount( <PanelBody initialOpen={ false } /> );
			expect( panelBody.instance().state.opened ).to.be.false();
		} );
	} );

	describe( 'toggling behavior', () => {
		const fakeEvent = { preventDefault: () => undefined };

		it( 'without modifiers', () => {
			const panelBody = mount( <PanelBody /> );
			panelBody.instance().toggle( fakeEvent );
			expect( panelBody.instance().state.opened ).to.be.false();
		} );

		it( 'with intialOpen set to false', () => {
			const panelBody = mount( <PanelBody initialOpen={ false } /> );
			panelBody.instance().toggle( fakeEvent );
			expect( panelBody.instance().state.opened ).to.be.true();
		} );
	} );
} );
