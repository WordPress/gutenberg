/**
 * WordPress dependencies
 */
import { __experimentalPanelColorGradientSettings as PanelColorGradientSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { LINK_COLOR, useEditorFeature } from '../editor/utils';
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
		const userColor = getStyleProperty( name, 'color', 'user' );
		settings.push( {
			colorValue: color,
			onColorChange: ( value ) =>
				setStyleProperty( name, 'color', value ),
			label: __( 'Text color' ),
			clearable: color === userColor,
		} );
	}

	let backgroundSettings = {};
	if ( supports.includes( 'backgroundColor' ) ) {
		const backgroundColor = getStyleProperty( name, 'backgroundColor' );
		const userBackgroundColor = getStyleProperty(
			name,
			'backgroundColor',
			'user'
		);
		backgroundSettings = {
			colorValue: backgroundColor,
			onColorChange: ( value ) =>
				setStyleProperty( name, 'backgroundColor', value ),
		};
		if ( backgroundColor ) {
			backgroundSettings.clearable =
				backgroundColor === userBackgroundColor;
		}
	}

	let gradientSettings = {};
	if ( supports.includes( 'background' ) ) {
		const gradient = getStyleProperty( name, 'background' );
		const userGradient = getStyleProperty( name, 'background', 'user' );
		gradientSettings = {
			gradientValue: gradient,
			onGradientChange: ( value ) =>
				setStyleProperty( name, 'background', value ),
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
		const color = getStyleProperty( name, LINK_COLOR );
		const userColor = getStyleProperty( name, LINK_COLOR, 'user' );
		settings.push( {
			colorValue: color,
			onColorChange: ( value ) =>
				setStyleProperty( name, LINK_COLOR, value ),
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
