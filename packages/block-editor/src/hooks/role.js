/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';

const ROLE_SCHEMA = {
	type: 'string',
	source: 'attribute',
	attribute: 'role',
	selector: '*',
};

/**
 * Filters registered block settings, extending attributes with role.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addAttribute( settings ) {
	// Allow blocks to specify their own attribute definition with default values if needed.
	if ( settings?.attributes?.role?.type ) {
		return settings;
	}
	if ( hasBlockSupport( settings, 'role' ) ) {
		// Gracefully handle if settings.attributes is undefined.
		settings.attributes = {
			...settings.attributes,
			role: ROLE_SCHEMA,
		};
	}

	return settings;
}

/**
 * Override props assigned to save component to inject the role attribute, if block
 * supports roles. This is only applied if the block's save result is an
 * element and not a markup string.
 *
 * @param {Object} extraProps Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Current block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps( extraProps, blockType, attributes ) {
	if ( hasBlockSupport( blockType, 'role' ) ) {
		extraProps.role = attributes.role === '' ? null : attributes.role;
	}

	return extraProps;
}

addFilter( 'blocks.registerBlockType', 'core/role/attribute', addAttribute );
addFilter(
	'blocks.getSaveContent.extraProps',
	'core/role/save-props',
	addSaveProps
);
