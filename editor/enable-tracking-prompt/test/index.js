/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import {
	EnableTrackingPrompt,
	TRACKING_PROMPT_NOTICE_ID,
} from '../';

describe( 'EnableTrackingPrompt', () => {
	const tracking = require( '../../utils/tracking' ); // no default export
	const originalSetUserSetting = window.setUserSetting;
	const originalBumpStat = tracking.bumpStat;
	let removeNotice;

	beforeEach( () => {
		window.setUserSetting = jest.fn();
		tracking.bumpStat = jest.fn();
		removeNotice = jest.fn();
	} );

	afterEach( () => {
		window.setUserSetting = originalSetUserSetting;
		tracking.bumpStat = originalBumpStat;
	} );

	it( 'should render a prompt with Yes and No buttons', () => {
		const prompt = mount(
			<EnableTrackingPrompt />
		);
		const buttons = prompt.find( '.button' );
		expect( buttons.length ).toBe( 2 );
		expect( buttons.at( 0 ).text() ).toBe( 'Yes' );
		expect( buttons.at( 1 ).text() ).toBe( 'No' );

		expect( window.setUserSetting )
			.not.toHaveBeenCalled();
		expect( tracking.bumpStat )
			.not.toHaveBeenCalled();
		expect( removeNotice )
			.not.toHaveBeenCalled();
	} );

	it( 'should enable tracking when clicking Yes', () => {
		const prompt = mount(
			<EnableTrackingPrompt removeNotice={ removeNotice } />
		);
		const buttonYes = prompt.find( '.button' )
			.filterWhere( node => node.text() === 'Yes' );
		buttonYes.simulate( 'click' );

		expect( window.setUserSetting )
			.toHaveBeenCalledWith( 'gutenberg_tracking', 'on' );
		expect( tracking.bumpStat )
			.toHaveBeenCalledWith( 'tracking', 'opt-in' );
		expect( removeNotice )
			.toHaveBeenCalledWith( TRACKING_PROMPT_NOTICE_ID );
	} );

	it( 'should disable tracking when clicking No', () => {
		const prompt = mount(
			<EnableTrackingPrompt removeNotice={ removeNotice } />
		);
		const buttonNo = prompt.find( '.button' )
			.filterWhere( node => node.text() === 'No' );
		buttonNo.simulate( 'click' );

		expect( window.setUserSetting )
			.toHaveBeenCalledWith( 'gutenberg_tracking', 'off' );
		expect( tracking.bumpStat )
			.not.toHaveBeenCalled();
		expect( removeNotice )
			.toHaveBeenCalledWith( TRACKING_PROMPT_NOTICE_ID );
	} );
} );
