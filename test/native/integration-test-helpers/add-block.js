/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';

/**
 * External dependencies
 */
import { act, fireEvent, within } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

/**
 * Internal dependencies
 */
import { withFakeTimers } from './with-fake-timers';

/**
 * Adds a block via the block picker.
 *
 * @param {import('@testing-library/react-native').RenderAPI} screen                   A Testing Library screen.
 * @param {string}                                            blockName                Name of the block to be inserted as shown in the block picker.
 * @param {Object}                                            options                  Configuration options for adding a block.
 * @param {boolean}                                           [options.isPickerOpened] Option to skip opening the inserter picker.
 */
export const addBlock = async (
	screen,
	blockName,
	{ isPickerOpened } = {}
) => {
	if ( ! isPickerOpened ) {
		fireEvent.press( screen.getByLabelText( 'Add block' ) );
	}

	const inserterModal = screen.getByTestId( 'InserterUI-Blocks' );
	// onScroll event used to force the FlatList to render all items
	fireEvent.scroll( inserterModal, {
		nativeEvent: {
			contentOffset: { y: 0, x: 0 },
			contentSize: { width: 100, height: 100 },
			layoutMeasurement: { width: 100, height: 100 },
		},
	} );

	const blockButton = await within( inserterModal ).findByText( blockName );
	// Blocks can perform belated state updates after they are inserted.
	// To avoid potential `act` warnings, we ensure that all timers and queued
	// microtasks are executed.
	await withFakeTimers( async () => {
		fireEvent.press( blockButton );

		// On iOS the action for inserting a block is delayed (https://bit.ly/3AVALqH).
		// Hence, we need to wait for the different steps until the the block is inserted.
		if ( Platform.isIOS ) {
			await AccessibilityInfo.isScreenReaderEnabled();
			act( () => jest.runOnlyPendingTimers() );
		}

		// Run all timers, in case any performs a state updates.
		// Column block example: https://t.ly/NjTs
		act( () => jest.runOnlyPendingTimers() );
		// Let potential queued microtasks (like Promises) to be executed.
		// Inner blocks example: https://t.ly/b95nA
		await act( async () => {} );
	} );
};
