/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { _x, sprintf } from '@wordpress/i18n';
import { switchToBlockType } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';

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
	blocksSelection,
	groupingBlockName,
	groupingBlockNameLabel,
	ungroupingBlockNameLabel,
	onClose = () => {},
} ) {
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
		const innerBlocks = blocksSelection[ 0 ].innerBlocks;
		if ( ! innerBlocks.length ) {
			return;
		}
		replaceBlocks( clientIds, innerBlocks );
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
					{ sprintf(
						/* translators: %s: Label for the block grouping action. */
						_x(
							'%s ',
							'Grouping blocks into a Group block within the Editor'
						),
						groupingBlockNameLabel
					) }
				</MenuItem>
			) }
			{ isUngroupable && (
				<MenuItem
					onClick={ () => {
						onConvertFromGroup();
						onClose();
					} }
				>
					{ sprintf(
						/* translators: %s: Label for the block grouping action. */
						_x(
							'%s ',
							'Ungrouping blocks from within a Group block back into individual blocks within the Editor '
						),
						ungroupingBlockNameLabel
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
