/**
 * WordPress dependencies
 */
import RCTAztecView from '@wordpress/react-native-aztec';
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Hook that listens to caret changes from AztecView TextInputs.
 *
 * @param {boolean} scrollEnabled Whether the scroll is enabled or not.
 * @return {[number]} Current caret's data.
 */
export default function useTextInputCaretPosition( scrollEnabled ) {
	const [ currentCaretData, setCurrentCaretData ] = useState();

	const onCaretChange = useCallback( ( caret ) => {
		setCurrentCaretData( caret );
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
	return [ currentCaretData ];
}
