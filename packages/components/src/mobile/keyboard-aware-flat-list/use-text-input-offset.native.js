/**
 * WordPress dependencies
 */
import RCTAztecView from '@wordpress/react-native-aztec';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useTextInputCaretPosition from './use-text-input-caret-position';

/**
 * Hook that calculates the currently focused TextInput's current
 * caret Y coordinate position.
 *
 * @param {boolean} scrollEnabled Whether the scroll is enabled or not.
 * @return {[number]} Currently focused TextInput's offset.
 */
export default function useTextInputOffset( scrollEnabled ) {
	const [ textInputOffset, setTextInputOffset ] = useState();

	const [ currentCaretYPosition ] =
		useTextInputCaretPosition( scrollEnabled );

	const textInput = RCTAztecView.InputState.getCurrentFocusedElement();

	if ( textInput && scrollEnabled ) {
		textInput.measureInWindow( ( _x, y, _width, height ) => {
			const caretYOffset =
				// For cases when the focus is at the bottom of the TextInput
				// The caretY value is -1 so we use the y + height value.
				currentCaretYPosition >= 0 && currentCaretYPosition < height
					? y + currentCaretYPosition
					: y + height;

			setTextInputOffset( Math.round( Math.abs( caretYOffset ) ) );
		} );
	}
	return [ textInputOffset ];
}
