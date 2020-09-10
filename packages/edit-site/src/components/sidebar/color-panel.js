/**
 * WordPress dependencies
 */
import { __experimentalPanelColorGradientSettings as PanelColorGradientSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { LINK_COLOR } from '../editor/utils';

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
			colorValue: getProperty( name, 'color' ),
			onColorChange: ( value ) => setProperty( name, 'color', value ),
			label: __( 'Text color' ),
		} );
	}

	let backgroundSettings = {};
	if ( supports.includes( 'backgroundColor' ) ) {
		backgroundSettings = {
			colorValue: getProperty( name, 'backgroundColor' ),
			onColorChange: ( value ) =>
				setProperty( name, 'backgroundColor', value ),
		};
	}

	let gradientSettings = {};
	if ( supports.includes( 'background' ) ) {
		gradientSettings = {
			gradientValue: getProperty( name, 'background' ),
			onGradientChange: ( value ) =>
				setProperty( name, 'background', value ),
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
			colorValue: getProperty( name, LINK_COLOR ),
			onColorChange: ( value ) => setProperty( name, LINK_COLOR, value ),
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
