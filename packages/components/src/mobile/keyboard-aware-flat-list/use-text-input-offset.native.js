/**
 * WordPress dependencies
 */
import RCTAztecView from '@wordpress/react-native-aztec';
import { useState } from '@wordpress/element';

/** @typedef {import('@wordpress/element').RefObject} RefObject */
/**
 * Hook that calculates the currently focused TextInput's current
 * caret Y coordinate position.
 *
 * @param {Object}    currentCaretData Current caret's data.
 * @param {boolean}   scrollEnabled    Whether the scroll is enabled or not.
 * @param {RefObject} scrollViewRef    ScrollView reference.
 * @return {[number]} Currently focused TextInput's offset.
 */
export default function useTextInputOffset(
	currentCaretData,
	scrollEnabled,
	scrollViewRef
) {
	const [ textInputOffset, setTextInputOffset ] = useState();

	const textInput = RCTAztecView.InputState.getCurrentFocusedElement();

	if ( scrollViewRef.current && textInput && scrollEnabled ) {
		textInput.measureLayout(
			scrollViewRef.current,
			( _x, y, _width, height ) => {
				const { caretY = null } = currentCaretData ?? {};
				const caretYOffset =
					// For cases when the focus is at the bottom of the TextInput
					// The caretY value isr -1 or null so we use the y + height value.
					caretY !== null && caretY >= 0 && caretY < height
						? y + caretY
						: y + height;

				setTextInputOffset( Math.round( Math.abs( caretYOffset ) ) );
			}
		);
	}
	return [ textInputOffset ];
}
