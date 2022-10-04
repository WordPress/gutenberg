/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

const EMPTY_ARRAY = [];

export function useInnerBlocks( clientId ) {
	return useSelect(
		( select ) => {
			const { getBlock, getBlocks, hasSelectedInnerBlock } =
				select( blockEditorStore );

			// This relies on the fact that `getBlock` won't return controlled
			// inner blocks, while `getBlocks` does. It might be more stable to
			// introduce a selector like `getUncontrolledInnerBlocks`, just in
			// case `getBlock` is fixed.
			const _uncontrolledInnerBlocks = getBlock( clientId ).innerBlocks;

			const _hasUncontrolledInnerBlocks =
				!! _uncontrolledInnerBlocks?.length;
			const _controlledInnerBlocks = _hasUncontrolledInnerBlocks
				? EMPTY_ARRAY
				: getBlocks( clientId );

			return {
				innerBlocks: _hasUncontrolledInnerBlocks
					? _uncontrolledInnerBlocks
					: _controlledInnerBlocks,
				hasUncontrolledInnerBlocks: _hasUncontrolledInnerBlocks,
				uncontrolledInnerBlocks: _uncontrolledInnerBlocks,
				controlledInnerBlocks: _controlledInnerBlocks,
				isInnerBlockSelected: hasSelectedInnerBlock( clientId, true ),
			};
		},
		[ clientId ]
	);
}
