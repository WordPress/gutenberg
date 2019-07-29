/**
 * External dependencies
 */
import memoize from 'memize';
import { kebabCase, startCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, Children, cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InspectorControls from '../inspector-controls';
import PanelColorSettings from '../panel-color-settings';
import ContrastChecker from '../contrast-checker';
import { useBlockEditContext } from '../block-edit';

const InspectorControlsColorPanel = ( {
	title,
	colorSettings,
	contrastCheckerProps,
	components,
	panelChildren,
} ) => (
	<InspectorControls>
		<PanelColorSettings
			title={ title }
			initialOpen={ false }
			colorSettings={ colorSettings }
		>
			{ contrastCheckerProps &&
				components.map( ( Component ) => (
					<ContrastChecker
						key={ Component.displayName }
						textColor={ Component.color }
						{ ...contrastCheckerProps }
					/>
				) ) }
			{ typeof panelChildren === 'function' ?
				panelChildren( components ) :
				panelChildren }
		</PanelColorSettings>
	</InspectorControls>
);

export default function useColors(
	colorConfigs,
	{ panelTitle = __( 'Color Settings' ), contrastCheckerProps, panelChildren } = {
		panelTitle: __( 'Color Settings' ),
	},
	deps = []
) {
	const { attributes, setAttributes } = useBlockEditContext();

	const createComponent = useMemo(
		() =>
			memoize(
				( attribute, color ) => ( { children } ) =>
					// Clone children, setting the style attribute from the color configuration,
					// if not already set explicitly through props.
					Children.map( children, ( child ) =>
						cloneElement( child, {
							className: color ?
								`${ child.props.className } has-${ kebabCase( attribute ) }` :
								child.props.className,
							style: { [ attribute ]: color, ...child.props.style },
						} )
					),
				{ maxSize: colorConfigs.length }
			),
		[ colorConfigs.length ]
	);
	const createSetColor = useMemo(
		() =>
			memoize( ( name ) => ( newColor ) => setAttributes( { [ name ]: newColor } ), {
				maxSize: colorConfigs.length,
			} ),
		[ setAttributes, colorConfigs.length ]
	);

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
			acc[ componentName ].displayName = componentName;
			acc[ componentName ].color = color;
			acc[ componentName ].setColor = createSetColor( name );

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
					contrastCheckerProps={ contrastCheckerProps }
					components={ Object.values( components ) }
					panelChildren={ panelChildren }
				/>
			),
		};
	}, [ attributes, setAttributes, ...deps ] );
}
