/**
 * Internal dependencies
 */
import type { BasePreset, ColorSchemePreset } from '../types';

type PresetCollection< T extends { slug: string } > =
	| T[]
	| {
			theme?: T[];
			custom?: T[];
			default?: T[];
	  };

export type ColorSchemePresetCollection< T extends BasePreset > =
	PresetCollection< ColorSchemePreset< T > >;

/**
 * Flattens a color scheme preset collection after settings from different
 * origins have been merged.
 *
 * @param presets Color scheme presets in authored or origin-keyed form.
 * @return A flat list of color scheme presets.
 */
export function flattenColorSchemePresets< T extends { slug: string } >(
	presets?: PresetCollection< T >
): T[] {
	if ( ! presets ) {
		return [];
	}
	if ( Array.isArray( presets ) ) {
		return presets;
	}
	return [
		...( presets.theme ?? [] ),
		...( presets.custom ?? [] ),
		...( presets.default ?? [] ),
	];
}

/**
 * Creates the effective 1:1 preset list for a color scheme.
 *
 * The base preset list owns identity, names, and ordering. Alternative values
 * replace matching base presets by slug. Missing alternatives use the base
 * value, while alternatives without a matching base slug are ignored.
 *
 * @param basePresets        The complete base preset list.
 * @param alternativePresets The alternative scheme preset overrides.
 * @return A complete alternative preset list matching the base presets 1:1.
 */
export function normalizeColorSchemePresets< T extends BasePreset >(
	basePresets: T[] | undefined,
	alternativePresets?: ColorSchemePresetCollection< T >
): T[] {
	const alternativesBySlug = new Map(
		flattenColorSchemePresets( alternativePresets ).map( ( preset ) => [
			preset.slug,
			preset,
		] )
	);

	return ( basePresets ?? [] ).map( ( basePreset ) => {
		const alternative = alternativesBySlug.get( basePreset.slug );
		if ( ! alternative ) {
			return { ...basePreset };
		}
		return {
			...basePreset,
			...alternative,
			name: basePreset.name,
			slug: basePreset.slug,
		} as T;
	} );
}
