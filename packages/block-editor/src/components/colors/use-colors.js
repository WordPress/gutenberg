/**
 * External dependencies
 */
import memoize from 'memize';
import { startCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { Children, cloneElement, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControls from '../inspector-controls';
import PanelColorSettings from '../panel-color-settings';
import { useBlockEditContext } from '../block-edit';

const createComponent = memoize( ( attribute, color ) => ( { children } ) =>
	// Clone children, setting the style attribute from the color configuration,
	// if not already set explicitly through props.
	Children.map( children, ( child ) =>
		cloneElement( child, {
			style: { [ attribute ]: color, ...child.props.style },
		} )
	)
);

const createSetColor = memoize( ( setAttributes, name ) => ( newColor ) =>
	setAttributes( { [ name ]: newColor } )
);

const InspectorControlsColorPanel = ( { title, colorSettings } ) => (
	<InspectorControls>
		<PanelColorSettings
			title={ title }
			initialOpen={ false }
			colorSettings={ colorSettings }
		/>
	</InspectorControls>
);

export default function useColors(
	colorConfigs,
	deps = [],
	panelTitle = __( 'Color Settings' )
) {
	const { attributes, setAttributes } = useBlockEditContext();

	return useMemo( () => {
		const colorSettings = [];

		const components = colorConfigs.reduce( ( acc, colorConfig ) => {
			if ( typeof colorConfig === 'string' ) {
				colorConfig = { name: colorConfig };
			}
			const {
				name, // E.g. 'backgroundColor'.
				attribute = name, // E.g. 'backgroundColor'.

				panelLabel = startCase( name ), // E.g. 'Background Color'.
				componentName = panelLabel.replace( /\s/g, '' ), // E.g. 'BackgroundColor'.

				color = colorConfig.color,
			} = {
				...colorConfig,
				color: attributes[ colorConfig.name ],
			};

			// We memoize the non-primitives to avoid unnecessary updates
			// when they are used as props for other components.
			acc[ componentName ] = createComponent( attribute, color );
			acc[ componentName ].color = color;
			acc[ componentName ].setColor = createSetColor( setAttributes, name );

			colorSettings.push( {
				value: color,
				onChange: acc[ componentName ].setColor,
				label: panelLabel,
			} );

			return acc;
		}, {} );

		return {
			...components,
			InspectorControlsColorPanel: (
				<InspectorControlsColorPanel
					title={ panelTitle }
					colorSettings={ colorSettings }
				/>
			),
		};
	}, [ attributes, setAttributes, ...deps ] );
}
