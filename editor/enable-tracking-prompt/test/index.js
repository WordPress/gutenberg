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
	let props = {};

	beforeEach( () => {
		window.setUserSetting = jest.fn();
		props = {
			bumpStat: jest.fn(),
			removeNotice: jest.fn(),
		};
	} );

	afterEach( () => {
		window.setUserSetting = originalSetUserSetting;
	} );

	it( 'should render a prompt with Yes, No, and More info buttons', () => {
		const prompt = mount(
			<EnableTrackingPrompt { ...props } />
		);
		const buttons = prompt.find( 'Button' );
		expect( buttons.length ).toBe( 3 );
		expect( buttons.at( 0 ).text() ).toBe( 'Yes' );
		expect( buttons.at( 1 ).text() ).toBe( 'No' );
		expect( buttons.at( 2 ).text() ).toBe( 'More info' );

		expect( window.setUserSetting )
			.not.toHaveBeenCalled();
		expect( props.bumpStat )
			.not.toHaveBeenCalled();
		expect( props.removeNotice )
			.not.toHaveBeenCalled();
	} );

	it( 'should enable tracking when clicking Yes', () => {
		const prompt = mount(
			<EnableTrackingPrompt { ...props } />
		);
		const buttonYes = prompt.find( 'Button' )
			.filterWhere( node => node.text() === 'Yes' );
		buttonYes.simulate( 'click' );

		expect( window.setUserSetting )
			.toHaveBeenCalledWith( 'gutenberg_tracking', 'on' );
		expect( props.bumpStat )
			.toHaveBeenCalledWith( 'tracking', 'opt-in' );
		expect( props.removeNotice )
			.toHaveBeenCalledWith( TRACKING_PROMPT_NOTICE_ID );
	} );

	it( 'should disable tracking when clicking No', () => {
		const prompt = mount(
			<EnableTrackingPrompt { ...props } />
		);
		const buttonNo = prompt.find( 'Button' )
			.filterWhere( node => node.text() === 'No' );
		buttonNo.simulate( 'click' );

		expect( window.setUserSetting )
			.toHaveBeenCalledWith( 'gutenberg_tracking', 'off' );
		expect( props.bumpStat )
			.not.toHaveBeenCalled();
		expect( props.removeNotice )
			.toHaveBeenCalledWith( TRACKING_PROMPT_NOTICE_ID );
	} );
} );
