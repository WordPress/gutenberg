/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect, useState, useMemo, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PanelColorGradientSettings from '../colors-gradients/panel-color-gradient-settings';
import { useColorsPerOrigin, useGradientsPerOrigin } from './hooks';
import { getValueFromVariable } from './utils';
import { setImmutably } from '../../utils/object';
import ContrastChecker from '../contrast-checker';
import InspectorControls from '../inspector-controls';
import {
	useHasColorPanel,
	useHasTextPanel,
	useHasBackgroundColorPanel,
} from './color-panel.js';
import { useGlobalStyles } from './use-global-styles-context';

const ColorPanel = ( {
	value,
	inheritedValue = value,
	onChange,
	settings,
} ) => {
	const colors = useColorsPerOrigin( settings );
	const gradients = useGradientsPerOrigin( settings );
	const globalStyles = useGlobalStyles();

	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedTextColor, setDetectedTextColor ] = useState();

	const { baseGlobalStyles } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			baseGlobalStyles:
				getSettings()?.__experimentalGlobalStylesBaseStyles?.color,
		};
	} );

	const decodeValue = ( rawValue ) =>
		getValueFromVariable( { settings }, '', rawValue );
	const encodeColorValue = useCallback(
		( colorValue ) => {
			const allColors = colors.flatMap(
				( { colors: originColors } ) => originColors
			);
			const colorObject = allColors.find(
				( { color } ) => color === colorValue
			);
			return colorObject
				? 'var:preset|color|' + colorObject.slug
				: colorValue;
		},
		[ colors ]
	);
	const encodeGradientValue = useCallback(
		( gradientValue ) => {
			const allGradients = gradients.flatMap(
				( { gradients: originGradients } ) => originGradients
			);
			const gradientObject = allGradients.find(
				( { gradient } ) => gradient === gradientValue
			);
			return gradientObject
				? 'var:preset|gradient|' + gradientObject.slug
				: gradientValue;
		},
		[ gradients ]
	);

	// Text Color
	const showTextPanel = useHasTextPanel( settings );
	const textColor = decodeValue( inheritedValue?.color?.text );
	const setTextColor = useCallback(
		( newColor ) => {
			onChange(
				setImmutably(
					value,
					[ 'color', 'text' ],
					encodeColorValue( newColor )
				)
			);
		},
		[ encodeColorValue, onChange, value ]
	);
	const resetTextColor = useCallback(
		() => setTextColor( undefined ),
		[ setTextColor ]
	);

	// BackgroundColor
	const showBackgroundPanel = useHasBackgroundColorPanel( settings );
	const backgroundColor = decodeValue( inheritedValue?.color?.background );
	const gradient = decodeValue( inheritedValue?.color?.gradient );
	const setBackgroundColor = useCallback(
		( newColor ) => {
			const newValue = setImmutably(
				value,
				[ 'color', 'background' ],
				encodeColorValue( newColor )
			);
			newValue.color.gradient = undefined;
			onChange( newValue );
		},
		[ encodeColorValue, onChange, value ]
	);
	const setGradient = useCallback(
		( newGradient ) => {
			const newValue = setImmutably(
				value,
				[ 'color', 'gradient' ],
				encodeGradientValue( newGradient )
			);
			newValue.color.background = undefined;
			onChange( newValue );
		},
		[ encodeGradientValue, onChange, value ]
	);
	const resetBackground = useCallback( () => {
		const newValue = setImmutably(
			value,
			[ 'color', 'background' ],
			undefined
		);
		newValue.color.gradient = undefined;
		onChange( newValue );
	}, [ onChange, value ] );
	const currentGradients = settings?.color?.gradients;
	const withoutGradientsSupport =
		Array.isArray( currentGradients ) && currentGradients.length === 0;

	const items = useMemo(
		() =>
			[
				showTextPanel && {
					label: __( 'Text' ),
					colorValue: textColor,
					onColorChange: setTextColor,
					onColorCleared: resetTextColor,
				},
				showBackgroundPanel && {
					label: __( 'Background' ),
					colorValue: backgroundColor,
					onColorChange: setBackgroundColor,
					onColorCleared: resetBackground,
					onGradientChange: ! withoutGradientsSupport
						? setGradient
						: undefined,
					gradientValue: gradient,
				},
			].filter( Boolean ),
		[
			backgroundColor,
			gradient,
			resetBackground,
			resetTextColor,
			setBackgroundColor,
			setGradient,
			setTextColor,
			showBackgroundPanel,
			showTextPanel,
			textColor,
			withoutGradientsSupport,
		]
	);

	useEffect( () => {
		// The following logic is used to determine current text/background colors:
		// 1. The globalStyles object is queried to determine whether a color has been
		// set via a block's settings.
		// 2. If a block-based theme is in use and no globalStyles exist, the theme's
		// default/base colors are used.
		// 3. If no globalStyles exist and a theme isn't block-based, there is no way
		// to determine the default text/background color and the checker won't run.
		const currentDetectedTextColor =
			globalStyles?.color || baseGlobalStyles?.text;
		const currentDetectedBackgroundColor =
			globalStyles?.backgroundColor || baseGlobalStyles?.background;

		setDetectedTextColor( currentDetectedTextColor );
		setDetectedBackgroundColor( currentDetectedBackgroundColor );
	}, [ globalStyles, baseGlobalStyles ] );

	return (
		<InspectorControls>
			<PanelColorGradientSettings
				title={ __( 'Color' ) }
				initialOpen={ false }
				settings={ items }
			>
				<ContrastChecker
					backgroundColor={ detectedBackgroundColor }
					textColor={ detectedTextColor }
				/>
			</PanelColorGradientSettings>
		</InspectorControls>
	);
};

export { useHasColorPanel };
export default ColorPanel;
