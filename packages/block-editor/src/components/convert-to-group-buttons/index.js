/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { _x } from '@wordpress/i18n';
import { switchToBlockType } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { displayShortcut } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import useConvertToGroupButtonProps from './use-convert-to-group-button-props';
import BlockGroupToolbar from './toolbar';

function ConvertToGroupButton( {
	clientIds,
	isGroupable,
	isUngroupable,
	onUngroup,
	blocksSelection,
	groupingBlockName,
	onClose = () => {},
} ) {
	const { getSelectedBlockClientIds } = useSelect( blockEditorStore );
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const onConvertToGroup = () => {
		// Activate the `transform` on the Grouping Block which does the conversion.
		const newBlocks = switchToBlockType(
			blocksSelection,
			groupingBlockName
		);
		if ( newBlocks ) {
			replaceBlocks( clientIds, newBlocks );
		}
	};

	const onConvertFromGroup = () => {
		let innerBlocks = blocksSelection[ 0 ].innerBlocks;
		if ( ! innerBlocks.length ) {
			return;
		}
		if ( onUngroup ) {
			innerBlocks = onUngroup(
				blocksSelection[ 0 ].attributes,
				blocksSelection[ 0 ].innerBlocks
			);
		}
		replaceBlocks( clientIds, innerBlocks );
	};

	if ( ! isGroupable && ! isUngroupable ) {
		return null;
	}

	const selectedBlockClientIds = getSelectedBlockClientIds();

	return (
		<>
			{ isGroupable && (
				<MenuItem
					shortcut={
						selectedBlockClientIds.length > 1
							? displayShortcut.primary( 'g' )
							: undefined
					}
					onClick={ () => {
						onConvertToGroup();
						onClose();
					} }
				>
					{ _x( 'Group', 'verb' ) }
				</MenuItem>
			) }
			{ isUngroupable && (
				<MenuItem
					onClick={ () => {
						onConvertFromGroup();
						onClose();
					} }
				>
					{ _x(
						'Ungroup',
						'Ungrouping blocks from within a grouping block back into individual blocks within the Editor'
					) }
				</MenuItem>
			) }
		</>
	);
}

export {
	BlockGroupToolbar,
	ConvertToGroupButton,
	useConvertToGroupButtonProps,
};
