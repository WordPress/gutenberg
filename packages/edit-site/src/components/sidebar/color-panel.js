/**
 * WordPress dependencies
 */
import { __experimentalPanelColorGradientSettings as PanelColorGradientSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { LINK_COLOR } from '../editor/utils';
import ColorPalettePanel from './color-palette-panel';

export default ( {
	context: { supports, name },
	getStyleProperty,
	setStyleProperty,
	getSetting,
	setSetting,
} ) => {
	if (
		! supports.includes( 'color' ) &&
		! supports.includes( 'backgrounColor' ) &&
		! supports.includes( 'background' ) &&
		! supports.includes( LINK_COLOR )
	) {
		return null;
	}

	const settings = [];

	if ( supports.includes( 'color' ) ) {
		settings.push( {
			colorValue: getStyleProperty( name, 'color' ),
			onColorChange: ( value ) =>
				setStyleProperty( name, 'color', value ),
			label: __( 'Text color' ),
		} );
	}

	let backgroundSettings = {};
	if ( supports.includes( 'backgroundColor' ) ) {
		backgroundSettings = {
			colorValue: getStyleProperty( name, 'backgroundColor' ),
			onColorChange: ( value ) =>
				setStyleProperty( name, 'backgroundColor', value ),
		};
	}

	let gradientSettings = {};
	if ( supports.includes( 'background' ) ) {
		gradientSettings = {
			gradientValue: getStyleProperty( name, 'background' ),
			onGradientChange: ( value ) =>
				setStyleProperty( name, 'background', value ),
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
		settings.push( {
			colorValue: getStyleProperty( name, LINK_COLOR ),
			onColorChange: ( value ) =>
				setStyleProperty( name, LINK_COLOR, value ),
			label: __( 'Link color' ),
		} );
	}

	return (
		<PanelColorGradientSettings
			title={ __( 'Color' ) }
			settings={ settings }
		>
			<ColorPalettePanel
				key={ 'color-palette-panel-' + name }
				contextName={ name }
				getSetting={ getSetting }
				setSetting={ setSetting }
			/>
		</PanelColorGradientSettings>
	);
};
