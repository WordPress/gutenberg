/**
 * External dependencies
 */
import { shallow, mount } from 'enzyme';

/**
 * Internal dependencies
 */
import { PanelBody } from '../body';

function getToggleButton( container ) {
	return container.find( '.components-panel__body-toggle' ).first();
}

function clickToggle( container ) {
	getToggleButton( container ).simulate( 'click' );
}

function getOpened( container ) {
	return getToggleButton( container ).prop( 'aria-expanded' );
}

describe( 'PanelBody', () => {
	describe( 'basic rendering', () => {
		it( 'should render an empty div with the matching className', () => {
			const panelBody = shallow( <PanelBody /> );
			expect( panelBody.hasClass( 'components-panel__body' ) ).toBe(
				true
			);
			expect( panelBody.type() ).toBe( 'div' );
		} );

		it( 'should render an Button matching the following props and state', () => {
			const panelBody = shallow( <PanelBody title="Some Text" /> );
			const button = panelBody.find( '.components-panel__body-toggle' );
			expect( panelBody.hasClass( 'is-opened' ) ).toBe( true );
			expect( getOpened( panelBody ) ).toBe( true );
			expect( button.childAt( 0 ).name() ).toBe( 'span' );
			expect( button.childAt( 0 ).childAt( 0 ).name() ).toBe( 'Icon' );
			expect( button.childAt( 1 ).text() ).toBe( 'Some Text' );
		} );

		it( 'should change state and class when sidebar is closed', () => {
			const panelBody = shallow(
				<PanelBody title="Some Text" initialOpen={ false } />
			);
			expect( panelBody.hasClass( 'is-opened' ) ).toBe( false );
		} );

		it( 'should use the "opened" prop instead of state if provided', () => {
			const panelBody = shallow(
				<PanelBody
					title="Some Text"
					opened={ true }
					initialOpen={ false }
				/>
			);
			expect( panelBody.hasClass( 'is-opened' ) ).toBe( true );
		} );

		it( 'should render child elements within PanelBody element', () => {
			const panelBody = mount( <PanelBody children="Some Text" /> );
			expect( panelBody.prop( 'children' ) ).toBe( 'Some Text' );
			expect( panelBody.text() ).toBe( 'Some Text' );
		} );

		it( 'should pass children prop but not render when sidebar is closed', () => {
			const panelBody = mount(
				<PanelBody children="Some Text" initialOpen={ false } />
			);
			expect( panelBody.prop( 'children' ) ).toBe( 'Some Text' );
			// Text should be empty even though props.children is set.
			expect( panelBody.text() ).toBe( '' );
		} );
	} );

	describe( 'mounting behavior', () => {
		it( 'should mount with a default of being opened', () => {
			const panelBody = mount( <PanelBody title="Some Text" /> );
			expect( getOpened( panelBody ) ).toBe( true );
		} );

		it( 'should mount with a state of not opened when initialOpen set to false', () => {
			const panelBody = mount(
				<PanelBody title="Some Text" initialOpen={ false } />
			);
			expect( getOpened( panelBody ) ).toBe( false );
		} );
	} );

	describe( 'toggling behavior', () => {
		it( 'should set the opened state to false when a toggle fires', () => {
			const panelBody = mount( <PanelBody title="Some Text" /> );

			clickToggle( panelBody );
			expect( getOpened( panelBody ) ).toBe( false );
		} );

		it( 'should set the opened state to true when a toggle fires on a closed state', () => {
			const panelBody = mount(
				<PanelBody title="Some Text" initialOpen={ false } />
			);

			clickToggle( panelBody );
			expect( getOpened( panelBody ) ).toBe( true );
		} );
	} );
} );
