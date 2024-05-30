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
import {
	canBindBlock,
	canBindAttribute,
	getBoundAttributesValues,
} from '../utils/bindings';

/** @typedef {import('@wordpress/compose').WPHigherOrderComponent} WPHigherOrderComponent */
/** @typedef {import('@wordpress/blocks').WPBlockSettings} WPBlockSettings */

/**
 * Given a binding of block attributes, returns a higher order component that
 * overrides its `attributes` and `setAttributes` props to sync any changes needed.
 *
 * @return {WPHigherOrderComponent} Higher-order component.
 */

export const withBlockBindingSupport = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const registry = useRegistry();
		const {
			attributes: blockAttributes,
			name,
			clientId,
			context,
			setAttributes,
		} = props;
		const bindings = blockAttributes?.metadata?.bindings;

		// It seems if I don't wrap this in a useSelect, the reset in pattern overrides doesn't work as expected.
		const boundAttributes = useSelect( () => {
			return getBoundAttributesValues( clientId, context, registry );
		}, [ clientId, context, registry ] );

		const sources = unlock(
			registry.select( blocksStore )
		).getAllBlockBindingsSources();
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
					attributes={ { ...blockAttributes, ...boundAttributes } }
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
	'core/editor/use-bindings-attributes',
	shimAttributeSource
);
