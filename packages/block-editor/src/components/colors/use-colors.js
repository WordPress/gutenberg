/**
 * External dependencies
 */
import memoize from 'memize';
import { kebabCase, startCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useCallback,
	useMemo,
	Children,
	cloneElement,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import PanelColorSettings from '../panel-color-settings';
import ContrastChecker from '../contrast-checker';
import InspectorControls from '../inspector-controls';
import { useBlockEditContext } from '../block-edit';

const ColorPanel = ( {
	title,
	colorSettings,
	colorPanelProps,
	contrastCheckerProps,
	components,
	panelChildren,
} ) => (
	<PanelColorSettings
		title={ title }
		initialOpen={ false }
		colorSettings={ colorSettings }
		{ ...colorPanelProps }
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
);
const InspectorControlsColorPanel = ( props ) => (
	<InspectorControls>
		<ColorPanel { ...props } />
	</InspectorControls>
);

export default function __experimentalUseColors(
	colorConfigs,
	{
		panelTitle = __( 'Color Settings' ),
		colorPanelProps,
		contrastCheckerProps,
		panelChildren,
	} = {
		panelTitle: __( 'Color Settings' ),
	},
	deps = []
) {
	const { clientId } = useBlockEditContext();
	const attributes = useSelect(
		( select ) => select( 'core/block-editor' ).getBlockAttributes( clientId ),
		[ clientId ]
	);
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );
	const setAttributes = useCallback(
		( newAttributes ) => updateBlockAttributes( clientId, newAttributes ),
		[ updateBlockAttributes, clientId ]
	);

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
				colors,
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

			const newSettingIndex =
				colorSettings.push( {
					value: color,
					onChange: acc[ componentName ].setColor,
					label: panelLabel,
					colors,
				} ) - 1;
			// These settings will be spread over the `colors` in
			// `colorPanelProps`, so we need to unset the key here,
			// if not set to an actual value, to avoid overwriting
			// an actual value in `colorPanelProps`.
			if ( ! colors ) {
				delete colorSettings[ newSettingIndex ].colors;
			}

			return acc;
		}, {} );

		const wrappedColorPanelProps = {
			title: panelTitle,
			colorSettings,
			colorPanelProps,
			contrastCheckerProps,
			components: Object.values( components ),
			panelChildren,
		};
		return {
			...components,
			ColorPanel: <ColorPanel { ...wrappedColorPanelProps } />,
			InspectorControlsColorPanel: (
				<InspectorControlsColorPanel { ...wrappedColorPanelProps } />
			),
		};
	}, [ attributes, setAttributes, ...deps ] );
}
