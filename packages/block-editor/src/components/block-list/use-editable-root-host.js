/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Makes the block list layout element declare itself the editing host while
 * it is the nearest block list containing the selection: the selected block
 * supports `editableRoot`, or a multi-selection spans the list's blocks. The
 * host presents as a named multiline textbox, per the WAI-ARIA textbox role.
 *
 * @param {?string} rootClientId The client ID of the block whose inner
 *                               blocks the layout element renders, if any.
 *
 * @return {Object} Props to apply to the layout element.
 */
export default function useEditableRootHost( rootClientId = '' ) {
	const isHost = useSelect(
		( select ) => {
			const {
				getSelectionStart,
				getBlockRootClientId,
				hasMultiSelection,
				isMultiSelecting,
				getSelectedBlockClientId,
				canHostEditableRoot,
			} = unlock( select( blockEditorStore ) );
			const selectedClientId = getSelectedBlockClientId();

			if ( selectedClientId ) {
				return (
					getBlockRootClientId( selectedClientId ) ===
						rootClientId &&
					( canHostEditableRoot( selectedClientId ) ||
						// A selection gesture in progress (e.g. a drag
						// leaving the block) needs the list editable so the
						// native selection can extend across its blocks.
						isMultiSelecting() )
				);
			}

			// A multi-selection always makes its list the editing host so
			// the native selection can extend across the blocks. The store
			// promotes multi-selections to sibling level, so the start
			// block's root is the list containing the whole selection.
			if ( hasMultiSelection() ) {
				return (
					getBlockRootClientId( getSelectionStart().clientId ) ===
					rootClientId
				);
			}

			return false;
		},
		[ rootClientId ]
	);

	if ( ! isHost ) {
		return {};
	}

	return {
		contentEditable: 'true',
		suppressContentEditableWarning: true,
		role: 'textbox',
		'aria-multiline': 'true',
		'aria-label': __( 'Editor canvas' ),
	};
}
