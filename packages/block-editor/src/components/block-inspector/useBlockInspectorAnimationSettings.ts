import { useSelect } from '@wordpress/data';
import type { BlockType } from '@wordpress/blocks';
import { store as blockEditorStore } from '../../store';

export default function useBlockInspectorAnimationSettings(
	blockType: BlockType | null | undefined
) {
	return useSelect(
		( select ) => {
			if ( blockType ) {
				const globalBlockInspectorAnimationSettings =
					select( blockEditorStore ).getSettings()
						.blockInspectorAnimation;

				// Get the name of the block that will allow it's children to be animated.
				const animationParent =
					globalBlockInspectorAnimationSettings?.animationParent;

				// Determine whether the animationParent block is a parent of the selected block.
				const { getSelectedBlockClientId, getBlockParentsByBlockName } =
					select( blockEditorStore );
				const _selectedBlockClientId = getSelectedBlockClientId();
				const animationParentBlockClientId = getBlockParentsByBlockName(
					// A block type is only passed for a selected block.
					_selectedBlockClientId as string,
					// Without an animation parent, no parent matches.
					animationParent as string,
					true
				)[ 0 ];

				// If the selected block is not a child of the animationParent block,
				// and not an animationParent block itself, don't animate.
				if (
					! animationParentBlockClientId &&
					blockType.name !== animationParent
				) {
					return null;
				}

				// Block names map to animation settings.
				return globalBlockInspectorAnimationSettings?.[
					blockType.name
				] as { enterDirection?: string } | undefined;
			}
			return null;
		},
		[ blockType ]
	);
}
