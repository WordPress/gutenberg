/**
 * External dependencies
 */
import { shallow } from 'enzyme';
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
	let prompt;

	function getAllButtonsText() {
		return prompt.find( 'Button' )
			.map( node => node.children().at( 0 ).text() );
	}

	function getButtonWithText( text ) {
		return prompt.find( 'Button' ).filterWhere( node => {
			if ( node.children().at( 0 ).text() === text ) {
				// This works for Yes and No buttons...
				return true;
			}
			return false;
		} );
	}

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
		prompt = shallow(
			<EnableTrackingPrompt />
		);
		expect( getAllButtonsText() ).toEqual( [
			'Yes',
			'No',
			'More info',
		] );

		expect( window.setUserSetting )
			.not.toHaveBeenCalled();
		expect( removeNotice )
			.not.toHaveBeenCalled();
	} );

	it( 'should enable tracking when clicking Yes', () => {
		prompt = shallow(
			<EnableTrackingPrompt removeNotice={ removeNotice } />
		);
		const buttonYes = getButtonWithText( 'Yes' );
		buttonYes.simulate( 'click' );

		expect( window.setUserSetting )
			.toHaveBeenCalledWith( 'gutenberg_tracking', 'on' );
		expect( removeNotice )
			.toHaveBeenCalledWith( TRACKING_PROMPT_NOTICE_ID );
	} );

	it( 'should disable tracking when clicking No', () => {
		prompt = shallow(
			<EnableTrackingPrompt removeNotice={ removeNotice } />
		);
		const buttonNo = getButtonWithText( 'No' );
		buttonNo.simulate( 'click' );

		expect( window.setUserSetting )
			.toHaveBeenCalledWith( 'gutenberg_tracking', 'off' );
		expect( removeNotice )
			.toHaveBeenCalledWith( TRACKING_PROMPT_NOTICE_ID );
	} );

	it( 'should show and hide a popover when clicking More info', () => {
		const EnableTrackingPromptWrapped = clickOutside( EnableTrackingPrompt );
		prompt = shallow(
			<EnableTrackingPromptWrapped removeNotice={ removeNotice } />
		);

		expect( prompt.find( 'Popover' ).length ).toBe( 0 );

		const buttonMoreInfo = getButtonWithText( 'More info' );
		// eslint-disable-next-line console
		console.log( {
			buttons_length: prompt.find( 'Button' ).length, // always 0!
			buttonMoreInfo_length: buttonMoreInfo.length, // always 0!
		} );
		expect( prompt.find( 'Button' ).length ).toBe( 3 );

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
