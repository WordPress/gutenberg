/**
 * WordPress dependencies
 */
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';

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

	// Handle attributes derived from block support. The custom class name and
	// allowed blocks attribute is handled separately.
	if ( hasBlockSupport( newBlockType, 'anchor' ) && attributes.anchor ) {
		transformedAttributes.anchor = attributes.anchor;
	}
	if (
		hasBlockSupport( newBlockType, 'ariaLabel' ) &&
		attributes.ariaLabel
	) {
		transformedAttributes.ariaLabel = attributes.ariaLabel;
	}

	// Handle metadata transformation.
	if ( attributes.metadata ) {
		// The metadata properties that should be preserved after the transform.
		// The noteId, name, and blockVisibility properties are separately handled
		// in the `core/metadata/addTransforms` hook.
		const transformedMetadata = [];

		// If there is a transform bindings callback, add the `id` and `bindings` properties.
		if ( bindingsCallback ) {
			transformedMetadata.push( 'id', 'bindings' );
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
