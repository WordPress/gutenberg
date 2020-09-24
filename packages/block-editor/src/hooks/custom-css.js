/**
 * External dependencies
 */
import { has, replace } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import { TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InspectorAdvancedControls from '../components/inspector-advanced-controls';

/**
 * Filters registered block settings, extending attributes to include `css`.
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
export function addAttribute( settings ) {
	// allow blocks to specify their own attribute definition with default values if needed.
	if ( has( settings.attributes, [ 'css', 'type' ] ) ) {
		return settings;
	}
	if ( hasBlockSupport( settings, 'customCSS' ) ) {
		// Gracefully handle if settings.attributes is undefined.
		settings.attributes = {
			...settings.attributes,
			css: {
				type: 'string',
			},
		};
	}

	return settings;
}

/**
 * Override the default edit UI to include new toolbar controls for block
 * alignment, if block defines support.
 *
 * @param  {Function} BlockEdit Original component
 * @return {Function}           Wrapped component
 */
export const withToolbarControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { name: blockName, attributes, clientId } = props;
		const hasSupport = hasBlockSupport( blockName, 'customCSS', false );

		const updateCustomCSS = ( css ) => {
			props.setAttributes( { css } );
		};

		useEffect( () => {
			if ( ! hasSupport && ! attributes.css ) {
				return;
			}
			const node = document.createElement( 'style' );
			node.innerHTML = replace(
				attributes.css,
				/:self/g,
				`[data-block="${ clientId }"]`
			);
			document.body.appendChild( node );

			return () => document.body.removeChild( node );
		}, [ hasSupport, attributes.css ] );

		return [
			hasSupport && (
				<InspectorAdvancedControls key="css-controls">
					<TextareaControl
						label={ __( 'Custom CSS' ) }
						help={ __(
							'Use :self selector to refer to the current block'
						) }
						value={ attributes.css || '' }
						onChange={ updateCustomCSS }
					/>
				</InspectorAdvancedControls>
			),
			<BlockEdit key="edit" { ...props } />,
		];
	},
	'withToolbarControls'
);

addFilter( 'blocks.registerBlockType', 'core/css/addAttribute', addAttribute );
addFilter(
	'editor.BlockEdit',
	'core/editor/css/with-toolbar-controls',
	withToolbarControls
);
