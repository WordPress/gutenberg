/**
 * External dependencies
 */
import memoize from 'memize';
import classnames from 'classnames';
import { kebabCase, camelCase, startCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
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
import FontSizePicker from './font-size-picker';
import InspectorControls from '../inspector-controls';
import { useBlockEditContext } from '../block-edit';

const DEFAULT_FONT_SIZES = [];

const COMMON_FONT_SIZE_LABELS = {
	fontSize: __( 'Preset Size' ),
};

const FontSizePanel = ( {
	title,
	initialOpen,
	fontSizeSettings,
	panelChildren,
} ) => (
	<PanelBody title={ title } initialOpen={ initialOpen }>
		{ fontSizeSettings.map( ( fontSizeSetting, i ) => (
			<FontSizePicker key={ i } { ...fontSizeSetting } />
		) ) }
		{ typeof panelChildren === 'function'
			? panelChildren()
			: panelChildren }
	</PanelBody>
);
const InspectorControlsFontSizePanel = ( props ) => (
	<InspectorControls>
		<FontSizePanel { ...props } />
	</InspectorControls>
);

export default function __experimentalUseFontSizes(
	fontSizeConfigs,
	{ panelTitle = __( 'Text settings' ), panelChildren } = {},
	deps = []
) {
	const { clientId } = useBlockEditContext();
	const { attributes, settingsFontSizes } = useSelect(
		( select ) => {
			const { getBlockAttributes, getSettings } = select(
				'core/block-editor'
			);
			const fontSizes = getSettings().fontSizes;
			return {
				attributes: getBlockAttributes( clientId ),
				settingsFontSizes:
					! fontSizes || fontSizes === true
						? DEFAULT_FONT_SIZES
						: fontSizes,
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
				(
					name,
					className,
					fontSize,
					fontSizeValue,
					customFontSize
				) => ( {
					children,
					className: componentClassName = '',
					style: componentStyle = {},
				} ) =>
					// Clone children, setting the style property from the font size configuration,
					// if not already set explicitly through props.
					Children.map( children, ( child ) => {
						let fontSizeStyle = {};
						if ( fontSize ) {
							fontSizeStyle = { fontSize: fontSizeValue };
						} else if ( customFontSize ) {
							fontSizeStyle = { fontSize: customFontSize };
						}

						return cloneElement( child, {
							className: classnames(
								componentClassName,
								child.props.className,
								{
									[ `has-${ kebabCase(
										fontSize
									) }-font-size` ]: fontSize,
									[ className ||
									`has-${ kebabCase( name ) }` ]:
										fontSize || customFontSize,
								}
							),
							style: {
								...fontSizeStyle,
								...componentStyle,
								...( child.props.style || {} ),
							},
						} );
					} ),
				{ maxSize: fontSizeConfigs.length }
			),
		[ fontSizeConfigs.length ]
	);
	const createSetFontSize = useMemo(
		() =>
			memoize(
				( name, fontSizes ) => ( newFontSize ) => {
					const fontSize = fontSizes.find(
						( _fontSize ) => _fontSize.size === newFontSize
					);
					setAttributes( {
						[ fontSize
							? camelCase( `custom ${ name }` )
							: name ]: undefined,
					} );
					setAttributes( {
						[ fontSize
							? name
							: camelCase( `custom ${ name }` ) ]: fontSize
							? fontSize.slug
							: newFontSize,
					} );
				},
				{
					maxSize: fontSizeConfigs.length,
				}
			),
		[ setAttributes, fontSizeConfigs.length ]
	);

	return useMemo( () => {
		const fontSizeSettings = [];

		const components = fontSizeConfigs.reduce( ( acc, fontSizeConfig ) => {
			if ( typeof fontSizeConfig === 'string' ) {
				fontSizeConfig = { name: fontSizeConfig };
			}
			const {
				name, // E.g. 'fontSize'.
				className,

				panelLabel = fontSizeConfig.label ||
					COMMON_FONT_SIZE_LABELS[ name ] ||
					startCase( name ), // E.g. 'Font Size'.
				componentName = startCase( name ).replace( /\s/g, '' ), // E.g. 'FontSize'.

				fontSize = fontSizeConfig.size,
				fontSizes = settingsFontSizes,
			} = {
				...fontSizeConfig,
				fontSize: attributes[ fontSizeConfig.name ],
			};

			const customFontSize =
				attributes[ camelCase( `custom ${ name }` ) ];
			// We memoize the non-primitives to avoid unnecessary updates
			// when they are used as props for other components.
			const _fontSize = customFontSize
				? undefined
				: fontSizes.find(
						( __fontSize ) => __fontSize.slug === fontSize
				  );
			acc[ componentName ] = createComponent(
				name,
				className,
				fontSize,
				_fontSize && _fontSize.size,
				customFontSize
			);
			acc[ componentName ].displayName = componentName;
			acc[ componentName ].size = customFontSize
				? customFontSize
				: _fontSize && _fontSize.size;
			acc[ componentName ].slug = fontSize;
			acc[ componentName ].setFontSize = createSetFontSize(
				name,
				fontSizes
			);

			fontSizeSettings.push( {
				value: _fontSize
					? _fontSize.size
					: attributes[ camelCase( `custom ${ name }` ) ],
				onChange: acc[ componentName ].setFontSize,
				label: panelLabel,
			} );

			return acc;
		}, {} );

		const wrappedFontSizePanelProps = {
			title: panelTitle,
			initialOpen: false,
			fontSizeSettings,
			panelChildren,
		};
		return {
			...components,
			FontSizePanel: <FontSizePanel { ...wrappedFontSizePanelProps } />,
			InspectorControlsFontSizePanel: (
				<InspectorControlsFontSizePanel
					{ ...wrappedFontSizePanelProps }
				/>
			),
		};
	}, [ attributes, setAttributes, ...deps ] );
}
