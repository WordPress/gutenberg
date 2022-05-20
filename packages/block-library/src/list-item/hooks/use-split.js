/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { cloneBlock } from '@wordpress/blocks';

export default function useSplit( clientId ) {
	const { getBlock } = useSelect( blockEditorStore );
	return useCallback(
		( value, isAfterOriginal ) => {
			const block = getBlock( clientId );
			return cloneBlock(
				block,
				{
					content: value,
				},
				isAfterOriginal ? [] : block.innerBlocks
			);
		},
		[ clientId, getBlock ]
	);
}
