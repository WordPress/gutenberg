/**
 * WordPress dependencies
 */
import {
	useSetting,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { LINK_COLOR } from '../editor/utils';
import ColorPalettePanel from './color-palette-panel';
import { store as editSiteStore } from '../../store';

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
	getStyle,
	setStyle,
	getSetting,
	setSetting,
} ) {
	const colors = useSetting( 'color.palette', name, editSiteStore );
	const disableCustomColors = ! useSetting(
		'color.custom',
		name,
		editSiteStore
	);
	const gradients = useSetting( 'color.gradients', name );
	const disableCustomGradients = ! useSetting(
		'color.customGradient',
		name,
		editSiteStore
	);

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

	if ( supports.includes( LINK_COLOR ) ) {
		const color = getStyle( name, LINK_COLOR );
		const userColor = getStyle( name, LINK_COLOR, 'user' );
		settings.push( {
			colorValue: color,
			onColorChange: ( value ) => setStyle( name, LINK_COLOR, value ),
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
