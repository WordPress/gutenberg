/**
 * WordPress dependencies
 */
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import { useRegistry } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

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
			( {
				name,
				attributes,
				setAttributes,
				context: { postType, postId },
				...props
			} ) => {
				const registry = useRegistry();
				const [ meta, setMeta ] = useEntityProp(
					'postType',
					postType,
					'meta',
					postId
				);

				const blockType = getBlockType( name );

				const mergedAttributes = useMemo( () => {
					if ( ! blockType.supports?.customSources ) {
						return attributes;
					}
					return {
						...attributes,
						...Object.fromEntries(
							Object.keys( blockType.supports.customSources ).map(
								( attributeName ) => {
									if (
										attributes.source?.[ attributeName ]
											?.type === 'meta'
									) {
										return [
											attributeName,
											meta?.[
												attributes.source?.[
													attributeName
												]?.name
											],
										];
									}
									return [
										attributeName,
										attributes[ attributeName ],
									];
								}
							)
						),
					};
				}, [ blockType.supports?.customSources, attributes, meta ] );

				return (
					<BlockEdit
						attributes={ mergedAttributes }
						setAttributes={ ( nextAttributes ) => {
							const nextMeta = Object.fromEntries(
								Object.entries( nextAttributes ?? {} )
									.filter(
										// Filter to intersection of keys between the updated
										// attributes and those with an associated meta key.
										( [ key ] ) =>
											blockType.supports?.customSources &&
											key in
												blockType.supports
													?.customSources &&
											attributes.source?.[ key ]?.type ===
												'meta'
									)
									.map( ( [ attributeKey, value ] ) => [
										// Rename the keys to the expected meta key name.
										attributes.source?.[ attributeKey ]
											?.name,
										value,
									] )
							);

							const updatedAttributes = Object.entries( nextMeta )
								.length
								? Object.fromEntries(
										Object.entries( nextAttributes ).filter(
											( [ key ] ) =>
												! (
													blockType.supports
														?.customSources &&
													key in
														blockType.supports
															?.customSources &&
													attributes.source?.[ key ]
														?.type === 'meta'
												)
										)
								  )
								: nextAttributes;

							registry.batch( () => {
								if ( Object.entries( nextMeta ).length ) {
									setMeta( nextMeta );
								}

								setAttributes( updatedAttributes );
							} );
						} }
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
