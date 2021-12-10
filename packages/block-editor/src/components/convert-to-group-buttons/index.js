/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { _x } from '@wordpress/i18n';
import { switchToBlockType } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import useConvertToGroupButtonProps from './use-convert-to-group-button-props';

function ConvertToGroupButton( {
	clientIds,
	isGroupable,
	isUngroupable,
	blocksSelection,
	groupingBlockName,
	onClose = () => {},
} ) {
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const { areInnerBlocksControlled, getBlocks } = useSelect(
		blockEditorStore
	);

	const onConvertToGroup = () => {
		// Activate the `transform` on the Grouping Block which does the conversion
		const newBlocks = switchToBlockType(
			blocksSelection,
			groupingBlockName
		);
		if ( newBlocks ) {
			replaceBlocks( clientIds, newBlocks );
		}
	};

	const onConvertFromGroup = () => {
		const innerBlocks = blocksSelection[ 0 ].innerBlocks;
		if ( ! innerBlocks.length ) {
			return;
		}

		// The blocks in block selection don't include inner blocks for the inner block controller.
		// We've to add them manually to avoid data loss.
		const newBlocks = innerBlocks.map( ( block ) => {
			if ( areInnerBlocksControlled( block.clientId ) ) {
				block.innerBlocks = getBlocks( block.clientId );
			}

			return block;
		} );
		replaceBlocks( clientIds, newBlocks );
	};

	if ( ! isGroupable && ! isUngroupable ) {
		return null;
	}

	return (
		<>
			{ isGroupable && (
				<MenuItem
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
						'Ungrouping blocks from within a Group block back into individual blocks within the Editor '
					) }
				</MenuItem>
			) }
		</>
	);
}

export { useConvertToGroupButtonProps, ConvertToGroupButton };
