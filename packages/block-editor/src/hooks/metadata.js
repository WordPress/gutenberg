/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { getBlockSupport } from '@wordpress/blocks';

const META_ATTRIBUTE_NAME = 'metadata';

export function hasBlockMetadataSupport( blockType, feature = '' ) {
	// Only core blocks are allowed to use __experimentalMetadata until the fetaure is stablised.
	if ( ! blockType.name.startsWith( 'core/' ) ) {
		return false;
	}
	const support = getBlockSupport( blockType, '__experimentalMetadata' );
	return !! ( true === support || support?.[ feature ] );
}

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

	const supportsBlockNaming = hasBlockMetadataSupport(
		blockTypeSettings,
		'name'
	);

	if ( supportsBlockNaming ) {
		blockTypeSettings.attributes = {
			...blockTypeSettings.attributes,
			[ META_ATTRIBUTE_NAME ]: {
				type: 'object',
			},
		};
	}

	return blockTypeSettings;
}

export function addSaveProps( extraProps, blockType, attributes ) {
	if ( hasBlockMetadataSupport( blockType ) ) {
		extraProps[ META_ATTRIBUTE_NAME ] = attributes[ META_ATTRIBUTE_NAME ];
	}

	return extraProps;
}

addFilter(
	'blocks.registerBlockType',
	'core/metadata/addMetaAttribute',
	addMetaAttribute
);

addFilter(
	'blocks.getSaveContent.extraProps',
	'core/metadata/save-props',
	addSaveProps
);
