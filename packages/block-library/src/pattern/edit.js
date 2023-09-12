/**
 * WordPress dependencies
 */
import { cloneBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import {
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

const PatternEdit = ( { attributes, clientId } ) => {
	const selectedPattern = useSelect(
		( select ) =>
			select( blockEditorStore ).__experimentalGetParsedPattern(
				attributes.slug
			),
		[ attributes.slug ]
	);

	const currentThemeStylesheet = useSelect(
		( select ) => select( coreStore ).getCurrentTheme().stylesheet
	);

	const { replaceBlocks, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const { setBlockEditingMode } = useDispatch( blockEditorStore );
	const { getBlockRootClientId, getBlockEditingMode } =
		useSelect( blockEditorStore );

	function injectThemeAttributeInBlockTemplateContent( block ) {
		if (
			block.innerBlocks.find(
				( innerBlock ) => innerBlock.name === 'core/template-part'
			)
		) {
			block.innerBlocks = block.innerBlocks.map( ( innerBlock ) => {
				if (
					innerBlock.name === 'core/template-part' &&
					innerBlock.attributes.theme === undefined
				) {
					innerBlock.attributes.theme = currentThemeStylesheet;
				}
				return innerBlock;
			} );
		}

		if (
			block.name === 'core/template-part' &&
			block.attributes.theme === undefined
		) {
			block.attributes.theme = currentThemeStylesheet;
		}
		return block;
	}

	// Run this effect when the component loads.
	// This adds the Pattern's contents to the post.
	// This change won't be saved.
	// It will continue to pull from the pattern file unless changes are made to its respective template part.
	useEffect( () => {
		if ( selectedPattern?.blocks ) {
			// We batch updates to block list settings to avoid triggering cascading renders
			// for each container block included in a tree and optimize initial render.
			// Since the above uses microtasks, we need to use a microtask here as well,
			// because nested pattern blocks cannot be inserted if the parent block supports
			// inner blocks but doesn't have blockSettings in the state.
			window.queueMicrotask( () => {
				const rootClientId = getBlockRootClientId( clientId );
				// Clone blocks from the pattern before insertion to ensure they receive
				// distinct client ids. See https://github.com/WordPress/gutenberg/issues/50628.
				const clonedBlocks = selectedPattern.blocks.map( ( block ) =>
					cloneBlock(
						injectThemeAttributeInBlockTemplateContent( block )
					)
				);
				const rootEditingMode = getBlockEditingMode( rootClientId );
				// Temporarily set the root block to default mode to allow replacing the pattern.
				// This could happen when the page is disabling edits of non-content blocks.
				__unstableMarkNextChangeAsNotPersistent();
				setBlockEditingMode( rootClientId, 'default' );
				__unstableMarkNextChangeAsNotPersistent();
				replaceBlocks( clientId, clonedBlocks );
				// Restore the root block's original mode.
				__unstableMarkNextChangeAsNotPersistent();
				setBlockEditingMode( rootClientId, rootEditingMode );
			} );
		}
	}, [
		clientId,
		selectedPattern?.blocks,
		__unstableMarkNextChangeAsNotPersistent,
		replaceBlocks,
		getBlockEditingMode,
		setBlockEditingMode,
		getBlockRootClientId,
	] );

	const props = useBlockProps();

	return <div { ...props } />;
};

export default PatternEdit;
