/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { chevronRight } from '@wordpress/icons';
import { cloneBlock } from '@wordpress/blocks';
import {
	MenuGroup,
	MenuItem,
	Popover,
	VisuallyHidden,
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	__unstableCompositeItem as CompositeItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';

/**
 * Find a selected block match in a pattern and return it.
 * We return a reference to the block object to mutate it.
 * We have first cloned the pattern blocks in a new property
 * `transformedBlocks` and we mutate this.
 *
 * @param {WPBlock} parsedBlock The pattern's parsed block to try to find a match.
 * @param {string} selectedBlockName The current selected block's name.
 * @param {Set} transformedBlocks A set holding the previously matched blocks.
 *
 * @return {WPBlock|boolean} The matched block if found or `false`.
 */
// TODO tests
function findMatchingBlockInPattern(
	parsedBlock,
	selectedBlockName,
	transformedBlocks
) {
	const { clientId, name, innerBlocks = [] } = parsedBlock;
	// Check if parsedBlock has been transformed already.
	// This is needed because we loop the selected blocks
	// and for example we may have selected two paragraphs and
	// the patterns could have more `paragraphs`.
	if ( transformedBlocks.has( clientId ) ) return false;
	if ( name === selectedBlockName ) {
		// We have found a matched block type, so
		// add it to the transformed blocks Set and return it.
		transformedBlocks.add( clientId );
		return parsedBlock;
	}
	// Recurse through the inner blocks of a parsed block and
	// try to find a matching block.
	for ( const innerBlock of innerBlocks ) {
		const match = findMatchingBlockInPattern(
			innerBlock,
			selectedBlockName,
			transformedBlocks
		);
		if ( match ) return match;
	}
}

function PatternTransformationsMenu( {
	blocks,
	patterns: statePatterns,
	onSelect,
	replaceInnerBlocksMode = false,
} ) {
	const [ showTransforms, setShowTransforms ] = useState( false );
	// `replaceInnerBlocksMode` is if we want to replace all contents of selected
	// block and not try to transform the selected blocks. This mode is set when
	// a single block is selected and currently is a Template Part.
	const patterns = useMemo( () => {
		let _patterns;
		if ( replaceInnerBlocksMode ) {
			_patterns = statePatterns.map( ( statePattern ) => ( {
				...statePattern,
				transformedBlocks: statePattern.contentBlocks.map( ( block ) =>
					cloneBlock( block )
				),
			} ) );
		} else {
			_patterns = statePatterns.reduce( ( accumulator, statePattern ) => {
				// Clone the parsed pattern's block in `transformedBlocks`
				// to mutate this prop.
				const pattern = {
					...statePattern,
					transformedBlocks: statePattern.contentBlocks.map(
						( block ) => cloneBlock( block )
					),
				};
				const { transformedBlocks: patternBlocks } = pattern;
				const transformedBlocksSet = new Set();
				blocks.forEach( ( block ) => {
					// Recurse through every pattern block
					// to find matches with each selected block,
					// and transform these blocks (we mutate patternBlocks).
					patternBlocks.forEach( ( patternBlock ) => {
						const match = findMatchingBlockInPattern(
							patternBlock,
							block.name,
							transformedBlocksSet
						);
						if ( ! match ) return;
						// Found a match so update it with the selected block's attributes.
						match.attributes = {
							...match.attributes,
							...block.attributes,
						};
						// When we have a match with inner blocks keep only the
						// blocks from the selected block and skip the inner blocks
						// from the pattern.
						match.innerBlocks = block.innerBlocks;
					} );
				} );
				// If we haven't matched all the selected blocks, don't add
				// the pattern to the transformation list.
				if ( blocks.length !== transformedBlocksSet.size ) {
					return accumulator;
				}
				// TODO Maybe prioritize first matches with fewer tries to find a match?
				accumulator.push( pattern );
				return accumulator;
			}, [] );
		}
		return _patterns;
	}, [ replaceInnerBlocksMode, statePatterns ] );

	if ( ! patterns.length ) return null;

	return (
		<MenuGroup className="block-editor-block-switcher__pattern__transforms__menugroup">
			{ showTransforms && (
				<PreviewPatternsPopover
					patterns={ patterns }
					onSelect={ onSelect }
				/>
			) }
			<MenuItem
				onClick={ ( event ) => {
					event.preventDefault();
					setShowTransforms( ! showTransforms );
				} }
				icon={ chevronRight }
			>
				{ __( 'Patterns' ) }
			</MenuItem>
		</MenuGroup>
	);
}

function PreviewPatternsPopover( { patterns, onSelect } ) {
	return (
		<div className="block-editor-block-switcher__popover__preview__parent">
			<div className="block-editor-block-switcher__popover__preview__container">
				<Popover
					className="block-editor-block-switcher__preview__popover"
					position="bottom right"
				>
					<div className="block-editor-block-switcher__preview">
						<div className="block-editor-block-switcher__preview-title">
							{ __( 'Preview' ) }
						</div>
						<BlockPatternsList
							patterns={ patterns }
							onSelect={ onSelect }
						/>
					</div>
				</Popover>
			</div>
		</div>
	);
}

function BlockPatternsList( { patterns, onSelect } ) {
	const composite = useCompositeState();
	return (
		<Composite
			{ ...composite }
			role="listbox"
			className="block-editor-block-switcher__preview-patterns-container"
			aria-label={ __( 'Patterns list' ) }
		>
			{ patterns.map( ( pattern ) => (
				<BlockPattern
					key={ pattern.name }
					pattern={ pattern }
					onSelect={ onSelect }
					composite={ composite }
				/>
			) ) }
		</Composite>
	);
}

// TODO: This needs to be consolidated to probably be reused across: Patterns in Placeholder, Inserter and here.
function BlockPattern( { pattern, onSelect, composite } ) {
	const baseClassName =
		'block-editor-block-switcher__preview-patterns-container';
	const descriptionId = useInstanceId(
		BlockPattern,
		`${ baseClassName }-list__item-description`
	);
	return (
		<div
			className={ `${ baseClassName }-list__list-item` }
			aria-label={ pattern.title }
			aria-describedby={ pattern.description ? descriptionId : undefined }
		>
			<CompositeItem
				role="option"
				as="div"
				{ ...composite }
				className={ `${ baseClassName }-list__item` }
				onClick={ () => onSelect( pattern.transformedBlocks ) }
			>
				<BlockPreview
					blocks={ pattern.transformedBlocks }
					viewportWidth={ 500 }
				/>
			</CompositeItem>
			{ !! pattern.description && (
				<VisuallyHidden id={ descriptionId }>
					{ pattern.description }
				</VisuallyHidden>
			) }
		</div>
	);
}

export default PatternTransformationsMenu;
