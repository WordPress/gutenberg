/**
 * External dependencies
 */
import { render, waitFor } from 'test/helpers';
import { Keyboard, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Tooltip from '../index';

// Minimal tree to render tooltip
const TooltipSlot = ( { children } ) => (
	<SlotFillProvider>
		<Tooltip.Slot>{ children }</Tooltip.Slot>
	</SlotFillProvider>
);

let keyboardAddListenerSpy;
const keyboardHandlers = [];

beforeAll( () => {
	keyboardAddListenerSpy = jest
		.spyOn( Keyboard, 'addListener' )
		.mockImplementation( ( event, handler ) => {
			keyboardHandlers.push( [ event, handler ] );
			return { remove: () => {} };
		} );
} );

afterAll( () => {
	keyboardAddListenerSpy.mockRestore();
} );

it( 'displays the message', async () => {
	const screen = render(
		<TooltipSlot>
			<Tooltip visible={ true } text="A helpful message">
				<Text>I need help</Text>
			</Tooltip>
		</TooltipSlot>
	);

	const message = await waitFor( () =>
		screen.getByText( 'A helpful message' )
	);

	expect( message ).toBeTruthy();
} );
