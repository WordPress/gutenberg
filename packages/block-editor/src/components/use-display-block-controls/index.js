/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit/context';
import { store as blockEditorStore } from '../../store';

export default function useDisplayBlockControls() {
	const { isSelected, clientId, name } = useBlockEditContext();
	return useSelect(
		( select ) => {
			const {
				getBlockName,
				isFirstMultiSelectedBlock,
				getMultiSelectedBlockClientIds,
				hasSelectedInnerBlock,
			} = select( blockEditorStore );
			const { hasBlockSupport } = select( blocksStore );

			return {
				isDisplayed:
					isSelected ||
					( isFirstMultiSelectedBlock( clientId ) &&
						getMultiSelectedBlockClientIds().every(
							( id ) => getBlockName( id ) === name
						) ),
				isParentDisplayed:
					hasBlockSupport(
						getBlockName( clientId ),
						'__experimentalExposeControlsToChildren',
						false
					) && hasSelectedInnerBlock( clientId ),
			};
		},
		[ clientId, isSelected, name ]
	);
}
