/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch, useSelectors } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export function useCaretInFormat( { value } ) {
	const hasActiveFormats =
		value.activeFormats && !! value.activeFormats.length;
	const { isCaretWithinFormattedText } = useSelectors( blockEditorStore );
	const { enterFormattedText, exitFormattedText } = useDispatch(
		blockEditorStore
	);
	useEffect( () => {
		if ( hasActiveFormats ) {
			if ( ! isCaretWithinFormattedText() ) {
				enterFormattedText();
			}
		} else if ( isCaretWithinFormattedText() ) {
			exitFormattedText();
		}
	}, [ hasActiveFormats ] );
}
