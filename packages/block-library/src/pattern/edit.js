/**
 * WordPress dependencies
 */
import { cloneBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import {
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';

const PatternEdit = ( { attributes, clientId } ) => {
	const { slug, syncStatus } = attributes;
	const { selectedPattern, innerBlocks } = useSelect(
		( select ) => {
			return {
				selectedPattern:
					select( blockEditorStore ).__experimentalGetParsedPattern(
						slug
					),
				innerBlocks:
					select( blockEditorStore ).getBlock( clientId )
						?.innerBlocks,
			};
		},
		[ slug, clientId ]
	);
	const {
		replaceBlocks,
		replaceInnerBlocks,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	// Run this effect when the component loads.
	// This adds the Pattern's contents to the post.
	useEffect( () => {
		if ( selectedPattern?.blocks && ! innerBlocks?.length ) {
			// We batch updates to block list settings to avoid triggering cascading renders
			// for each container block included in a tree and optimize initial render.
			// Since the above uses microtasks, we need to use a microtask here as well,
			// because nested pattern blocks cannot be inserted if the parent block supports
			// inner blocks but doesn't have blockSettings in the state.
			window.queueMicrotask( () => {
				// Clone blocks from the pattern before insertion to ensure they receive
				// distinct client ids. See https://github.com/WordPress/gutenberg/issues/50628.
				const clonedBlocks = selectedPattern.blocks.map( ( block ) =>
					cloneBlock( block )
				);
				__unstableMarkNextChangeAsNotPersistent();
				if ( syncStatus === 'partial' ) {
					replaceInnerBlocks( clientId, clonedBlocks );
					return;
				}
				replaceBlocks( clientId, clonedBlocks );
			} );
		}
	}, [
		clientId,
		selectedPattern?.blocks,
		replaceInnerBlocks,
		__unstableMarkNextChangeAsNotPersistent,
		innerBlocks,
		syncStatus,
		replaceBlocks,
	] );

	const blockProps = useBlockProps( {
		className: slug?.replace( '/', '-' ),
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		templateLock: syncStatus === 'partial' ? 'contentOnly' : false,
	} );

	if ( syncStatus !== 'partial' ) {
		return <div { ...blockProps } />;
	}

	return <div { ...innerBlocksProps } />;
};

export default PatternEdit;
