/**
 * WordPress dependencies
 */
import { getBlockType, store as blocksStore } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { useBlockEditContext } from '../components/block-edit/context';
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

const createEditFunctionWithBindingsAttribute = () =>
	createHigherOrderComponent(
		( BlockEdit ) => ( props ) => {
			const { clientId, name: blockName } = useBlockEditContext();
			const blockBindingsSources = unlock(
				useSelect( blocksStore )
			).getAllBlockBindingsSources();
			const { getBlockAttributes } = useSelect( blockEditorStore );

			const updatedAttributes = getBlockAttributes( clientId );
			if ( updatedAttributes?.metadata?.bindings ) {
				Object.entries( updatedAttributes.metadata.bindings ).forEach(
					( [ attributeName, settings ] ) => {
						const source = blockBindingsSources[ settings.source ];

						if ( source && source.useSource ) {
							// Second argument (`updateMetaValue`) will be used to update the value in the future.
							const {
								placeholder,
								useValue: [ metaValue = null ] = [],
							} = source.useSource( props, settings.args );

							if ( placeholder && ! metaValue ) {
								// If the attribute is `src` or `href`, a placeholder can't be used because it is not a valid url.
								// Adding this workaround until attributes and metadata fields types are improved and include `url`.
								const htmlAttribute =
									getBlockType( blockName ).attributes[
										attributeName
									].attribute;
								if (
									htmlAttribute === 'src' ||
									htmlAttribute === 'href'
								) {
									updatedAttributes[ attributeName ] = null;
								} else {
									updatedAttributes[ attributeName ] =
										placeholder;
								}
							}

							if ( metaValue ) {
								updatedAttributes[ attributeName ] = metaValue;
							}
						}
					}
				);
			}

			return (
				<BlockEdit
					key="edit"
					{ ...props }
					attributes={ updatedAttributes }
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
