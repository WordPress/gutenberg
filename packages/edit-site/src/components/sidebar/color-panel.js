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
		const color = getStyleProperty( name, 'color' );
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
		} );
	}

	let backgroundSettings = {};
	if ( supports.includes( 'backgroundColor' ) ) {
		const backgroundColor = getStyleProperty( name, 'backgroundColor' );
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
	}

	let gradientSettings = {};
	if ( supports.includes( 'background' ) ) {
		const gradient = getStyleProperty( name, 'background' );
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
		const color = getStyleProperty( name, LINK_COLOR );
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
