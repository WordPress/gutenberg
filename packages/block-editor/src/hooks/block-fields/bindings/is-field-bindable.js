/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';

/**
 * Check if a field supports bindings.
 *
 * @param {string} blockName The block type name.
 * @param {string} fieldId   The field/attribute identifier.
 * @return {boolean} Whether the field is bindable.
 */
export function isFieldBindable( blockName, fieldId ) {
	const blockType = getBlockType( blockName );
	const supportedAttrs =
		blockType?.supports?.__experimentalBlockBindingsSupportedAttributes;

	// Check if attribute is marked as bindable
	return (
		Array.isArray( supportedAttrs ) && supportedAttrs.includes( fieldId )
	);
}
