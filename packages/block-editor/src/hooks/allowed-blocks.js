/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport, getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { PrivateInspectorControlsAllowedBlocks } from '../components/inspector-controls/groups';
import BlockAllowedBlocksControl from '../components/block-allowed-blocks/allowed-blocks-control';
import { useBlockEditingMode } from '../components/block-editing-mode';

function BlockEditAllowedBlocksControlPure( { clientId } ) {
	const blockEditingMode = useBlockEditingMode();
	const isContentOnly = blockEditingMode === 'contentOnly';

	if ( isContentOnly ) {
		return null;
	}

	return (
		<PrivateInspectorControlsAllowedBlocks.Fill>
			<BlockAllowedBlocksControl clientId={ clientId } />
		</PrivateInspectorControlsAllowedBlocks.Fill>
	);
}

export default {
	edit: BlockEditAllowedBlocksControlPure,
	attributeKeys: [ 'allowedBlocks' ],
	hasSupport( name ) {
		return hasBlockSupport( name, 'allowedBlocks' );
	},
};

/**
 * Filters registered block settings, extending attributes with allowedBlocks.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addAttribute( settings ) {
	// Allow blocks to specify their own attribute definition with default values if needed.
	if ( settings?.attributes?.allowedBlocks?.type ) {
		return settings;
	}
	if ( hasBlockSupport( settings, 'allowedBlocks' ) ) {
		// Gracefully handle if settings.attributes is undefined.
		settings.attributes = {
			...settings.attributes,
			allowedBlocks: {
				type: 'array',
			},
		};
	}

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/allowedBlocks/attribute',
	addAttribute
);

/**
 * Add transforms to preserve allowedBlocks on block transformations.
 *
 * @param {Object} result  The transformed block.
 * @param {Array}  source  Original blocks transformed.
 * @param {number} index   Index of the transformed block.
 * @param {Array}  results All blocks that resulted from the transformation.
 * @return {Object} Modified transformed block.
 */
export function addTransforms( result, source, index, results ) {
	if ( ! hasBlockSupport( result.name, 'allowedBlocks' ) ) {
		return result;
	}

	// If the condition verifies we are probably in the presence of a wrapping transform
	// e.g: nesting paragraphs in a group or columns and in that case the attribute should not be kept.
	if (
		source.length !== 1 &&
		results.length === 1 &&
		result.innerBlocks.length === source.length
	) {
		return result;
	}

	// If we are transforming one block to multiple blocks or multiple blocks to one block,
	// we ignore the attribute during the transform.
	if (
		( results.length === 1 && source.length > 1 ) ||
		( results.length > 1 && source.length === 1 )
	) {
		return result;
	}

	// If we are transforming multiple blocks to multiple blocks with different counts,
	// we ignore the attribute during the transform.
	if (
		results.length > 1 &&
		source.length > 1 &&
		results.length !== source.length
	) {
		return result;
	}

	// If the target block already has allowedBlocks, we don't need to preserve
	// the source allowedBlocks.
	if ( result.attributes.allowedBlocks ) {
		return result;
	}

	const sourceAllowedBlocks = source[ index ]?.attributes?.allowedBlocks;

	if ( ! sourceAllowedBlocks ) {
		return result;
	}

	const blockType = getBlockType( result.name );
	const destinationAllowedBlocks = blockType?.allowedBlocks || [];

	if ( ! destinationAllowedBlocks.length ) {
		return {
			...result,
			attributes: {
				...result.attributes,
				allowedBlocks: sourceAllowedBlocks,
			},
		};
	}

	// Filter out any source allowed blocks that are not defined in the destination allowed blocks.
	const filteredSourceAllowedBlocks = sourceAllowedBlocks.filter( ( block ) =>
		destinationAllowedBlocks.includes( block )
	);

	return {
		...result,
		attributes: {
			...result.attributes,
			allowedBlocks: filteredSourceAllowedBlocks,
		},
	};
}

addFilter(
	'blocks.switchToBlockType.transformedBlock',
	'core/allowedBlocks/addTransforms',
	addTransforms
);
