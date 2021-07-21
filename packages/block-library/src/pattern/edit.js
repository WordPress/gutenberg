/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import {
	store as blockEditorStore,
	InnerBlocks,
} from '@wordpress/block-editor';

const PatternEdit = ( { attributes, clientId, isSelected } ) => {
	const selectedPattern = useSelect( ( select ) =>
		select( blockEditorStore ).__experimentalGetParsedPattern(
			attributes.slug
		)
	);
	const isInnerBlockSelected = useSelect( ( select ) => {
		const { getBlock, hasSelectedInnerBlock } = select( blockEditorStore );

		const block = getBlock( clientId );
		const hasInnerBlocks = !! ( block && block.innerBlocks.length );
		return hasInnerBlocks && hasSelectedInnerBlock( clientId, true );
	} );
	const {
		replaceBlocks,
		replaceInnerBlocks,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	// Run this effect when the block, or any of its InnerBlocks are selected.
	// This replaces the Pattern block wrapper with the content of the pattern.
	// This change won't be saved unless further changes are made to the InnerBlocks.
	useEffect( () => {
		if (
			( isSelected || isInnerBlockSelected ) &&
			selectedPattern?.blocks
		) {
			__unstableMarkNextChangeAsNotPersistent();
			replaceBlocks( clientId, selectedPattern.blocks );
		}
	}, [ isSelected, isInnerBlockSelected ] );

	// Run this effect when the component loads.
	// This adds the Pattern block template as InnerBlocks.
	// This change won't be saved.
	useEffect( () => {
		if ( selectedPattern?.blocks ) {
			__unstableMarkNextChangeAsNotPersistent();
			replaceInnerBlocks( clientId, selectedPattern.blocks );
		}
	}, [] );

	return <InnerBlocks />;
};

export default PatternEdit;
