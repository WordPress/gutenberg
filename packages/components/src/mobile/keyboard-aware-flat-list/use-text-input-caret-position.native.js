/**
 * WordPress dependencies
 */
import RCTAztecView from '@wordpress/react-native-aztec';
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Hook that listens to caret changes from AztecView TextInputs.
 *
 * @param {boolean} scrollEnabled Whether the scroll is enabled or not.
 * @return {[number]} Current caret's Y coordinate position.
 */
export default function useTextInputCaretPosition( scrollEnabled ) {
	const [ currentCaretYPosition, setCurrentCaretYPosition ] = useState();

	const onCaretChange = useCallback( ( { caretY } ) => {
		setCurrentCaretYPosition( caretY );
	}, [] );

	useEffect( () => {
		if ( scrollEnabled ) {
			RCTAztecView.InputState.addCaretChangeListener( onCaretChange );
		} else {
			RCTAztecView.InputState.removeCaretChangeListener( onCaretChange );
		}

		return () => {
			if ( scrollEnabled ) {
				RCTAztecView.InputState.removeCaretChangeListener(
					onCaretChange
				);
			}
		};
	}, [ scrollEnabled, onCaretChange ] );
	return [ currentCaretYPosition ];
}
