/**
 * WordPress dependencies
 */
import { getBlockType, store as blocksStore } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

/** @typedef {import('@wordpress/compose').WPHigherOrderComponent} WPHigherOrderComponent */
/** @typedef {import('@wordpress/blocks').WPBlockSettings} WPBlockSettings */

/**
 * Given a binding of block attributes, returns a higher order component that
 * overrides its `attributes` and `setAttributes` props to sync any changes needed.
 *
 * @return {WPHigherOrderComponent} Higher-order component.
 */

export const BLOCK_BINDINGS_ALLOWED_BLOCKS = {
	'core/paragraph': [ 'content' ],
	'core/heading': [ 'content' ],
	'core/image': [ 'url', 'title', 'alt' ],
	'core/button': [ 'url', 'text', 'linkTarget' ],
};

function UseSourceComponent( {
	blockBindingsSources,
	binding,
	blockProps,
	onLoad,
	htmlAttribute,
} ) {
	const { source: sourceName, args } = binding;
	const { placeholder, value: sourceValue } =
		blockBindingsSources[ sourceName ]?.useSource( blockProps, args ) ?? {};

	useEffect( () => {
		// If the attribute is `src` or `href`, a placeholder can't be used because it is not a valid url.
		// Adding this workaround until attributes and metadata fields types are improved and include `url`.
		const placeholderValue =
			htmlAttribute === 'src' || htmlAttribute === 'href'
				? null
				: placeholder;
		onLoad( sourceValue ? sourceValue : placeholderValue );
	}, [] );

	return null;
}

const createEditFunctionWithBindingsAttribute = () =>
	createHigherOrderComponent(
		( BlockEdit ) => ( props ) => {
			const { name: blockName, attributes } = props;
			const blockBindingsSources = unlock(
				useSelect( blocksStore )
			).getAllBlockBindingsSources();
			const blockType = getBlockType( blockName );
			const [ attributesWithBindings, setAttributesWithBindings ] =
				useState( attributes );

			const updateAttributesWithBindings = useCallback(
				( attributeName, newValue ) => {
					if ( newValue )
						setAttributesWithBindings( ( prev ) => ( {
							...prev,
							[ attributeName ]: newValue,
						} ) );
				},
				[]
			);

			return (
				<>
					{ attributes?.metadata?.bindings ? (
						<>
							{ Object.entries(
								attributes.metadata.bindings
							).map( ( [ attributeName, binding ] ) => {
								if (
									! BLOCK_BINDINGS_ALLOWED_BLOCKS[
										blockName
									].includes( attributeName )
								) {
									return null;
								}
								const htmlAttribute =
									blockType.attributes[ attributeName ]
										.attribute;
								return (
									<UseSourceComponent
										key={ attributeName }
										blockBindingsSources={
											blockBindingsSources
										}
										binding={ binding }
										blockProps={ props }
										htmlAttribute={ htmlAttribute }
										onLoad={ ( newAttributeValue ) => {
											updateAttributesWithBindings(
												attributeName,
												newAttributeValue
											);
										} }
									/>
								);
							} ) }
							<BlockEdit
								key="edit"
								{ ...props }
								attributes={ attributesWithBindings }
							/>
						</>
					) : (
						<BlockEdit key="edit" { ...props } />
					) }
				</>
			);
		},
		'useBoundAttributes'
	);

/**
 * Filters a registered block's settings to enhance a block's `edit` component
 * to upgrade bound attributes.
 *
 * @param {WPBlockSettings} settings Registered block settings.
 *
 * @return {WPBlockSettings} Filtered block settings.
 */
function shimAttributeSource( settings ) {
	if ( ! ( settings.name in BLOCK_BINDINGS_ALLOWED_BLOCKS ) ) {
		return settings;
	}
	settings.edit = createEditFunctionWithBindingsAttribute()( settings.edit );

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/editor/custom-sources-backwards-compatibility/shim-attribute-source',
	shimAttributeSource
);
