/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { switchToBlockType } from '@wordpress/blocks';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { group } from '@wordpress/icons';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useConvertToGroupButtonProps } from '../convert-to-group-buttons';
import { store as blockEditorStore } from '../../store';

function BlockGroupToolbar( { label = _x( 'Group', 'verb' ) } ) {
	const {
		blocksSelection,
		clientIds,
		groupingBlockName,
		isGroupable,
	} = useConvertToGroupButtonProps();
	const { replaceBlocks } = useDispatch( blockEditorStore );

	const { canRemove } = useSelect(
		( select ) => {
			const { canRemoveBlocks } = select( blockEditorStore );
			return {
				canRemove: canRemoveBlocks( clientIds ),
			};
		},
		[ clientIds ]
	);

	const onConvertToGroup = () => {
		const newBlocks = switchToBlockType(
			blocksSelection,
			groupingBlockName
		);
		if ( newBlocks ) {
			replaceBlocks( clientIds, newBlocks );
		}
	};

	// Don't render the button if the current selection cannot be grouped.
	// A good example is selecting multiple button blocks within a Buttons block:
	// The group block is not a valid child of Buttons, so we should not show the button.
	// Any blocks that are locked against removal also cannot be grouped.
	if ( ! isGroupable || ! canRemove ) {
		return null;
	}

	return (
		<ToolbarGroup>
			<ToolbarButton
				icon={ group }
				label={ label }
				onClick={ onConvertToGroup }
			/>
		</ToolbarGroup>
	);
}

export default BlockGroupToolbar;
