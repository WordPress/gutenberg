/**
 * WordPress dependencies
 */
import { __experimentalPanelColorGradientSettings as PanelColorGradientSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

import { useSetting } from '../editor/utils';
import Palette from './palette';

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
} ) {
	const solids = useSetting( 'color.palette', name );
	const gradients = useSetting( 'color.gradients', name );
	const areCustomSolidsEnabled = useSetting( 'color.custom', name );
	const areCustomGradientsEnabled = useSetting(
		'color.customGradient',
		name
	);
	const isLinkEnabled = useSetting( 'color.link', name );
	const isTextEnabled = useSetting( 'color.text', name );
	const isBackgroundEnabled = useSetting( 'color.background', name );

	const hasLinkColor =
		supports.includes( 'linkColor' ) &&
		isLinkEnabled &&
		( solids.length > 0 || areCustomSolidsEnabled );
	const hasTextColor =
		supports.includes( 'color' ) &&
		isTextEnabled &&
		( solids.length > 0 || areCustomSolidsEnabled );
	const hasBackgroundColor =
		supports.includes( 'backgroundColor' ) &&
		isBackgroundEnabled &&
		( solids.length > 0 || areCustomSolidsEnabled );
	const hasGradientColor =
		supports.includes( 'background' ) &&
		( gradients.length > 0 || areCustomGradientsEnabled );

	const settings = [];

	if ( hasTextColor ) {
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
	if ( hasBackgroundColor ) {
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
	if ( hasGradientColor ) {
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

	if ( hasBackgroundColor || hasGradientColor ) {
		settings.push( {
			...backgroundSettings,
			...gradientSettings,
			label: __( 'Background color' ),
		} );
	}

	if ( hasLinkColor ) {
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
		<>
			<Palette contextName={ name } />
			<PanelColorGradientSettings
				title={ __( 'Color' ) }
				settings={ settings }
				colors={ solids }
				gradients={ gradients }
				disableCustomColors={ ! areCustomSolidsEnabled }
				disableCustomGradients={ ! areCustomGradientsEnabled }
				showTitle={ false }
			/>
		</>
	);
}
