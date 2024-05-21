/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useRegistry, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
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

const BLOCK_BINDINGS_ALLOWED_BLOCKS = {
	'core/paragraph': [ 'content' ],
	'core/heading': [ 'content' ],
	'core/image': [ 'id', 'url', 'title', 'alt' ],
	'core/button': [ 'url', 'text', 'linkTarget', 'rel' ],
};

/**
 * Based on the given block name,
 * check if it is possible to bind the block.
 *
 * @param {string} blockName - The block name.
 * @return {boolean} Whether it is possible to bind the block to sources.
 */
export function canBindBlock( blockName ) {
	return blockName in BLOCK_BINDINGS_ALLOWED_BLOCKS;
}

/**
 * Based on the given block name and attribute name,
 * check if it is possible to bind the block attribute.
 *
 * @param {string} blockName     - The block name.
 * @param {string} attributeName - The attribute name.
 * @return {boolean} Whether it is possible to bind the block attribute.
 */
export function canBindAttribute( blockName, attributeName ) {
	return (
		canBindBlock( blockName ) &&
		BLOCK_BINDINGS_ALLOWED_BLOCKS[ blockName ].includes( attributeName )
	);
}

export const withBlockBindingSupport = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const registry = useRegistry();
		const sources = useSelect( ( select ) =>
			unlock( select( blocksStore ) ).getAllBlockBindingsSources()
		);
		const bindings = props.attributes.metadata?.bindings;
		const { name, clientId, context } = props;
		const boundAttributes = useSelect( () => {
			if ( ! bindings ) {
				return;
			}

			const attributes = {};

			for ( const [ attributeName, boundAttribute ] of Object.entries(
				bindings
			) ) {
				const source = sources[ boundAttribute.source ];
				if (
					! source?.getValue ||
					! canBindAttribute( name, attributeName )
				) {
					continue;
				}

				const args = {
					registry,
					context,
					clientId,
					attributeName,
					args: boundAttribute.args,
				};

				attributes[ attributeName ] = source.getValue( args );

				if ( attributes[ attributeName ] === undefined ) {
					if ( attributeName === 'url' ) {
						attributes[ attributeName ] = null;
					} else {
						attributes[ attributeName ] =
							source.getPlaceholder?.( args );
					}
				}
			}

			return attributes;
		}, [ bindings, name, clientId, context, registry, sources ] );

		const { setAttributes } = props;

		const _setAttributes = useCallback(
			( nextAttributes ) => {
				registry.batch( () => {
					if ( ! bindings ) {
						setAttributes( nextAttributes );
						return;
					}

					const keptAttributes = { ...nextAttributes };
					const updatesBySource = new Map();

					// Loop only over the updated attributes to avoid modifying the bound ones that haven't changed.
					for ( const [ attributeName, newValue ] of Object.entries(
						keptAttributes
					) ) {
						if (
							! bindings[ attributeName ] ||
							! canBindAttribute( name, attributeName )
						) {
							continue;
						}

						const source =
							sources[ bindings[ attributeName ].source ];
						if ( ! source?.setValue && ! source?.setValues ) {
							continue;
						}
						updatesBySource.set( source, {
							...updatesBySource.get( source ),
							[ attributeName ]: newValue,
						} );
						delete keptAttributes[ attributeName ];
					}

					if ( updatesBySource.size ) {
						for ( const [
							source,
							attributes,
						] of updatesBySource ) {
							if ( source.setValues ) {
								source.setValues( {
									registry,
									context,
									clientId,
									attributes,
								} );
							} else {
								for ( const [
									attributeName,
									value,
								] of Object.entries( attributes ) ) {
									source.setValue( {
										registry,
										context,
										clientId,
										attributeName,
										args: bindings[ attributeName ].args,
										value,
									} );
								}
							}
						}
					}

					if ( Object.keys( keptAttributes ).length ) {
						setAttributes( keptAttributes );
					}
				} );
			},
			[
				registry,
				bindings,
				name,
				clientId,
				context,
				setAttributes,
				sources,
			]
		);

		return (
			<>
				<BlockEdit
					{ ...props }
					attributes={ { ...props.attributes, ...boundAttributes } }
					setAttributes={ _setAttributes }
				/>
			</>
		);
	},
	'withBlockBindingSupport'
);

/**
 * Filters a registered block's settings to enhance a block's `edit` component
 * to upgrade bound attributes.
 *
 * @param {WPBlockSettings} settings - Registered block settings.
 * @param {string}          name     - Block name.
 * @return {WPBlockSettings} Filtered block settings.
 */
function shimAttributeSource( settings, name ) {
	if ( ! canBindBlock( name ) ) {
		return settings;
	}

	return {
		...settings,
		edit: withBlockBindingSupport( settings.edit ),
	};
}

addFilter(
	'blocks.registerBlockType',
	'core/editor/custom-sources-backwards-compatibility/shim-attribute-source',
	shimAttributeSource
);
