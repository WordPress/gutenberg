/**
 * WordPress dependencies
 */
import RCTAztecView from '@wordpress/react-native-aztec';
import { useCallback } from '@wordpress/element';

/** @typedef {import('@wordpress/element').RefObject} RefObject */
/**
 * Hook that calculates the currently focused TextInput's current
 * caret Y coordinate position.
 *
 * @param {boolean}   scrollEnabled Whether the scroll is enabled or not.
 * @param {RefObject} scrollViewRef ScrollView reference.
 * @return {[Function]} Function to get the current TextInput's offset.
 */
export default function useTextInputOffset( scrollEnabled, scrollViewRef ) {
	const getTextInputOffset = useCallback(
		async ( caret ) => {
			const { caretY = null } = caret ?? {};
			const textInput =
				RCTAztecView.InputState.getCurrentFocusedElement();

			return new Promise( ( resolve ) => {
				if (
					scrollViewRef.current &&
					textInput &&
					scrollEnabled &&
					caretY !== null
				) {
					textInput.measureLayout(
						scrollViewRef.current,
						( _x, y, _width, height ) => {
							const caretYOffset =
								// For cases where the caretY value is -1
								// we use the y + height value.
								caretY >= 0 && caretY < height
									? y + caretY
									: y + height;
							resolve( Math.round( Math.abs( caretYOffset ) ) );
						},
						() => resolve( null )
					);
				} else {
					resolve( null );
				}
			} );
		},
		[ scrollEnabled, scrollViewRef ]
	);

	return [ getTextInputOffset ];
}
