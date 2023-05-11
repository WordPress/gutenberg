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
	BlockControls,
} from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const PatternEdit = ( { attributes, clientId, setAttributes } ) => {
	const { inheritedAlignment, slug, syncStatus } = attributes;
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
				__unstableMarkNextChangeAsNotPersistent();
				if ( syncStatus === 'partial' ) {
					replaceInnerBlocks(
						clientId,
						selectedPattern.blocks.map( ( block ) =>
							cloneBlock( block )
						)
					);
					return;
				}
				replaceBlocks( clientId, selectedPattern.blocks );
			} );
		}
	}, [
		clientId,
		selectedPattern.blocks,
		replaceInnerBlocks,
		__unstableMarkNextChangeAsNotPersistent,
		innerBlocks,
		syncStatus,
		replaceBlocks,
	] );

	useEffect( () => {
		if ( syncStatus !== 'partial' ) {
			return;
		}
		const alignments = [ 'wide', 'full' ];
		const blocks = innerBlocks;
		if ( ! blocks || blocks.length === 0 ) {
			return;
		}
		// Determine the widest setting of all the contained blocks.
		const widestAlignment = blocks.reduce( ( accumulator, block ) => {
			const { align } = block.attributes;
			return alignments.indexOf( align ) >
				alignments.indexOf( accumulator )
				? align
				: accumulator;
		}, undefined );

		// Set the attribute of the Pattern block to match the widest
		// alignment.
		setAttributes( {
			inheritedAlignment: widestAlignment ?? '',
		} );
	}, [
		innerBlocks,
		selectedPattern.blocks,
		setAttributes,
		inheritedAlignment,
		syncStatus,
	] );

	const blockProps = useBlockProps( {
		className:
			syncStatus === 'partial' &&
			inheritedAlignment &&
			`align${ inheritedAlignment }`,
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		templateLock: syncStatus === 'partial' ? 'contentOnly' : false,
	} );

	if ( syncStatus !== 'partial' ) {
		return <div { ...blockProps } />;
	}

	return (
		<>
			<div { ...innerBlocksProps } />
		</>
	);
};

export default PatternEdit;
