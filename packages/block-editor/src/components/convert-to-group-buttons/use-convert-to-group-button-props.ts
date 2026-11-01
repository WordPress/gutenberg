import { store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import type { Block } from '@wordpress/blocks';
import { store as blockEditorStore } from '../../store';
import type { ConvertToGroupButtonProps } from './types';

/**
 * Returns the properties `ConvertToGroupButton` component needs to work properly.
 * It is used in `BlockSettingsMenuControls` to know if `ConvertToGroupButton`
 * should be rendered, to avoid ending up with an empty MenuGroup.
 *
 * @param selectedClientIds An optional array of clientIds to group. The selected blocks
 *                          from the block editor store are used if this is not provided.
 *
 * @return Returns the properties needed by `ConvertToGroupButton`.
 */
export default function useConvertToGroupButtonProps(
	selectedClientIds?: string[] | null
): ConvertToGroupButtonProps {
	return useSelect(
		( select ) => {
			const {
				getBlocksByClientId,
				getSelectedBlockClientIds,
				isUngroupable,
				isGroupable,
			} = select( blockEditorStore );
			const { getGroupingBlockName, getBlockType } =
				select( blocksStore );
			const clientIds = selectedClientIds?.length
				? selectedClientIds
				: getSelectedBlockClientIds();
			// The selected blocks exist.
			const blocksSelection = getBlocksByClientId( clientIds ) as Block[];
			const [ firstSelectedBlock ] = blocksSelection;
			// The selector returns a boolean.
			const _isUngroupable = ( clientIds.length === 1 &&
				isUngroupable( clientIds[ 0 ] ) ) as boolean;
			return {
				clientIds,
				isGroupable: isGroupable( clientIds ),
				isUngroupable: _isUngroupable,
				blocksSelection,
				// A grouping block type is registered.
				groupingBlockName: getGroupingBlockName()!,
				onUngroup:
					_isUngroupable &&
					getBlockType( firstSelectedBlock.name )?.transforms
						?.ungroup,
			};
		},
		[ selectedClientIds ]
	);
}
