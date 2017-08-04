/**
 * External dependencies
 */
import { mount } from 'enzyme';
import clickOutside from 'react-click-outside';

/**
 * Internal dependencies
 */
import {
	EnableTrackingPrompt,
	TRACKING_PROMPT_NOTICE_ID,
} from '../';

describe( 'EnableTrackingPrompt', () => {
	const originalSetUserSetting = window.setUserSetting;
	const originalDocumentAddEventListener = document.addEventListener;
	let eventMap = {};
	let removeNotice;

	beforeEach( () => {
		window.setUserSetting = jest.fn();
		document.addEventListener = jest.fn( ( event, cb ) => {
			eventMap[ event ] = cb;
		} );
		removeNotice = jest.fn();
	} );

	afterEach( () => {
		window.setUserSetting = originalSetUserSetting;
		document.addEventListener = originalDocumentAddEventListener;
		eventMap = {};
	} );

	it( 'should render a prompt with Yes, No, and More info buttons', () => {
		const prompt = mount(
			<EnableTrackingPrompt />
		);
		const buttons = prompt.find( 'Button' );
		expect( buttons.length ).toBe( 3 );
		expect( buttons.at( 0 ).text() ).toBe( 'Yes' );
		expect( buttons.at( 1 ).text() ).toBe( 'No' );
		expect( buttons.at( 2 ).text() ).toBe( 'More info' );

		expect( window.setUserSetting )
			.not.toHaveBeenCalled();
		expect( removeNotice )
			.not.toHaveBeenCalled();
	} );

	it( 'should enable tracking when clicking Yes', () => {
		const prompt = mount(
			<EnableTrackingPrompt removeNotice={ removeNotice } />
		);
		const buttonYes = prompt.find( 'Button' )
			.filterWhere( node => node.text() === 'Yes' );
		buttonYes.simulate( 'click' );

		expect( window.setUserSetting )
			.toHaveBeenCalledWith( 'gutenberg_tracking', 'on' );
		expect( removeNotice )
			.toHaveBeenCalledWith( TRACKING_PROMPT_NOTICE_ID );
	} );

	it( 'should disable tracking when clicking No', () => {
		const prompt = mount(
			<EnableTrackingPrompt removeNotice={ removeNotice } />
		);
		const buttonNo = prompt.find( 'Button' )
			.filterWhere( node => node.text() === 'No' );
		buttonNo.simulate( 'click' );

		expect( window.setUserSetting )
			.toHaveBeenCalledWith( 'gutenberg_tracking', 'off' );
		expect( removeNotice )
			.toHaveBeenCalledWith( TRACKING_PROMPT_NOTICE_ID );
	} );

	it( 'should show and hide a popover when clicking More info', () => {
		const EnableTrackingPromptWrapped = clickOutside( EnableTrackingPrompt );
		const prompt = mount(
			<EnableTrackingPromptWrapped removeNotice={ removeNotice } />
		);

		expect( prompt.find( 'Popover' ).length ).toBe( 0 );

		const buttonMoreInfo = prompt.find( 'Button' )
			.filterWhere( node => node.text() === 'More info' );

		// Click the "More info" button to show the info popover
		buttonMoreInfo.simulate( 'click' );
		expect( prompt.find( 'Popover' ).length ).toBe( 1 );

		// Click the "More info" button to hide the info popover
		buttonMoreInfo.simulate( 'click' );
		expect( prompt.find( 'Popover' ).length ).toBe( 0 );

		// Click the "More info" button to show the info popover
		buttonMoreInfo.simulate( 'click' );
		expect( prompt.find( 'Popover' ).length ).toBe( 1 );

		// Click inside the prompt to hide the info popover
		prompt.simulate( 'click' );
		expect( prompt.find( 'Popover' ).length ).toBe( 0 );

		// Click the "More info" button to show the info popover
		buttonMoreInfo.simulate( 'click' );
		expect( prompt.find( 'Popover' ).length ).toBe( 1 );

		// Click outside the prompt to hide the info popover
		eventMap.click( { target: document.body } );
		expect( prompt.find( 'Popover' ).length ).toBe( 0 );

		expect( window.setUserSetting )
			.not.toHaveBeenCalled();
		expect( removeNotice )
			.not.toHaveBeenCalled();
	} );
} );
