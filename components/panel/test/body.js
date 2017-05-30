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
		it( 'should render an empty div with the matching className', () => {
			const panelBody = shallow( <PanelBody /> );
			expect( panelBody.hasClass( 'components-panel__body' ) ).to.be.true();
			expect( panelBody.type() ).to.equal( 'div' );
		} );

		it( 'should render an IconButton matching the following props and state', () => {
			const panelBody = shallow( <PanelBody title="Some Text" /> );
			const iconButton = panelBody.find( 'IconButton' );
			expect( iconButton.shallow().hasClass( 'components-panel__body-toggle' ) ).to.be.true();
			expect( panelBody.state( 'opened' ) ).to.be.true();
			expect( iconButton.prop( 'onClick' ) ).to.equal( panelBody.instance().toggle );
			expect( iconButton.prop( 'icon' ) ).to.equal( 'arrow-down' );
			expect( iconButton.prop( 'children' ) ).to.equal( 'Some Text' );
		} );

		it( 'should change state and props when sidebar is closed', () => {
			const panelBody = shallow( <PanelBody title="Some Text" initialOpen={ false } /> );
			expect( panelBody.state( 'opened' ) ).to.be.false();
			const iconButton = panelBody.find( 'IconButton' );
			expect( iconButton.prop( 'icon' ) ).to.equal( 'arrow-right' );
		} );

		it( 'should render child elements within PanelBody element', () => {
			const panelBody = shallow( <PanelBody children="Some Text" /> );
			expect( panelBody.instance().props.children ).to.equal( 'Some Text' );
			expect( panelBody.text() ).to.equal( 'Some Text' );
		} );

		it( 'should pass children prop but not render when sidebar is closed', () => {
			const panelBody = shallow( <PanelBody children="Some Text" initialOpen={ false } /> );
			expect( panelBody.instance().props.children ).to.equal( 'Some Text' );
			// Text should be empty even though props.children is set.
			expect( panelBody.text() ).to.equal( '' );
		} );
	} );

	describe( 'mounting behavior', () => {
		it( 'should mount with a default of being opened', () => {
			const panelBody = mount( <PanelBody /> );
			expect( panelBody.state( 'opened' ) ).to.be.true();
		} );

		it( 'should mount with a state of not opened when initialOpen set to false', () => {
			const panelBody = mount( <PanelBody initialOpen={ false } /> );
			expect( panelBody.state( 'opened' ) ).to.be.false();
		} );
	} );

	describe( 'toggling behavior', () => {
		const fakeEvent = { preventDefault: () => undefined };

		it( 'should set the opened state to false when a toggle fires', () => {
			const panelBody = mount( <PanelBody /> );
			panelBody.instance().toggle( fakeEvent );
			expect( panelBody.state( 'opened' ) ).to.be.false();
		} );

		it( 'should set the opened state to true when a toggle fires on a closed state', () => {
			const panelBody = mount( <PanelBody initialOpen={ false } /> );
			panelBody.instance().toggle( fakeEvent );
			expect( panelBody.state( 'opened' ) ).to.be.true();
		} );
	} );
} );
