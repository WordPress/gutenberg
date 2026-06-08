/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getSetting } from './get-setting';
import type {
	Color,
	Gradient,
	Duotone,
	MultiOriginPalettes,
	GlobalStylesConfig,
} from '../types';

/**
 * Retrieves color and gradient related settings.
 *
 * The arrays for colors and gradients are made up of color palettes from each
 * origin i.e. "Core", "Theme", and "User".
 *
 * @param settings Global styles settings.
 *
 * @return Color and gradient related settings.
 */
export default function getPalettes(
	settings?: GlobalStylesConfig
): MultiOriginPalettes {
	if ( ! settings ) {
		return {
			disableCustomColors: true,
			disableCustomGradients: true,
			colors: [],
			gradients: [],
			duotones: [],
			hasColorsOrGradients: false,
		};
	}

	const [
		enableCustomColors,
		customColors,
		themeColors,
		defaultColors,
		shouldDisplayDefaultColors,
		enableCustomGradients,
		customGradients,
		themeGradients,
		defaultGradients,
		shouldDisplayDefaultGradients,
		shouldDisplayDefaultDuotones,
		customDuotones,
		themeDuotones,
		defaultDuotones,
	] = [
		'color.custom',
		'color.palette.custom',
		'color.palette.theme',
		'color.palette.default',
		'color.defaultPalette',
		'color.customGradient',
		'color.gradients.custom',
		'color.gradients.theme',
		'color.gradients.default',
		'color.defaultGradients',
		'color.defaultDuotone',
		'color.duotone.custom',
		'color.duotone.theme',
		'color.duotone.default',
	].map( ( path ) => getSetting( settings, path ) );

	const palettes: MultiOriginPalettes = {
		disableCustomColors: ! enableCustomColors,
		disableCustomGradients: ! enableCustomGradients,
		colors: [],
		gradients: [],
		duotones: [],
		hasColorsOrGradients: false,
	};

	if ( themeColors && ( themeColors as Color[] ).length ) {
		palettes.colors?.push( {
			name: _x( 'Theme', 'Indicates this palette comes from the theme.' ),
			slug: 'theme',
			colors: themeColors as Color[],
		} );
	}
	if (
		shouldDisplayDefaultColors &&
		defaultColors &&
		( defaultColors as Color[] ).length
	) {
		palettes.colors?.push( {
			name: _x(
				'Default',
				'Indicates this palette comes from WordPress.'
			),
			slug: 'default',
			colors: defaultColors as Color[],
		} );
	}
	if ( customColors && ( customColors as Color[] ).length ) {
		palettes.colors?.push( {
			name: _x(
				'Custom',
				'Indicates this palette is created by the user.'
			),
			slug: 'custom',
			colors: customColors as Color[],
		} );
	}

	if ( themeGradients && ( themeGradients as Gradient[] ).length ) {
		palettes.gradients?.push( {
			name: _x( 'Theme', 'Indicates this palette comes from the theme.' ),
			slug: 'theme',
			gradients: themeGradients as Gradient[],
		} );
	}
	if (
		shouldDisplayDefaultGradients &&
		defaultGradients &&
		( defaultGradients as Gradient[] ).length
	) {
		palettes.gradients?.push( {
			name: _x(
				'Default',
				'Indicates this palette comes from WordPress.'
			),
			slug: 'default',
			gradients: defaultGradients as Gradient[],
		} );
	}
	if ( customGradients && ( customGradients as Gradient[] ).length ) {
		palettes.gradients?.push( {
			name: _x(
				'Custom',
				'Indicates this palette is created by the user.'
			),
			slug: 'custom',
			gradients: customGradients as Gradient[],
		} );
	}

	if ( themeDuotones && ( themeDuotones as Duotone[] ).length ) {
		palettes.duotones?.push( {
			name: _x(
				'Theme',
				'Indicates these duotone filters come from the theme.'
			),
			slug: 'theme',
			duotones: themeDuotones as Duotone[],
		} );
	}

	if (
		shouldDisplayDefaultDuotones &&
		defaultDuotones &&
		( defaultDuotones as Duotone[] ).length
	) {
		palettes.duotones?.push( {
			name: _x(
				'Default',
				'Indicates these duotone filters come from WordPress.'
			),
			slug: 'default',
			duotones: defaultDuotones as Duotone[],
		} );
	}
	if ( customDuotones && ( customDuotones as Duotone[] ).length ) {
		palettes.duotones?.push( {
			name: _x(
				'Custom',
				'Indicates these doutone filters are created by the user.'
			),
			slug: 'custom',
			duotones: customDuotones as Duotone[],
		} );
	}

	palettes.hasColorsOrGradients =
		!! palettes.colors?.length || !! palettes.gradients?.length;

	return palettes;
}
