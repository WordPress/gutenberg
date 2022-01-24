/**
 * External dependencies
 */
import { Keyboard, Platform } from 'react-native';
import { render, fireEvent, waitFor } from 'test/helpers';

/**
 * Internal dependencies
 */
import LinkSettingsNavigation from '../link-settings-navigation';

jest.useFakeTimers( 'legacy' );
jest.spyOn( Keyboard, 'dismiss' );

const subject = (
	<LinkSettingsNavigation
		setAttributes={ () => {} }
		hasPicker
		options={ {
			url: {
				label: 'Link URL',
				placeholder: 'Add URL',
				autoFocus: false,
			},
		} }
		isVisible
		withBottomSheet
	/>
);

describe( 'Android', () => {
	it( 'improves back animation performance by dismissing keyboard beforehand', async () => {
		const screen = render( subject );
		fireEvent.press( screen.getByText( 'Link to' ) );
		fireEvent.press(
			screen.getByA11yLabel( 'Link to, Search or type URL' )
		);
		// Await back button to allow async state updates to complete
		const backButton = await waitFor( () =>
			screen.getByA11yLabel( 'Go back' )
		);
		Keyboard.dismiss.mockClear();
		fireEvent.press( backButton );

		expect( Keyboard.dismiss ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'improves apply animation performance by dismissing keyboard beforehand', async () => {
		const screen = render( subject );
		fireEvent.press( screen.getByText( 'Link to' ) );
		// Await back button to allow async state updates to complete
		const backButton = await waitFor( () =>
			screen.getByA11yLabel( 'Apply' )
		);
		Keyboard.dismiss.mockClear();
		fireEvent.press( backButton );

		expect( Keyboard.dismiss ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'iOS', () => {
	const originalPlatform = Platform.OS;
	beforeAll( () => {
		Platform.OS = 'ios';
	} );

	afterAll( () => {
		Platform.OS = originalPlatform;
	} );

	it( 'improves back animation performance by dismissing keyboard beforehand', async () => {
		const screen = render( subject );
		fireEvent.press( screen.getByText( 'Link to' ) );
		// Await back button to allow async state updates to complete
		const backButton = await waitFor( () =>
			screen.getByA11yLabel( 'Go back' )
		);
		Keyboard.dismiss.mockClear();
		fireEvent.press( backButton );

		expect( Keyboard.dismiss ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'improves apply animation performance by dismissing keyboard beforehand', async () => {
		const screen = render( subject );
		fireEvent.press( screen.getByText( 'Link to' ) );
		// Await back button to allow async state updates to complete
		const backButton = await waitFor( () =>
			screen.getByA11yLabel( 'Apply' )
		);
		Keyboard.dismiss.mockClear();
		fireEvent.press( backButton );

		expect( Keyboard.dismiss ).toHaveBeenCalledTimes( 1 );
	} );
} );
