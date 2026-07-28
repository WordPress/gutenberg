/**
 * WordPress dependencies
 */
import { useMediaQuery } from '@wordpress/compose';
import { normalizeColorSchemePresets } from '@wordpress/global-styles-engine';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSettings } from '../use-settings';

/**
 * Returns the effective preset list for the current color scheme.
 *
 * Alternative presets are normalized against the base list by slug. Missing
 * alternative values use the base value and unmatched alternative slugs are
 * ignored.
 *
 * @param {'palette'|'gradients'|'duotone'} presetType  Color preset type.
 * @param {Array}                           basePresets Complete base presets.
 * @return {{ presets: Array, hasColorSchemes: boolean, colorScheme: string|undefined }} Effective presets and scheme metadata.
 */
export default function useColorSchemePresets( presetType, basePresets = [] ) {
	const [ lightPresets, darkPresets ] = useSettings(
		`color.light.${ presetType }`,
		`color.dark.${ presetType }`
	);
	const prefersLight = useMediaQuery( '(prefers-color-scheme: light)' );
	const prefersDark = useMediaQuery( '(prefers-color-scheme: dark)' );

	let colorScheme;
	let alternativePresets;
	if ( prefersDark && darkPresets !== undefined ) {
		colorScheme = 'dark';
		alternativePresets = darkPresets;
	} else if ( prefersLight && lightPresets !== undefined ) {
		colorScheme = 'light';
		alternativePresets = lightPresets;
	}

	const presets = useMemo(
		() =>
			alternativePresets === undefined
				? basePresets
				: normalizeColorSchemePresets(
						basePresets,
						alternativePresets
				  ),
		[ alternativePresets, basePresets ]
	);

	return {
		presets,
		hasColorSchemes:
			lightPresets !== undefined || darkPresets !== undefined,
		colorScheme,
	};
}
