/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';

/**
 * External dependencies
 */
import { fireEvent } from '@testing-library/react-native';
import { ActionSheetIOS } from 'react-native';

/**
 * Sets up the Picker component for testing.
 *
 * @typedef {Object} PickerMockFunctions
 * @property {Function}                                          selectOption    Selects one of the options of the picker.
 *
 * @param    {import('@testing-library/react-native').RenderAPI} screen          A Testing Library screen.
 * @param    {string[]}                                          options         Array with the options of the picker.
 * @param    {Function}                                          onManualTrigger Optional function when a picker is manually triggered.
 *
 * @return {PickerMockFunctions} Picker functions.
 */
export function setupPicker( screen, options, onManualTrigger = () => {} ) {
	let selectOption = ( option ) => {
		fireEvent.press( screen.getByText( option ) );
	};
	if ( Platform.isIOS ) {
		let onOptionSelected;
		ActionSheetIOS.showActionSheetWithOptions.mockImplementation(
			( _, callback ) => {
				onOptionSelected = callback;
			}
		);
		// The index passed is incremented by one as the first
		// option of the picker is `Cancel`.
		selectOption = async ( option ) => {
			await onManualTrigger();
			onOptionSelected( options.indexOf( option ) + 1 );
		};
	}
	return { selectOption };
}
