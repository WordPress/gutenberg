/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * Contains the properties `ConvertToGroupButton` component needs.
 *
 * @typedef {Object} ConvertToGroupButtonProps
 * @property {string[]}  clientIds         An array of the selected client ids.
 * @property {boolean}   isGroupable       Indicates if the selected blocks can be grouped.
 * @property {boolean}   isUngroupable     Indicates if the selected blocks can be ungrouped.
 * @property {WPBlock[]} blocksSelection   An array of the selected blocks.
 * @property {string}    groupingBlockName The name of block used for handling grouping interactions.
 */

/**
 * Returns the properties `ConvertToGroupButton` component needs to work properly.
 * It is used in `BlockSettingsMenuControls` to know if `ConvertToGroupButton`
 * should be rendered, to avoid ending up with an empty MenuGroup.
 *
 * @param {?string[]} selectedClientIds An optional array of clientIds to group. The selected blocks
 *                                      from the block editor store are used if this is not provided.
 *
 * @return {ConvertToGroupButtonProps} Returns the properties needed by `ConvertToGroupButton`.
 */
export default function useConvertToGroupButtonProps( selectedClientIds ) {
	return useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getBlocksByClientId,
				canInsertBlockType,
				getSelectedBlockClientIds,
			} = select( blockEditorStore );
			const { getGroupingBlockName, getBlockType } =
				select( blocksStore );
			const clientIds = selectedClientIds?.length
				? selectedClientIds
				: getSelectedBlockClientIds();
			const groupingBlockName = getGroupingBlockName();

			const rootClientId = clientIds?.length
				? getBlockRootClientId( clientIds[ 0 ] )
				: undefined;

			const groupingBlockAvailable = canInsertBlockType(
				groupingBlockName,
				rootClientId
			);

			const blocksSelection = getBlocksByClientId( clientIds );
			const isSingleBlockSelected = blocksSelection.length === 1;
			const [ firstSelectedBlock ] = blocksSelection;
			// A block is ungroupable if it is a single grouping block with inner blocks.
			// If a block has an `ungroup` transform, it is also ungroupable, without the
			// requirement of being the default grouping block.
			// Do we have a single grouping Block selected and does that group have inner blocks?
			const isUngroupable =
				isSingleBlockSelected &&
				( firstSelectedBlock.name === groupingBlockName ||
					getBlockType( firstSelectedBlock.name )?.transforms
						?.ungroup ) &&
				!! firstSelectedBlock.innerBlocks.length;

			// Do we have
			// 1. Grouping block available to be inserted?
			// 2. One or more blocks selected
			const isGroupable =
				groupingBlockAvailable && blocksSelection.length;

			return {
				clientIds,
				isGroupable,
				isUngroupable,
				blocksSelection,
				groupingBlockName,
				onUngroup:
					isUngroupable &&
					getBlockType( firstSelectedBlock.name )?.transforms
						?.ungroup,
			};
		},
		[ selectedClientIds ]
	);
}
