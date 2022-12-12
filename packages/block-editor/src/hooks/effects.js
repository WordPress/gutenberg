/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockEditorEffectsPanel from '../components/inspector-controls-tabs/effects-panel';
import { InspectorControls } from '../components';

/**
 * Filters registered block settings, extending attributes to include
 * `effect` attribute.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addAttributes( settings ) {
	settings.attributes = {
		...settings.attributes,
		effect: {
			type: 'string',
			source: 'attribute',
			attribute: 'data-effect',
		},
	};
	return settings;
}

/**
 * Override the default edit UI to include a new block inspector control for
 * assigning the effect value.
 *
 * @param {WPComponent} BlockEdit Original component.
 *
 * @return {WPComponent} Wrapped component.
 */
export const withInspectorControl = createHigherOrderComponent(
	( BlockEdit ) => {
		return ( props ) => {
			if ( props.isSelected ) {
				return (
					<>
						<BlockEdit { ...props } />
						<InspectorControls>
							<BlockEditorEffectsPanel
								clientId={ props.clientId }
							/>
						</InspectorControls>
					</>
				);
			}
			return <BlockEdit { ...props } />;
		};
	},
	'withInspectorControl'
);

/**
 * Override props assigned to save component to inject the `data-effect`
 * attribute.
 *
 * @param {Object} extraProps Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Current block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps( extraProps, blockType, attributes ) {
	if ( attributes.effect ) {
		extraProps[ 'data-effect' ] = attributes.effect;
	}

	return extraProps;
}

addFilter(
	'blocks.registerBlockType',
	'core/effects/addAttribute',
	addAttributes
);
addFilter(
	'editor.BlockEdit',
	'core/editor/effects/with-inspector-control',
	withInspectorControl
);

addFilter(
	'blocks.getSaveContent.extraProps',
	'core/effects/save-props',
	addSaveProps
);
