/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import InlineHelpPopover from '../';

describe( 'InlineHelpPopover', () => {
	const originalDocumentAddEventListener = document.addEventListener;
	let eventMap = {};

	beforeEach( () => {
		document.addEventListener = jest.fn( ( event, cb ) => {
			eventMap[ event ] = cb;
		} );
	} );

	afterEach( () => {
		document.addEventListener = originalDocumentAddEventListener;
		eventMap = {};
	} );

	it( 'should render a Button with text', () => {
		const inlineHelp = mount(
			<InlineHelpPopover
				className="test-inline-help-popover"
				buttonText="Test inline help"
			/>
		);

		expect( inlineHelp.hasClass( 'inline-help-popover' ) ).toBe( true );
		expect( inlineHelp.hasClass( 'test-inline-help-popover' ) ).toBe( true );

		const button = inlineHelp.find( 'Button' );
		expect( button.length ).toBe( 1 ); // This fails with `shallow`
		expect( button.at( 0 ).text() ).toBe( 'Test inline help' );

		expect( inlineHelp.find( 'Popover' ).length ).toBe( 0 );
	} );

	it( 'should toggle the Popover when clicking the Button', () => {
		const inlineHelp = mount(
			<InlineHelpPopover
				popoverPosition="top left"
				popoverClassName="test-inline-help-popover__popover"
			>
				Test popover text
			</InlineHelpPopover>
		);

		const button = inlineHelp.find( 'Button' );
		button.simulate( 'click' );

		const popover = inlineHelp.find( 'Popover' );
		expect( popover.length ).toBe( 1 );

		expect( popover.prop( 'position' ) ).toBe( 'top left' );
		expect( popover.find( '.components-popover__content' ).text() ).toBe(
			'Test popover text'
		);

		button.simulate( 'click' );
		expect( inlineHelp.find( 'Popover' ).length ).toBe( 0 );
	} );

	it( 'should hide the Popover when clicking outside the component', () => {
		const inlineHelp = mount(
			<InlineHelpPopover />
		);

		const button = inlineHelp.find( 'Button' );
		button.simulate( 'click' );

		expect( inlineHelp.find( 'Popover' ).length ).toBe( 1 );

		eventMap.click( { target: document.body } );
		expect( inlineHelp.find( 'Popover' ).length ).toBe( 0 );
	} );
} );
