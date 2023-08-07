/**
 * External dependencies
 */
import { Keyboard, Platform } from 'react-native';
import { render, fireEvent } from 'test/helpers';

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

jest.spyOn( Keyboard, 'dismiss' );

beforeAll( () => {
	jest.useFakeTimers( { legacyFakeTimers: true } );
} );

afterAll( () => {
	jest.runOnlyPendingTimers();
	jest.useRealTimers();
} );

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
		fireEvent.press( screen.getByLabelText( 'Link' ) );
		fireEvent.press(
			screen.getByLabelText( 'Link to, Search or type URL' )
		);
		// Await back button to allow async state updates to complete
		const backButton = await screen.findByLabelText( 'Go back' );
		Keyboard.dismiss.mockClear();
		fireEvent.press( backButton );

		expect( Keyboard.dismiss ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'improves apply animation performance by dismissing keyboard beforehand', async () => {
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
		fireEvent.press( screen.getByLabelText( 'Link' ) );
		fireEvent.press(
			screen.getByLabelText( 'Link to, Search or type URL' )
		);
		// Await back button to allow async state updates to complete
		const backButton = await screen.findByLabelText( 'Apply' );
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
		fireEvent.press( screen.getByLabelText( 'Link' ) );
		fireEvent.press(
			screen.getByLabelText( 'Link to, Search or type URL' )
		);
		// Await back button to allow async state updates to complete
		const backButton = await screen.findByLabelText( 'Go back' );
		Keyboard.dismiss.mockClear();
		fireEvent.press( backButton );

		expect( Keyboard.dismiss ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'improves apply animation performance by dismissing keyboard beforehand', async () => {
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
		fireEvent.press( screen.getByLabelText( 'Link' ) );
		fireEvent.press(
			screen.getByLabelText( 'Link to, Search or type URL' )
		);
		// Await back button to allow async state updates to complete
		const backButton = await screen.findByLabelText( 'Apply' );
		Keyboard.dismiss.mockClear();
		fireEvent.press( backButton );

		expect( Keyboard.dismiss ).toHaveBeenCalledTimes( 1 );
	} );
} );
