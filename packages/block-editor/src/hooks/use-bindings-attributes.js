/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useRegistry, useSelect } from '@wordpress/data';
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
const createEditFunctionWithBindingsAttribute = () =>
	createHigherOrderComponent(
		( BlockEdit ) => ( props ) => {
			const { clientId } = useBlockEditContext();

			const {
				getBlockBindingsSource,
				getBlockAttributes,
				updateBlockAttributes,
			} = useSelect( ( select ) => {
				return {
					getBlockBindingsSource: unlock( select( blockEditorStore ) )
						.getBlockBindingsSource,
					getBlockAttributes:
						select( blockEditorStore ).getBlockAttributes,
					updateBlockAttributes:
						select( blockEditorStore ).updateBlockAttributes,
				};
			}, [] );

			const updatedAttributes = getBlockAttributes( clientId );
			if ( updatedAttributes?.metadata?.bindings ) {
				Object.entries( updatedAttributes.metadata.bindings ).forEach(
					( [ attributeName, settings ] ) => {
						const source = getBlockBindingsSource(
							settings.source.name
						);

						if ( source ) {
							// Second argument (`setValue`) will be used to update the value in the future.
							const [ value ] = source.useSource(
								props,
								settings.source.attributes
							);
							updatedAttributes[ attributeName ] = value;
						}
					}
				);
			}

			const registry = useRegistry();

			return (
				<>
					<BlockEdit
						key="edit"
						attributes={ updatedAttributes }
						setAttributes={ ( newAttributes, blockId ) =>
							registry.batch( () =>
								updateBlockAttributes( blockId, newAttributes )
							)
						}
						{ ...props }
					/>
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
	settings.edit = createEditFunctionWithBindingsAttribute()( settings.edit );

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/editor/custom-sources-backwards-compatibility/shim-attribute-source',
	shimAttributeSource
);
