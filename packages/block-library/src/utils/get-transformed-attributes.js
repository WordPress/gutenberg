/**
 * WordPress dependencies
 */
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';

// Fixed until an opt-in mechanism is implemented.
const BLOCK_BINDINGS_SUPPORTED_BLOCKS = [
	'core/paragraph',
	'core/heading',
	'core/image',
	'core/button',
];

/**
 * Transform block support attributes and metadata during block transforms.
 *
 * @param {Object}   attributes       Original attributes from the block being transformed.
 * @param {string}   newBlockName     Name of the target block after transformation.
 * @param {Function} bindingsCallback Optional callback to transform the `bindings` property object.
 * @return {Object} New attributes object with preserved block support attributes and metadata.
 */
export function getTransformedAttributes(
	attributes,
	newBlockName,
	bindingsCallback = null
) {
	if ( ! attributes ) {
		return undefined;
	}

	const newBlockType = getBlockType( newBlockName );
	if ( ! newBlockType ) {
		return undefined;
	}

	const transformedAttributes = {};

	// Handle attributes derived from block support.
	if (
		hasBlockSupport( newBlockType, 'allowedBlocks' ) &&
		attributes.allowedBlocks
	) {
		transformedAttributes.allowedBlocks = attributes.allowedBlocks;
	}
	if ( hasBlockSupport( newBlockType, 'anchor' ) && attributes.id ) {
		transformedAttributes.id = attributes.id;
	}
	if (
		hasBlockSupport( newBlockType, 'ariaLabel' ) &&
		attributes.ariaLabel
	) {
		transformedAttributes.ariaLabel = attributes.ariaLabel;
	}
	if (
		hasBlockSupport( newBlockType, 'className' ) &&
		attributes.className
	) {
		transformedAttributes.className = attributes.className;
	}

	// Handle metadata transformation.
	if ( attributes.metadata ) {
		const transformedMetadata = [];
		// If it support bindings, and there is a transform bindings callback, add the `id` and `bindings` properties.
		if (
			BLOCK_BINDINGS_SUPPORTED_BLOCKS.includes( newBlockName ) &&
			bindingsCallback
		) {
			transformedMetadata.push( 'id', 'bindings' );
		}

		// Handle metadata properties derived from block support.
		if ( hasBlockSupport( newBlockType, 'renaming', true ) ) {
			transformedMetadata.push( 'name' );
		}
		if ( hasBlockSupport( newBlockType, 'blockVisibility', true ) ) {
			transformedMetadata.push( 'blockVisibility' );
		}

		// Experimental "Note" feature.
		if ( window?.__experimentalEnableBlockComment ) {
			transformedMetadata.push( 'commentId' );
		}

		// Only process metadata if there are supported properties.
		if ( transformedMetadata.length > 0 ) {
			const newMetadata = Object.entries( attributes.metadata ).reduce(
				( obj, [ prop, value ] ) => {
					// If prop is not supported, don't add it to the new metadata object.
					if ( ! transformedMetadata.includes( prop ) ) {
						return obj;
					}
					obj[ prop ] =
						prop === 'bindings' ? bindingsCallback( value ) : value;
					return obj;
				},
				{}
			);

			// Only add metadata if object is not empty.
			if ( Object.keys( newMetadata ).length > 0 ) {
				transformedAttributes.metadata = newMetadata;
			}
		}
	}

	if ( Object.keys( transformedAttributes ).length === 0 ) {
		return undefined;
	}

	return transformedAttributes;
}
