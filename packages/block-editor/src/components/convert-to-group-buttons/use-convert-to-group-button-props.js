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
 * @return {ConvertToGroupButtonProps} Returns the properties needed by `ConvertToGroupButton`.
 */
export default function useConvertToGroupButtonProps() {
	const {
		clientIds,
		isGroupable,
		isUngroupable,
		blocksSelection,
		groupingBlockName,
	} = useSelect( ( select ) => {
		const {
			getBlockRootClientId,
			getBlocksByClientId,
			canInsertBlockType,
			getSelectedBlockClientIds,
		} = select( blockEditorStore );
		const { getGroupingBlockName } = select( blocksStore );

		const _clientIds = getSelectedBlockClientIds();
		const _groupingBlockName = getGroupingBlockName();

		const rootClientId = !! _clientIds?.length
			? getBlockRootClientId( _clientIds[ 0 ] )
			: undefined;

		const groupingBlockAvailable = canInsertBlockType(
			_groupingBlockName,
			rootClientId
		);

		const _blocksSelection = getBlocksByClientId( _clientIds );

		const isSingleGroupingBlock =
			_blocksSelection.length === 1 &&
			_blocksSelection[ 0 ]?.name === _groupingBlockName;

		// Do we have
		// 1. Grouping block available to be inserted?
		// 2. One or more blocks selected
		const _isGroupable = groupingBlockAvailable && _blocksSelection.length;

		// Do we have a single Group Block selected and does that group have inner blocks?
		const _isUngroupable =
			isSingleGroupingBlock &&
			!! _blocksSelection[ 0 ].innerBlocks.length;
		return {
			clientIds: _clientIds,
			isGroupable: _isGroupable,
			isUngroupable: _isUngroupable,
			blocksSelection: _blocksSelection,
			groupingBlockName: _groupingBlockName,
		};
	}, [] );
	return {
		clientIds,
		isGroupable,
		isUngroupable,
		blocksSelection,
		groupingBlockName,
	};
}
