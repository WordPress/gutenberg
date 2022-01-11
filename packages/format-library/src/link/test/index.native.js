/**
 * External dependencies
 */
import { Keyboard, Platform } from 'react-native';
import { render, fireEvent, waitFor } from 'test/helpers';

/**
 * WordPress dependencies
 */
import { Slot, SlotFillProvider } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { link } from '../index';

const { edit: LinkEdit } = link;

// Simplified tree to render link format component
const LinkEditSlot = ( props ) => (
	<SlotFillProvider>
		<Slot name="RichText.ToolbarControls.link" />
		<LinkEdit { ...props } />
	</SlotFillProvider>
);

jest.useFakeTimers( 'legacy' );
jest.spyOn( Keyboard, 'dismiss' );

describe( 'Android', () => {
	it( 'improves back animation performance by dismissing keyboard beforehand', async () => {
		const screen = render(
			<LinkEditSlot
				activeAttributes={ {} }
				onChange={ () => {} }
				value={ {
					text: '',
					formats: [],
					replacements: [],
				} }
			/>
		);
		fireEvent.press( screen.getByA11yLabel( 'Link' ) );
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
		const { getByA11yLabel } = render(
			<LinkEditSlot
				activeAttributes={ {} }
				onChange={ () => {} }
				value={ {
					text: '',
					formats: [],
					replacements: [],
				} }
			/>
		);
		fireEvent.press( getByA11yLabel( 'Link' ) );
		fireEvent.press( getByA11yLabel( 'Link to, Search or type URL' ) );
		// Await back button to allow async state updates to complete
		const backButton = await waitFor( () => getByA11yLabel( 'Apply' ) );
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
		const screen = render(
			<LinkEditSlot
				activeAttributes={ {} }
				onChange={ () => {} }
				value={ {
					text: '',
					formats: [],
					replacements: [],
				} }
			/>
		);
		fireEvent.press( screen.getByA11yLabel( 'Link' ) );
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
		const { getByA11yLabel } = render(
			<LinkEditSlot
				activeAttributes={ {} }
				onChange={ () => {} }
				value={ {
					text: '',
					formats: [],
					replacements: [],
				} }
			/>
		);
		fireEvent.press( getByA11yLabel( 'Link' ) );
		fireEvent.press( getByA11yLabel( 'Link to, Search or type URL' ) );
		// Await back button to allow async state updates to complete
		const backButton = await waitFor( () => getByA11yLabel( 'Apply' ) );
		Keyboard.dismiss.mockClear();
		fireEvent.press( backButton );

		expect( Keyboard.dismiss ).toHaveBeenCalledTimes( 1 );
	} );
} );
