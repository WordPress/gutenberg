/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useRegistry, useSelect } from '@wordpress/data';
import { useMemo, useCallback } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';

/** @typedef {import('@wordpress/compose').WPHigherOrderComponent} WPHigherOrderComponent */
/** @typedef {import('@wordpress/blocks').WPBlockSettings} WPBlockSettings */

/**
 * Given a binding of block attributes, returns a higher order component that
 * overrides its `attributes` and `setAttributes` props to sync any changes needed.
 *
 * @return {WPHigherOrderComponent} Higher-order component.
 */

const BLOCK_BINDINGS_ALLOWED_BLOCKS = {
	'core/paragraph': [ 'content' ],
	'core/heading': [ 'content' ],
	'core/image': [ 'url', 'title', 'alt' ],
	'core/button': [ 'url', 'text', 'linkTarget' ],
};

const createEditFunctionWithBindingsAttribute = () =>
	createHigherOrderComponent(
		( BlockEdit ) => ( props ) => {
			const { name, attributes, setAttributes, ...otherProps } = props;
			const { getBlockBindingsSource } = unlock(
				useSelect( blockEditorStore )
			);

			const blockType = getBlockType( name );

			const boundAttributes = {};
			if ( attributes?.metadata?.bindings ) {
				Object.entries( attributes?.metadata?.bindings ).forEach(
					( [ attribute, binding ] ) => {
						boundAttributes[ attribute ] = getBlockBindingsSource(
							binding.source
						).useSource( props, binding.args );
					}
				);
			}

			const attributesWithBindings = useMemo( () => {
				return {
					...attributes,
					...Object.fromEntries(
						BLOCK_BINDINGS_ALLOWED_BLOCKS[ name ].map(
							( attributeName ) => {
								// Check bindings.
								if ( boundAttributes[ attributeName ] ) {
									const {
										placeholder,
										useValue: [ sourceValue = null ] = [],
									} = boundAttributes[ attributeName ];

									const blockTypeAttribute =
										blockType.attributes[ attributeName ];

									if ( placeholder && ! sourceValue ) {
										// If the attribute is `src` or `href`, a placeholder can't be used because it is not a valid url.
										// Adding this workaround until attributes and metadata fields types are improved and include `url`.

										const htmlAttribute =
											blockTypeAttribute.attribute;
										if (
											htmlAttribute === 'src' ||
											htmlAttribute === 'href'
										) {
											return [ attributeName, null ];
										}
										return [ attributeName, placeholder ];
									}

									if ( sourceValue ) {
										// TODO: If it is rich-text, I think we can't edit it this way.
										return [ attributeName, sourceValue ];
									}
								}
								return [
									attributeName,
									attributes[ attributeName ],
								];
							}
						)
					),
				};
			}, [ attributes, blockType.attributes, boundAttributes, name ] );

			const updatedSetAttributes = useCallback(
				( nextAttributes ) => {
					Object.entries( nextAttributes ?? {} )
						.filter(
							( [ attribute ] ) => attribute in boundAttributes
						)
						.forEach( ( [ attribute, value ] ) => {
							const {
								useValue: [ , setSourceValue = null ] = [],
							} = boundAttributes[ attribute ];
							if ( setSourceValue ) {
								setSourceValue( value );
							}
						} );
					setAttributes( nextAttributes );
				},
				[ setAttributes, attributesWithBindings, boundAttributes ]
			);

			const registry = useRegistry();

			return (
				<BlockEdit
					attributes={ attributesWithBindings }
					setAttributes={ ( newAttributes ) => {
						registry.batch( () =>
							updatedSetAttributes( newAttributes )
						);
					} }
					{ ...otherProps }
				/>
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

// Add the context to all blocks.
addFilter(
	'blocks.registerBlockType',
	'core/block-bindings-ui',
	( settings, name ) => {
		if ( ! ( name in BLOCK_BINDINGS_ALLOWED_BLOCKS ) ) {
			return settings;
		}
		const contextItems = [ 'postId', 'postType', 'queryId' ];
		const usesContextArray = settings.usesContext;
		const oldUsesContextArray = new Set( usesContextArray );
		contextItems.forEach( ( item ) => {
			if ( ! oldUsesContextArray.has( item ) ) {
				usesContextArray.push( item );
			}
		} );
		settings.usesContext = usesContextArray;
		return settings;
	}
);
