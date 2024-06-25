/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default function useBlockInspectorAnimationSettings( blockType ) {
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
					_selectedBlockClientId,
					animationParent,
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

				return globalBlockInspectorAnimationSettings?.[
					blockType.name
				];
			}
			return null;
		},
		[ blockType ]
	);
}
