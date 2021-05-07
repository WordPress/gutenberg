/**
 * External dependencies
 */
import memoize from 'memize';
import classnames from 'classnames';
import { kebabCase, camelCase, castArray, startCase, isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useCallback,
	useMemo,
	useEffect,
	Children,
	cloneElement,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import InspectorControls from '../inspector-controls';
import { useBlockEditContext } from '../block-edit';
import ColorPanel from './color-panel';
import useThemeSetting from '../use-theme-setting';
import { store as blockEditorStore } from '../../store';

function getComputedStyle( node ) {
	return node.ownerDocument.defaultView.getComputedStyle( node );
}

const DEFAULT_COLORS = [];

const COMMON_COLOR_LABELS = {
	textColor: __( 'Text color' ),
	backgroundColor: __( 'Background color' ),
};

const InspectorControlsColorPanel = ( props ) => (
	<InspectorControls>
		<ColorPanel { ...props } />
	</InspectorControls>
);

export default function __experimentalUseColors(
	colorConfigs,
	{
		panelTitle = __( 'Color' ),
		colorPanelProps,
		contrastCheckers,
		panelChildren,
		colorDetector: {
			targetRef,
			backgroundColorTargetRef = targetRef,
			textColorTargetRef = targetRef,
		} = {},
	} = {
		panelTitle: __( 'Color' ),
	},
	deps = []
) {
	const { clientId } = useBlockEditContext();
	const settingsColors = useThemeSetting( 'color.palette' ) || DEFAULT_COLORS;
	const { attributes } = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			return {
				attributes: getBlockAttributes( clientId ),
			};
		},
		[ clientId ]
	);
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const setAttributes = useCallback(
		( newAttributes ) => updateBlockAttributes( clientId, newAttributes ),
		[ updateBlockAttributes, clientId ]
	);

	const createComponent = useMemo(
		() =>
			memoize(
				(
					name,
					property,
					className,
					color,
					colorValue,
					customColor
				) => ( {
					children,
					className: componentClassName = '',
					style: componentStyle = {},
				} ) => {
					let colorStyle = {};
					if ( color ) {
						colorStyle = { [ property ]: colorValue };
					} else if ( customColor ) {
						colorStyle = { [ property ]: customColor };
					}
					const extraProps = {
						className: classnames( componentClassName, {
							[ `has-${ kebabCase( color ) }-${ kebabCase(
								property
							) }` ]: color,
							[ className || `has-${ kebabCase( name ) }` ]:
								color || customColor,
						} ),
						style: {
							...colorStyle,
							...componentStyle,
						},
					};

					if ( isFunction( children ) ) {
						return children( extraProps );
					}

					return (
						// Clone children, setting the style property from the color configuration,
						// if not already set explicitly through props.
						Children.map( children, ( child ) => {
							return cloneElement( child, {
								className: classnames(
									child.props.className,
									extraProps.className
								),
								style: {
									...extraProps.style,
									...( child.props.style || {} ),
								},
							} );
						} )
					);
				},
				{ maxSize: colorConfigs.length }
			),
		[ colorConfigs.length ]
	);
	const createSetColor = useMemo(
		() =>
			memoize(
				( name, colors ) => ( newColor ) => {
					const color = colors.find(
						( _color ) => _color.color === newColor
					);
					setAttributes( {
						[ color
							? camelCase( `custom ${ name }` )
							: name ]: undefined,
					} );
					setAttributes( {
						[ color
							? name
							: camelCase( `custom ${ name }` ) ]: color
							? color.slug
							: newColor,
					} );
				},
				{
					maxSize: colorConfigs.length,
				}
			),
		[ setAttributes, colorConfigs.length ]
	);

	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedColor, setDetectedColor ] = useState();

	useEffect( () => {
		if ( ! contrastCheckers ) {
			return undefined;
		}
		let needsBackgroundColor = false;
		let needsColor = false;
		for ( const { backgroundColor, textColor } of castArray(
			contrastCheckers
		) ) {
			if ( ! needsBackgroundColor ) {
				needsBackgroundColor = backgroundColor === true;
			}
			if ( ! needsColor ) {
				needsColor = textColor === true;
			}
			if ( needsBackgroundColor && needsColor ) {
				break;
			}
		}

		if ( needsColor ) {
			setDetectedColor(
				getComputedStyle( textColorTargetRef.current ).color
			);
		}

		if ( needsBackgroundColor ) {
			let backgroundColorNode = backgroundColorTargetRef.current;
			let backgroundColor = getComputedStyle( backgroundColorNode )
				.backgroundColor;
			while (
				backgroundColor === 'rgba(0, 0, 0, 0)' &&
				backgroundColorNode.parentNode &&
				backgroundColorNode.parentNode.nodeType ===
					backgroundColorNode.parentNode.ELEMENT_NODE
			) {
				backgroundColorNode = backgroundColorNode.parentNode;
				backgroundColor = getComputedStyle( backgroundColorNode )
					.backgroundColor;
			}

			setDetectedBackgroundColor( backgroundColor );
		}
	}, [
		colorConfigs.reduce(
			( acc, colorConfig ) =>
				`${ acc } | ${ attributes[ colorConfig.name ] } | ${
					attributes[ camelCase( `custom ${ colorConfig.name }` ) ]
				}`,
			''
		),
		...deps,
	] );

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

				panelLabel = colorConfig.label ||
					COMMON_COLOR_LABELS[ name ] ||
					startCase( name ), // E.g. 'Background color'.
				componentName = startCase( name ).replace( /\s/g, '' ), // E.g. 'BackgroundColor'.

				color = colorConfig.color,
				colors = settingsColors,
			} = {
				...colorConfig,
				color: attributes[ colorConfig.name ],
			};

			const customColor = attributes[ camelCase( `custom ${ name }` ) ];
			// We memoize the non-primitives to avoid unnecessary updates
			// when they are used as props for other components.
			const _color = customColor
				? undefined
				: colors.find( ( __color ) => __color.slug === color );
			acc[ componentName ] = createComponent(
				name,
				property,
				className,
				color,
				_color && _color.color,
				customColor
			);
			acc[ componentName ].displayName = componentName;
			acc[ componentName ].color = customColor
				? customColor
				: _color && _color.color;
			acc[ componentName ].slug = color;
			acc[ componentName ].setColor = createSetColor( name, colors );

			colorSettings[ componentName ] = {
				value: _color
					? _color.color
					: attributes[ camelCase( `custom ${ name }` ) ],
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
			initialOpen: false,
			colorSettings,
			colorPanelProps,
			contrastCheckers,
			detectedBackgroundColor,
			detectedColor,
			panelChildren,
		};
		return {
			...components,
			ColorPanel: <ColorPanel { ...wrappedColorPanelProps } />,
			InspectorControlsColorPanel: (
				<InspectorControlsColorPanel { ...wrappedColorPanelProps } />
			),
		};
	}, [
		attributes,
		setAttributes,
		detectedColor,
		detectedBackgroundColor,
		...deps,
	] );
}
