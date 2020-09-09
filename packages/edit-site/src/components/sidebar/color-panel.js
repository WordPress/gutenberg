/**
 * WordPress dependencies
 */
import { __experimentalPanelColorGradientSettings as PanelColorGradientSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { LINK_COLOR } from '../editor/utils';

const BACKGROUND_COLOR = 'background-color';
const GRADIENT_COLOR = 'background';
const TEXT_COLOR = 'color';

export default ( {
	context: { supports, name },
	getProperty,
	setProperty,
} ) => {
	if (
		! supports.includes( TEXT_COLOR ) &&
		! supports.includes( BACKGROUND_COLOR ) &&
		! supports.includes( GRADIENT_COLOR ) &&
		! supports.includes( LINK_COLOR )
	) {
		return null;
	}

	const settings = [];

	if ( supports.includes( TEXT_COLOR ) ) {
		settings.push( {
			colorValue: getProperty( name, [ 'color', 'text' ] ),
			onColorChange: ( value ) =>
				setProperty( name, [ 'color', 'text' ], value ),
			label: __( 'Text color' ),
		} );
	}

	let backgroundSettings = {};
	if ( supports.includes( BACKGROUND_COLOR ) ) {
		backgroundSettings = {
			colorValue: getProperty( name, [ 'color', 'background' ] ),
			onColorChange: ( value ) =>
				setProperty( name, [ 'color', 'background' ], value ),
		};
	}

	let gradientSettings = {};
	if ( supports.includes( GRADIENT_COLOR ) ) {
		gradientSettings = {
			gradientValue: getProperty( name, [ 'color', 'gradient' ] ),
			onGradientChange: ( value ) =>
				setProperty( name, [ 'color', 'gradient' ], value ),
		};
	}

	if (
		supports.includes( GRADIENT_COLOR ) ||
		supports.includes( BACKGROUND_COLOR )
	) {
		settings.push( {
			...backgroundSettings,
			...gradientSettings,
			label: __( 'Background color' ),
		} );
	}

	if ( supports.includes( LINK_COLOR ) ) {
		settings.push( {
			colorValue: getProperty( name, [ 'color', 'link' ] ),
			onColorChange: ( value ) =>
				setProperty( name, [ 'color', 'link' ], value ),
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
