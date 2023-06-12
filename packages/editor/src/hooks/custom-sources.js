/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';
import { useRegistry } from '@wordpress/data';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import meta from '../attributes-custom-sources/meta';

/**
 * Filters registered block settings, extending attributes to include `style` attribute.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addAttribute( settings ) {
	if ( ! hasBlockSupport( settings, 'customSources' ) ) {
		return settings;
	}

	// Allow blocks to specify their own attribute definition with default values if needed.
	if ( ! settings.attributes.source ) {
		Object.assign( settings.attributes, {
			source: {
				type: 'object',
			},
		} );
	}

	return settings;
}

/** @typedef {import('@wordpress/compose').WPHigherOrderComponent} WPHigherOrderComponent */
/** @typedef {import('@wordpress/blocks').WPBlockSettings} WPBlockSettings */

/**
 * Given a mapping of attribute names (meta source attributes) to their
 * associated meta key, returns a higher order component that overrides its
 * `attributes` and `setAttributes` props to sync any changes with the edited
 * post's meta keys.
 *
 * @return {WPHigherOrderComponent} Higher-order component.
 */
const createEditFunctionWithCustomSources = () =>
	createHigherOrderComponent(
		( BlockEdit ) =>
			( { name, attributes, setAttributes, context, ...props } ) => {
				const registry = useRegistry();

				const {
					attributes: updatedAttributes,
					setAttributes: updatedSetAttributes,
				} = meta.useSource( {
					name,
					attributes,
					setAttributes,
					context,
				} );

				return (
					<BlockEdit
						attributes={ updatedAttributes }
						setAttributes={ ( newAttributes ) =>
							registry.batch( () =>
								updatedSetAttributes( newAttributes )
							)
						}
						{ ...props }
					/>
				);
			},
		'withCustomSources'
	);

/**
 * Filters a registered block's settings to enhance a block's `edit` component
 * to upgrade meta-sourced attributes to use the post's meta entity property.
 *
 * @param {WPBlockSettings} settings Registered block settings.
 *
 * @return {WPBlockSettings} Filtered block settings.
 */
function shimAttributeSource( settings ) {
	settings.edit = createEditFunctionWithCustomSources()( settings.edit );

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/editor/custom-sources-backwards-compatibility/shim-attribute-source',
	shimAttributeSource
);

addFilter(
	'blocks.registerBlockType',
	'core/custom-sources-v2/addAttribute',
	addAttribute
);
