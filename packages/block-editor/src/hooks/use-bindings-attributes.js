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
	'core/image': [ 'url', 'title', 'alt' ],
	'core/button': [ 'url', 'text', 'linkTarget' ],
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

		const boundAttributes = useSelect(
			( select ) => {
				const bindings = Object.fromEntries(
					Object.entries(
						props.attributes.metadata?.bindings || {}
					).filter( ( [ attrName ] ) =>
						canBindAttribute( props.name, attrName )
					)
				);

				if ( ! Object.keys( bindings ).length > 0 ) {
					return;
				}

				const blockBindingsSources = unlock(
					select( blocksStore )
				).getAllBlockBindingsSources();

				return Object.entries( bindings ).reduce(
					( accu, [ attrName, boundAttribute ] ) => {
						// Bail early if the block doesn't have a valid source handler.
						const source =
							blockBindingsSources[ boundAttribute.source ];

						if ( ! source?.getValue ) {
							return accu;
						}

						const args = {
							registry,
							context: props.context,
							clientId: props.clientId,
							attributeName: attrName,
							args: boundAttribute.args,
						};

						accu[ attrName ] = source.getValue( args );

						if ( accu[ attrName ] === undefined ) {
							if ( attrName === 'url' ) {
								accu[ attrName ] = null;
							} else {
								accu[ attrName ] =
									source.getPlaceholder?.( args );
							}
						}

						return accu;
					},
					{}
				);
			},
			[
				props.attributes.metadata?.bindings,
				props.name,
				props.context,
				props.clientId,
				registry,
			]
		);

		const { setAttributes } = props;

		const _setAttributes = useCallback(
			( nextAttributes ) => {
				const keptAttributes = { ...nextAttributes };
				registry.batch( () => {
					const bindings = Object.fromEntries(
						Object.entries(
							props.attributes.metadata?.bindings || {}
						).filter( ( [ attrName ] ) =>
							canBindAttribute( props.name, attrName )
						)
					);

					if ( ! Object.keys( bindings ).length > 0 ) {
						return setAttributes( nextAttributes );
					}

					const blockBindingsSources = unlock(
						registry.select( blocksStore )
					).getAllBlockBindingsSources();

					for ( const [ attributeKey, value ] of Object.entries(
						nextAttributes
					) ) {
						if ( bindings[ attributeKey ] ) {
							const source =
								blockBindingsSources[
									bindings[ attributeKey ].source
								];
							if ( source?.setValue ) {
								source.setValue( {
									registry,
									context: props.context,
									clientId: props.clientId,
									attributeName: attributeKey,
									value,
									args: bindings[ attributeKey ].args,
								} );
								delete keptAttributes[ attributeKey ];
							}
						}
					}

					setAttributes( keptAttributes );
				} );
			},
			[
				registry,
				props.attributes.metadata?.bindings,
				props.name,
				props.context,
				props.clientId,
				setAttributes,
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
