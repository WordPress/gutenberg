/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { BlockSettingsMenuControls } from '@wordpress/block-editor';

/**
 * Multi-block "Add note" entry point.
 *
 * The inline "Add note" button lives in the rich-text format toolbar, which is
 * not mounted while multiple blocks are selected; the single-block "Add note"
 * menu item only shows for a single selected block. This surfaces "Add note" in
 * the block options (⋮) menu when the selection spans more than one block, so a
 * note can anchor to a cross-block text range.
 *
 * Rendered via `BlockSettingsMenuControls`, whose Slot lives in the block
 * options dropdown for both single- and multi-block selections.
 *
 * @param {Object}   props
 * @param {Function} props.onClick           Opens the new-note form for the current selection.
 * @param {boolean}  props.isDistractionFree Whether distraction-free mode is on.
 * @return {?Element} The fill, or null in distraction-free mode.
 */
export function AddNoteToSelectionMenuItem( { onClick, isDistractionFree } ) {
	if ( isDistractionFree ) {
		return null;
	}
	return (
		<BlockSettingsMenuControls>
			{ ( { selectedClientIds, canEdit, onClose } ) =>
				canEdit &&
				selectedClientIds.length > 1 && (
					<MenuItem
						aria-haspopup="dialog"
						onClick={ () => {
							onClick();
							onClose();
						} }
					>
						{ __( 'Add note' ) }
					</MenuItem>
				)
			}
		</BlockSettingsMenuControls>
	);
}
