/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export function useCaretInFormat( { value } ) {
	const hasActiveFormats =
		value.activeFormats && !! value.activeFormats.length;
	const { isCaretWithinFormattedText } = useSelect( blockEditorStore );
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
