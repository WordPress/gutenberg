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
	const originalSetUserSetting = window.setUserSetting;
	let removeNotice, bumpStat;

	beforeEach( () => {
		window.setUserSetting = jest.fn();
		removeNotice = jest.fn();
		bumpStat = jest.fn();
	} );

	afterEach( () => {
		window.setUserSetting = originalSetUserSetting;
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
		expect( bumpStat )
			.not.toHaveBeenCalled();
		expect( removeNotice )
			.not.toHaveBeenCalled();
	} );

	it( 'should enable tracking when clicking Yes', () => {
		const prompt = mount(
			<EnableTrackingPrompt
				removeNotice={ removeNotice }
				bumpStat={ bumpStat }
			/>
		);
		const buttonYes = prompt.find( '.button' )
			.filterWhere( node => node.text() === 'Yes' );
		buttonYes.simulate( 'click' );

		expect( window.setUserSetting )
			.toHaveBeenCalledWith( 'gutenberg_tracking', 'on' );
		expect( bumpStat )
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
		expect( bumpStat )
			.not.toHaveBeenCalled();
		expect( removeNotice )
			.toHaveBeenCalledWith( TRACKING_PROMPT_NOTICE_ID );
	} );
} );
