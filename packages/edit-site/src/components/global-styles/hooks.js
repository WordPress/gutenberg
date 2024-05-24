/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';

/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useCurrentMergeThemeStyleVariationsWithUserConfig } from '../../hooks/use-theme-style-variations/use-theme-style-variations-by-property';
import { unlock } from '../../lock-unlock';
import { useSelect } from '@wordpress/data';

const { useGlobalSetting, useGlobalStyle } = unlock( blockEditorPrivateApis );

// Enable colord's a11y plugin.
extend( [ a11yPlugin ] );

export function useColorRandomizer( name ) {
	const [ themeColors, setThemeColors ] = useGlobalSetting(
		'color.palette.theme',
		name
	);

	function randomizeColors() {
		/* eslint-disable no-restricted-syntax */
		const randomRotationValue = Math.floor( Math.random() * 225 );
		/* eslint-enable no-restricted-syntax */

		const newColors = themeColors.map( ( colorObject ) => {
			const { color } = colorObject;
			const newColor = colord( color )
				.rotate( randomRotationValue )
				.toHex();

			return {
				...colorObject,
				color: newColor,
			};
		} );

		setThemeColors( newColors );
	}

	return window.__experimentalEnableColorRandomizer
		? [ randomizeColors ]
		: [];
}

export function useStylesPreviewColors() {
	const [ textColor = 'black' ] = useGlobalStyle( 'color.text' );
	const [ backgroundColor = 'white' ] = useGlobalStyle( 'color.background' );
	const [ headingColor = textColor ] = useGlobalStyle(
		'elements.h1.color.text'
	);
	const [ linkColor = headingColor ] = useGlobalStyle(
		'elements.link.color.text'
	);

	const [ buttonBackgroundColor = linkColor ] = useGlobalStyle(
		'elements.button.color.background'
	);
	const [ coreColors ] = useGlobalSetting( 'color.palette.core' );
	const [ themeColors ] = useGlobalSetting( 'color.palette.theme' );
	const [ customColors ] = useGlobalSetting( 'color.palette.custom' );

	const paletteColors = ( themeColors ?? [] )
		.concat( customColors ?? [] )
		.concat( coreColors ?? [] );

	const textColorObject = paletteColors.filter(
		( { color } ) => color === textColor
	);
	const buttonBackgroundColorObject = paletteColors.filter(
		( { color } ) => color === buttonBackgroundColor
	);

	const highlightedColors = textColorObject
		.concat( buttonBackgroundColorObject )
		.concat( paletteColors )
		.filter(
			// we exclude these background color because it is already visible in the preview.
			( { color } ) => color !== backgroundColor
		)
		.slice( 0, 2 );

	return {
		paletteColors,
		highlightedColors,
	};
}

export function useSupportedStyles( name, element ) {
	const { supportedPanels } = useSelect(
		( select ) => {
			return {
				supportedPanels: unlock(
					select( blocksStore )
				).getSupportedStyles( name, element ),
			};
		},
		[ name, element ]
	);

	return supportedPanels;
}

export function useColorVariations() {
	const colorVariations = useCurrentMergeThemeStyleVariationsWithUserConfig( {
		property: 'color',
	} );
	/*
	 * Filter out variations with no settings or styles.
	 */
	return colorVariations?.length
		? colorVariations.filter( ( variation ) => {
				const { settings, styles, title } = variation;
				return (
					title === __( 'Default' ) || // Always preseve the default variation.
					Object.keys( settings ).length > 0 ||
					Object.keys( styles ).length > 0
				);
		  } )
		: [];
}

export function useTypographyVariations() {
	const typographyVariations =
		useCurrentMergeThemeStyleVariationsWithUserConfig( {
			property: 'typography',
		} );
	/*
	 * Filter out variations with no settings or styles.
	 */
	return typographyVariations?.length
		? typographyVariations.filter( ( variation ) => {
				const { settings, styles, title } = variation;
				return (
					title === __( 'Default' ) || // Always preseve the default variation.
					Object.keys( settings ).length > 0 ||
					Object.keys( styles ).length > 0
				);
		  } )
		: [];
}
