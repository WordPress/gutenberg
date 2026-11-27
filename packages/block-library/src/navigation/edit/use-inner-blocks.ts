import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import type { Block } from '@wordpress/blocks';

interface InnerBlocks {
	innerBlocks: Block[];
	hasUncontrolledInnerBlocks: boolean;
	isInnerBlockSelected: boolean;
}

export function useInnerBlocks( clientId: string ): InnerBlocks {
	return useSelect(
		( select ) => {
			const {
				areInnerBlocksControlled,
				getBlocks,
				hasSelectedInnerBlock,
			} = select( blockEditorStore );

			// Inner blocks become controlled once they are synced with a
			// `wp_navigation` entity. Until then, any inner blocks belong to
			// the Navigation block itself.
			const innerBlocks = getBlocks( clientId );

			return {
				innerBlocks,
				hasUncontrolledInnerBlocks:
					! areInnerBlocksControlled( clientId ) &&
					!! innerBlocks.length,
				isInnerBlockSelected: hasSelectedInnerBlock( clientId, true ),
			};
		},
		[ clientId ]
	);
}
