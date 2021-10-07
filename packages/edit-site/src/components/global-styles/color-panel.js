/**
 * WordPress dependencies
 */
import { __experimentalPanelColorGradientSettings as PanelColorGradientSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

import { getSupportedGlobalStylesPanels, useSetting, useStyle } from './hooks';
import Palette from './palette';

export function useHasColorPanel( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		supports.includes( 'color' ) ||
		supports.includes( 'backgroundColor' ) ||
		supports.includes( 'background' ) ||
		supports.includes( 'linkColor' )
	);
}

export default function ColorPanel( { name } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const [ solids ] = useSetting( 'color.palette', name );
	const [ gradients ] = useSetting( 'color.gradients', name );
	const [ areCustomSolidsEnabled ] = useSetting( 'color.custom', name );
	const [ areCustomGradientsEnabled ] = useSetting(
		'color.customGradient',
		name
	);

	const [ isLinkEnabled ] = useSetting( 'color.link', name );
	const [ isTextEnabled ] = useSetting( 'color.text', name );
	const [ isBackgroundEnabled ] = useSetting( 'color.background', name );

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

	const [ color, setColor ] = useStyle( 'color.text', name );
	const [ userColor ] = useStyle( 'color.text', name, 'user' );
	const [ backgroundColor, setBackgroundColor ] = useStyle(
		'color.background',
		name
	);
	const [ userBackgroundColor ] = useStyle(
		'color.background',
		name,
		'user'
	);
	const [ gradient, setGradient ] = useStyle( 'color.gradient', name );
	const [ userGradient ] = useStyle( 'color.gradient', name, 'user' );
	const [ linkColor, setLinkColor ] = useStyle(
		'elements.link.color.text',
		name
	);
	const [ userLinkColor ] = useStyle(
		'elements.link.color.text',
		name,
		'user'
	);

	const settings = [];
	if ( hasTextColor ) {
		settings.push( {
			colorValue: color,
			onColorChange: setColor,
			label: __( 'Text color' ),
			clearable: color === userColor,
		} );
	}

	let backgroundSettings = {};
	if ( hasBackgroundColor ) {
		backgroundSettings = {
			colorValue: backgroundColor,
			onColorChange: setBackgroundColor,
		};
		if ( backgroundColor ) {
			backgroundSettings.clearable =
				backgroundColor === userBackgroundColor;
		}
	}

	let gradientSettings = {};
	if ( hasGradientColor ) {
		gradientSettings = {
			gradientValue: gradient,
			onGradientChange: setGradient,
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
		settings.push( {
			colorValue: linkColor,
			onColorChange: setLinkColor,
			label: __( 'Link color' ),
			clearable: linkColor === userLinkColor,
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
