/**
 * WordPress dependencies
 */
import { __experimentalPanelColorGradientSettings as PanelColorGradientSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	BACKGROUND_COLOR,
	LINK_COLOR,
	TEXT_COLOR,
	GRADIENT_COLOR,
} from '../editor/utils';

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
			colorValue: getProperty( name, 'color.text' ),
			onColorChange: ( value ) =>
				setProperty( name, { 'color.text': value } ),
			label: __( 'Text color' ),
		} );
	}

	// TODO: check for gradient support, etc
	/*
	 * We want to send the entities API both colors
	 * in a single request. This is to avod race conditions
	 * that override the previous callback.
	 */
	let setColor;
	const colorPromise = new Promise(
		( resolve ) => ( setColor = ( value ) => resolve( value ) )
	);
	let setGradient;
	const gradientPromise = new Promise(
		( resolve ) => ( setGradient = ( value ) => resolve( value ) )
	);
	Promise.all( [ colorPromise, gradientPromise ] ).then( ( values ) => {
		setProperty( name, { ...values[ 0 ], ...values[ 1 ] } );
	} );
	if (
		supports.includes( BACKGROUND_COLOR ) &&
		supports.includes( GRADIENT_COLOR )
	) {
		const backgroundSettings = {
			colorValue: getProperty( name, 'color.background' ),
			onColorChange: ( value ) =>
				setColor( { 'color.background': value } ),
		};

		const gradientSettings = {
			gradientValue: getProperty( name, 'color.gradient' ),
			onGradientChange: ( value ) =>
				setGradient( { 'color.gradient': value } ),
		};

		settings.push( {
			...backgroundSettings,
			...gradientSettings,
			label: __( 'Background color' ),
		} );
	}

	if ( supports.includes( LINK_COLOR ) ) {
		settings.push( {
			colorValue: getProperty( name, 'color.link' ),
			onColorChange: ( value ) =>
				setProperty( name, { 'color.link': value } ),
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
