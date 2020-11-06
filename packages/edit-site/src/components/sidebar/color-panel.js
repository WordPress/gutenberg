/**
 * WordPress dependencies
 */
import { __experimentalPanelColorGradientSettings as PanelColorGradientSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	LINK_COLOR,
	useEditorFeature,
	getPresetValueFromVariable,
	getPresetVariable,
} from '../editor/utils';
import ColorPalettePanel from './color-palette-panel';

export function useHasColorPanel( { supports } ) {
	return (
		supports.includes( 'color' ) ||
		supports.includes( 'backgroundColor' ) ||
		supports.includes( 'background' ) ||
		supports.includes( LINK_COLOR )
	);
}

export default function ColorPanel( {
	context: { supports, name },
	getStyleProperty,
	getMergedStyleProperty,
	setStyleProperty,
	getSetting,
	setSetting,
} ) {
	const colors = useEditorFeature( 'color.palette', name );
	const disableCustomColors = ! useEditorFeature( 'color.custom', name );
	const gradients = useEditorFeature( 'color.gradients', name );
	const disableCustomGradients = ! useEditorFeature(
		'color.customGradient',
		name
	);

	const settings = [];

	if ( supports.includes( 'color' ) ) {
		const color = getMergedStyleProperty( name, 'color' );
		const userColor = getStyleProperty( name, 'color' );
		settings.push( {
			colorValue:
				getPresetValueFromVariable( 'color', colors, color ) || color,
			onColorChange: ( value ) =>
				setStyleProperty(
					name,
					'color',
					getPresetVariable( 'color', colors, value ) || value
				),
			label: __( 'Text color' ),
			clearable: color === userColor,
		} );
	}

	let backgroundSettings = {};
	if ( supports.includes( 'backgroundColor' ) ) {
		const backgroundColor = getMergedStyleProperty(
			name,
			'backgroundColor'
		);
		const userBackgroundColor = getStyleProperty( name, 'backgroundColor' );
		backgroundSettings = {
			colorValue:
				getPresetValueFromVariable(
					'color',
					colors,
					backgroundColor
				) || backgroundColor,
			onColorChange: ( value ) =>
				setStyleProperty(
					name,
					'backgroundColor',
					getPresetVariable( 'color', colors, value ) || value
				),
		};
		if ( backgroundColor ) {
			backgroundSettings.clearable =
				backgroundColor === userBackgroundColor;
		}
	}

	let gradientSettings = {};
	if ( supports.includes( 'background' ) ) {
		const gradient = getMergedStyleProperty( name, 'background' );
		const userGradient = getStyleProperty( name, 'background' );
		gradientSettings = {
			gradientValue:
				getPresetValueFromVariable( 'gradient', gradients, gradient ) ||
				gradient,
			onGradientChange: ( value ) =>
				setStyleProperty(
					name,
					'background',
					getPresetVariable( 'gradient', gradients, value ) || value
				),
		};
		if ( gradient ) {
			gradientSettings.clearable = gradient === userGradient;
		}
	}

	if (
		supports.includes( 'background' ) ||
		supports.includes( 'backgroundColor' )
	) {
		settings.push( {
			...backgroundSettings,
			...gradientSettings,
			label: __( 'Background color' ),
		} );
	}

	if ( supports.includes( LINK_COLOR ) ) {
		const color = getMergedStyleProperty( name, LINK_COLOR );
		const userColor = getStyleProperty( name, LINK_COLOR );
		settings.push( {
			colorValue:
				getPresetValueFromVariable( 'color', colors, color ) || color,
			onColorChange: ( value ) =>
				setStyleProperty(
					name,
					LINK_COLOR,
					getPresetVariable( 'color', colors, value ) || value
				),
			label: __( 'Link color' ),
			clearable: color === userColor,
		} );
	}
	return (
		<PanelColorGradientSettings
			title={ __( 'Color' ) }
			settings={ settings }
			colors={ colors }
			gradients={ gradients }
			disableCustomColors={ disableCustomColors }
			disableCustomGradients={ disableCustomGradients }
		>
			<ColorPalettePanel
				key={ 'color-palette-panel-' + name }
				contextName={ name }
				getSetting={ getSetting }
				setSetting={ setSetting }
			/>
		</PanelColorGradientSettings>
	);
}
