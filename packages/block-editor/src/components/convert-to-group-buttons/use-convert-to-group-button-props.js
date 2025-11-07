/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

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
				getBlocksByClientId,
				getSelectedBlockClientIds,
				isUngroupable,
				isGroupable,
			} = select( blockEditorStore );
			const { isSectionBlock } = unlock( select( blockEditorStore ) );
			const { getGroupingBlockName, getBlockType } =
				select( blocksStore );
			const clientIds = selectedClientIds?.length
				? selectedClientIds
				: getSelectedBlockClientIds();
			const blocksSelection = getBlocksByClientId( clientIds );
			const [ firstSelectedBlock ] = blocksSelection;
			let _isUngroupable =
				clientIds.length === 1 && isUngroupable( clientIds[ 0 ] );

			// Don't show ungroup for section blocks when the experiment is enabled
			// since we show "Unlock design" instead
			if (
				_isUngroupable &&
				window?.__experimentalContentOnlyPatternInsertion &&
				isSectionBlock( clientIds[ 0 ] )
			) {
				_isUngroupable = false;
			}

			return {
				clientIds,
				isGroupable: isGroupable( clientIds ),
				isUngroupable: _isUngroupable,
				blocksSelection,
				groupingBlockName: getGroupingBlockName(),
				onUngroup:
					_isUngroupable &&
					getBlockType( firstSelectedBlock.name )?.transforms
						?.ungroup,
			};
		},
		[ selectedClientIds ]
	);
}
