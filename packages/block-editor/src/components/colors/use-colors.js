/**
 * External dependencies
 */
import memoize from 'memize';
import classnames from 'classnames';
import { map, kebabCase, camelCase, startCase } from 'lodash';

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
	useRef,
} from '@wordpress/element';
import { withFallbackStyles } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PanelColorSettings from '../panel-color-settings';
import ContrastChecker from '../contrast-checker';
import InspectorControls from '../inspector-controls';
import { useBlockEditContext } from '../block-edit';

/**
 * Browser dependencies
 */
const { getComputedStyle } = window;

const DEFAULT_COLORS = [];

const resolveContrastCheckerColor = ( color, colorSettings, detectedColor ) => {
	if ( typeof color === 'function' ) {
		return color( colorSettings );
	} else if ( color === true ) {
		return detectedColor;
	}
	return color;
};

const ColorPanel = ( {
	title,
	colorSettings,
	colorPanelProps,
	contrastCheckers,
	detectedBackgroundColor,
	panelChildren,
} ) => (
	<PanelColorSettings
		title={ title }
		initialOpen={ false }
		colorSettings={ Object.values( colorSettings ) }
		{ ...colorPanelProps }
	>
		{ contrastCheckers &&
			( Array.isArray( contrastCheckers ) ?
				contrastCheckers.map( ( { backgroundColor, textColor, ...rest } ) => {
					backgroundColor = resolveContrastCheckerColor(
						backgroundColor,
						colorSettings,
						detectedBackgroundColor
					);
					textColor = resolveContrastCheckerColor( textColor, colorSettings );
					return (
						<ContrastChecker
							key={ `${ backgroundColor }-${ textColor }` }
							backgroundColor={ backgroundColor }
							textColor={ textColor }
							{ ...rest }
						/>
					);
				} ) :
				map( colorSettings, ( { value } ) => {
					let { backgroundColor, textColor } = contrastCheckers;
					backgroundColor = resolveContrastCheckerColor(
						backgroundColor || value,
						colorSettings,
						detectedBackgroundColor
					);
					textColor = resolveContrastCheckerColor(
						textColor || value,
						colorSettings
					);
					return (
						<ContrastChecker
							{ ...contrastCheckers }
							key={ `${ backgroundColor }-${ textColor }` }
							backgroundColor={ backgroundColor }
							textColor={ textColor }
						/>
					);
				} ) ) }
		{ typeof panelChildren === 'function' ?
			panelChildren( colorSettings ) :
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
		contrastCheckers,
		panelChildren,
	} = {
		panelTitle: __( 'Color Settings' ),
	},
	deps = []
) {
	const { clientId } = useBlockEditContext();
	const { attributes, settingsColors } = useSelect(
		( select ) => {
			const { getBlockAttributes, getSettings } = select( 'core/block-editor' );
			const colors = getSettings().colors;
			return {
				attributes: getBlockAttributes( clientId ),
				settingsColors: ! colors || colors === true ? DEFAULT_COLORS : colors,
			};
		},
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
				( name, property, className, color, colorValue, customColor ) => ( {
					children,
					className: componentClassName = '',
					style: componentStyle = {},
				} ) =>
					// Clone children, setting the style property from the color configuration,
					// if not already set explicitly through props.
					Children.map( children, ( child ) => {
						let colorStyle = {};
						if ( color ) {
							colorStyle = { [ property ]: colorValue };
						} else if ( customColor ) {
							colorStyle = { [ property ]: customColor };
						}

						return cloneElement( child, {
							className: classnames( componentClassName, child.props.className, {
								[ `has-${ kebabCase( color ) }-${ kebabCase( property ) }` ]: color,
								[ className || `has-${ kebabCase( name ) }` ]: color || customColor,
							} ),
							style: {
								...colorStyle,
								...componentStyle,
								...( child.props.style || {} ),
							},
						} );
					} ),
				{ maxSize: colorConfigs.length }
			),
		[ colorConfigs.length ]
	);
	const createSetColor = useMemo(
		() =>
			memoize(
				( name, colors ) => ( newColor ) => {
					const color = colors.find( ( _color ) => _color.color === newColor );
					setAttributes( {
						[ color ? camelCase( `custom ${ name }` ) : name ]: undefined,
					} );
					setAttributes( {
						[ color ? name : camelCase( `custom ${ name }` ) ]: color ?
							color.slug :
							newColor,
					} );
				},
				{
					maxSize: colorConfigs.length,
				}
			),
		[ setAttributes, colorConfigs.length ]
	);

	const detectedBackgroundColorRef = useRef();
	const BackgroundColorDetector = useMemo(
		() =>
			withFallbackStyles( ( node ) => {
				let backgroundColor = getComputedStyle( node ).backgroundColor;
				while ( backgroundColor === 'rgba(0, 0, 0, 0)' && node.parentNode ) {
					node = node.parentNode;
					backgroundColor = getComputedStyle( node ).backgroundColor;
				}
				detectedBackgroundColorRef.current = backgroundColor;
				return { backgroundColor };
			} )( () => <></> ),
		[
			colorConfigs.reduce(
				( acc, colorConfig ) =>
					`${ acc } | ${ attributes[ colorConfig.name ] } | ${
						attributes[ camelCase( `custom ${ colorConfig.name }` ) ]
					}`,
				''
			),
		]
	);

	return useMemo( () => {
		const colorSettings = {};

		const components = colorConfigs.reduce( ( acc, colorConfig ) => {
			if ( typeof colorConfig === 'string' ) {
				colorConfig = { name: colorConfig };
			}
			const {
				name, // E.g. 'backgroundColor'.
				property = name, // E.g. 'backgroundColor'.
				className,

				panelLabel = startCase( name ), // E.g. 'Background Color'.
				componentName = panelLabel.replace( /\s/g, '' ), // E.g. 'BackgroundColor'.

				color = colorConfig.color,
				colors = settingsColors,
			} = {
				...colorConfig,
				color: attributes[ colorConfig.name ],
			};

			// We memoize the non-primitives to avoid unnecessary updates
			// when they are used as props for other components.
			const _color = colors.find( ( __color ) => __color.slug === color );
			acc[ componentName ] = createComponent(
				name,
				property,
				className,
				color,
				_color && _color.color,
				attributes[ camelCase( `custom ${ name }` ) ]
			);
			acc[ componentName ].displayName = componentName;
			acc[ componentName ].color = color;
			acc[ componentName ].setColor = createSetColor( name, colors );

			colorSettings[ componentName ] = {
				value: _color ? _color.color : attributes[ camelCase( `custom ${ name }` ) ],
				onChange: acc[ componentName ].setColor,
				label: panelLabel,
				colors,
			};
			// These settings will be spread over the `colors` in
			// `colorPanelProps`, so we need to unset the key here,
			// if not set to an actual value, to avoid overwriting
			// an actual value in `colorPanelProps`.
			if ( ! colors ) {
				delete colorSettings[ componentName ].colors;
			}

			return acc;
		}, {} );

		const wrappedColorPanelProps = {
			title: panelTitle,
			colorSettings,
			colorPanelProps,
			contrastCheckers,
			detectedBackgroundColor: detectedBackgroundColorRef.current,
			panelChildren,
		};
		return {
			...components,
			ColorPanel: <ColorPanel { ...wrappedColorPanelProps } />,
			InspectorControlsColorPanel: (
				<InspectorControlsColorPanel { ...wrappedColorPanelProps } />
			),
			BackgroundColorDetector,
		};
	}, [ attributes, setAttributes, detectedBackgroundColorRef.current, ...deps ] );
}
