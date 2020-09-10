/**
 * WordPress dependencies
 */
import { __experimentalPanelColorGradientSettings as PanelColorGradientSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import {
	__EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY,
	__EXPERIMENTAL_LINK_COLOR as LINK_COLOR,
} from '@wordpress/blocks';

export default ( {
	context: { supports, name },
	getProperty,
	setProperty,
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
			colorValue: getProperty( name, STYLE_PROPERTY.color ),
			onColorChange: ( value ) =>
				setProperty( name, STYLE_PROPERTY.color, value ),
			label: __( 'Text color' ),
		} );
	}

	let backgroundSettings = {};
	if ( supports.includes( 'backgroundColor' ) ) {
		backgroundSettings = {
			colorValue: getProperty( name, STYLE_PROPERTY.backgroundColor ),
			onColorChange: ( value ) =>
				setProperty( name, STYLE_PROPERTY.backgroundColor, value ),
		};
	}

	let gradientSettings = {};
	if ( supports.includes( 'background' ) ) {
		gradientSettings = {
			gradientValue: getProperty( name, STYLE_PROPERTY.background ),
			onGradientChange: ( value ) =>
				setProperty( name, STYLE_PROPERTY.background, value ),
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
			colorValue: getProperty( name, STYLE_PROPERTY[ LINK_COLOR ] ),
			onColorChange: ( value ) =>
				setProperty( name, STYLE_PROPERTY[ LINK_COLOR ], value ),
			label: __( 'Link color' ),
		} );
	}

	return (
		<PanelColorGradientSettings
			title={ __( 'Color' ) }
			settings={ settings }
		/>
	);
};
