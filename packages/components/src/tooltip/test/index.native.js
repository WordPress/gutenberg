/**
 * External dependencies
 */
import { fireEvent, render, act } from 'test/helpers';
import { Keyboard, Text } from 'react-native';

/**
 * Internal dependencies
 */
import Tooltip from '../index';
import { Provider as SlotFillProvider } from '../../slot-fill';

// Minimal tree to render tooltip.
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
			const length = keyboardHandlers.push( [ event, handler ] );
			return {
				remove: () => {
					keyboardHandlers.splice( length - 1 );
				},
			};
		} );
} );

afterAll( () => {
	keyboardAddListenerSpy.mockRestore();
} );

it( 'displays the message', () => {
	const screen = render(
		<TooltipSlot>
			<Tooltip visible text="A helpful message">
				<Text>I need help</Text>
			</Tooltip>
		</TooltipSlot>
	);

	expect( screen.getByText( 'A helpful message' ) ).toBeTruthy();
} );

it( 'dismisses when the screen is tapped', () => {
	const screen = render(
		<TooltipSlot>
			<Tooltip visible text="A helpful message">
				<Text>I need help</Text>
			</Tooltip>
		</TooltipSlot>
	);

	expect( screen.getByText( 'A helpful message' ) ).toBeTruthy();

	fireEvent( screen.getByTestId( 'tooltip-overlay' ), 'touchStart' );

	expect( screen.queryByText( 'A helpful message' ) ).toBeNull();
} );

it( 'dismisses when the keyboard closes', () => {
	const screen = render(
		<TooltipSlot>
			<Tooltip visible text="A helpful message">
				<Text>I need help</Text>
			</Tooltip>
		</TooltipSlot>
	);

	// Show keyboard.
	act( () => {
		keyboardHandlers.forEach( ( [ event, handler ] ) => {
			if ( event === 'keyboardDidShow' ) {
				handler();
			}
		} );
	} );

	expect( screen.getByText( 'A helpful message' ) ).toBeTruthy();

	// Hide keyboard
	act( () => {
		keyboardHandlers.forEach( ( [ event, handler ] ) => {
			if ( event === 'keyboardDidHide' ) {
				handler();
			}
		} );
	} );

	expect( screen.queryByText( 'A helpful message' ) ).toBeNull();
} );
