import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import type { Block } from '@wordpress/blocks';

const EMPTY_ARRAY: Block[] = [];

interface InnerBlocks {
	innerBlocks: Block[];
	hasUncontrolledInnerBlocks: boolean;
	uncontrolledInnerBlocks: Block[];
	controlledInnerBlocks: Block[];
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
			const _innerBlocks = getBlocks( clientId );
			const _areInnerBlocksControlled =
				areInnerBlocksControlled( clientId );

			const _hasUncontrolledInnerBlocks =
				! _areInnerBlocksControlled && !! _innerBlocks.length;

			return {
				innerBlocks: _innerBlocks,
				hasUncontrolledInnerBlocks: _hasUncontrolledInnerBlocks,
				uncontrolledInnerBlocks: _areInnerBlocksControlled
					? EMPTY_ARRAY
					: _innerBlocks,
				controlledInnerBlocks: _areInnerBlocksControlled
					? _innerBlocks
					: EMPTY_ARRAY,
				isInnerBlockSelected: hasSelectedInnerBlock( clientId, true ),
			};
		},
		[ clientId ]
	);
}
