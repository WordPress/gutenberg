/**
 * WordPress dependencies
 */
import { __experimentalPanelColorGradientSettings as PanelColorGradientSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

import { useSetting } from '../editor/utils';
import ColorPalettePanel from './color-palette-panel';

export function useHasColorPanel( { supports } ) {
	return (
		supports.includes( 'color' ) ||
		supports.includes( 'backgroundColor' ) ||
		supports.includes( 'background' ) ||
		supports.includes( 'linkColor' )
	);
}

export default function ColorPanel( {
	context: { supports, name },
	getStyle,
	setStyle,
	getSetting,
	setSetting,
} ) {
	const colors = useSetting( 'color.palette', name );
	const disableCustomColors = ! useSetting( 'color.custom', name );
	const gradients = useSetting( 'color.gradients', name );
	const disableCustomGradients = ! useSetting( 'color.customGradient', name );

	const settings = [];

	if ( supports.includes( 'color' ) ) {
		const color = getStyle( name, 'color' );
		const userColor = getStyle( name, 'color', 'user' );
		settings.push( {
			colorValue: color,
			onColorChange: ( value ) => setStyle( name, 'color', value ),
			label: __( 'Text color' ),
			clearable: color === userColor,
		} );
	}

	let backgroundSettings = {};
	if ( supports.includes( 'backgroundColor' ) ) {
		const backgroundColor = getStyle( name, 'backgroundColor' );
		const userBackgroundColor = getStyle( name, 'backgroundColor', 'user' );
		backgroundSettings = {
			colorValue: backgroundColor,
			onColorChange: ( value ) =>
				setStyle( name, 'backgroundColor', value ),
		};
		if ( backgroundColor ) {
			backgroundSettings.clearable =
				backgroundColor === userBackgroundColor;
		}
	}

	let gradientSettings = {};
	if ( supports.includes( 'background' ) ) {
		const gradient = getStyle( name, 'background' );
		const userGradient = getStyle( name, 'background', 'user' );
		gradientSettings = {
			gradientValue: gradient,
			onGradientChange: ( value ) =>
				setStyle( name, 'background', value ),
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

	if ( supports.includes( 'linkColor' ) ) {
		const color = getStyle( name, 'linkColor' );
		const userColor = getStyle( name, 'linkColor', 'user' );
		settings.push( {
			colorValue: color,
			onColorChange: ( value ) => setStyle( name, 'linkColor', value ),
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
