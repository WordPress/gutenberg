/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';

const META_ATTRIBUTE_NAME = 'metadata';

/**
 * Filters registered block settings, extending attributes to include `metadata`.
 *
 * see: https://github.com/WordPress/gutenberg/pull/40393/files#r864632012
 *
 * @param {Object} blockTypeSettings Original block settings.
 * @return {Object} Filtered block settings.
 */
export function addMetaAttribute( blockTypeSettings ) {
	// Allow blocks to specify their own attribute definition with default values if needed.
	if ( blockTypeSettings?.attributes?.[ META_ATTRIBUTE_NAME ]?.type ) {
		return blockTypeSettings;
	}

	blockTypeSettings.attributes = {
		...blockTypeSettings.attributes,
		[ META_ATTRIBUTE_NAME ]: {
			type: 'object',
		},
	};

	return blockTypeSettings;
}

/**
 * Add metadata transforms.
 *
 * @param {Object} result  The transformed block.
 * @param {Array}  source  Original blocks transformed.
 * @param {number} index   Index of the transformed block.
 * @param {Array}  results All blocks that resulted from the transformation.
 * @return {Object} Modified transformed block.
 */
export function addTransforms( result, source, index, results ) {
	// If the condition verifies we are probably in the presence of a wrapping transform
	// e.g: nesting paragraphs in a group or columns and in that case the metadata should not be kept.
	if ( results.length === 1 && result.innerBlocks.length === source.length ) {
		return result;
	}

	// If we are transforming one block to multiple blocks or multiple blocks to one block,
	// we ignore the metadata during the transform.
	if (
		( results.length === 1 && source.length > 1 ) ||
		( results.length > 1 && source.length === 1 )
	) {
		return result;
	}

	// If we are transforming multiple blocks to multiple blocks with different counts,
	// we ignore the metadata during the transform.
	if (
		results.length > 1 &&
		source.length > 1 &&
		results.length !== source.length
	) {
		return result;
	}

	const sourceMetadata = source[ index ]?.attributes?.metadata;

	if ( ! sourceMetadata ) {
		return result;
	}

	const preservedMetadata = {};

	// Notes
	if ( sourceMetadata.noteId && ! result.attributes?.metadata?.noteId ) {
		preservedMetadata.noteId = sourceMetadata.noteId;
	}

	// Custom name
	if (
		sourceMetadata.name &&
		! result.attributes?.metadata?.name &&
		hasBlockSupport( result.name, 'renaming', true )
	) {
		preservedMetadata.name = sourceMetadata.name;
	}

	// Block visibility
	if (
		sourceMetadata.blockVisibility !== undefined &&
		! result.attributes?.metadata?.blockVisibility &&
		hasBlockSupport( result.name, 'blockVisibility', true )
	) {
		preservedMetadata.blockVisibility = sourceMetadata.blockVisibility;
	}

	if ( Object.keys( preservedMetadata ).length > 0 ) {
		return {
			...result,
			attributes: {
				...result.attributes,
				metadata: {
					...result.attributes.metadata,
					...preservedMetadata,
				},
			},
		};
	}
	return result;
}

addFilter(
	'blocks.registerBlockType',
	'core/metadata/addMetaAttribute',
	addMetaAttribute
);

addFilter(
	'blocks.switchToBlockType.transformedBlock',
	'core/metadata/addTransforms',
	addTransforms
);
