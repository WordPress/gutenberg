/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';

/**
 * External dependencies
 */
import { act, fireEvent } from '@testing-library/react-native';
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

	const blockList = screen.getByTestId( 'InserterUI-Blocks' );
	// onScroll event used to force the FlatList to render all items
	fireEvent.scroll( blockList, {
		nativeEvent: {
			contentOffset: { y: 0, x: 0 },
			contentSize: { width: 100, height: 100 },
			layoutMeasurement: { width: 100, height: 100 },
		},
	} );

	fireEvent.press( await screen.findByText( blockName ) );

	// On iOS the action for inserting a block is delayed (https://bit.ly/3AVALqH).
	// Hence, we need to wait for the different steps until the the block is inserted.
	if ( Platform.isIOS ) {
		await withFakeTimers( async () => {
			await AccessibilityInfo.isScreenReaderEnabled();
			act( () => jest.runOnlyPendingTimers() );
		} );
	}
};
