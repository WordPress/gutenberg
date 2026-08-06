/**
 * WordPress dependencies
 */
import { Icon, moon, sun } from '@wordpress/icons';

export type ColorScheme = 'light' | 'dark';

type PresetWithOptionalName = {
	name?: string;
	slug: string;
};

export type SchemePresetCollection< T > =
	| T[]
	| {
			theme?: T[];
			custom?: T[];
			default?: T[];
	  };

export function SchemePaletteIcon( { scheme }: { scheme: ColorScheme } ) {
	return <Icon icon={ scheme === 'light' ? sun : moon } size={ 20 } />;
}

export function flattenSchemePresets< T >(
	presets?: SchemePresetCollection< T >
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

export function addBasePresetNames<
	T extends PresetWithOptionalName,
	U extends { name: string; slug: string },
>( presets: T[], basePresets?: U[] ): ( T & { name: string } )[] {
	const baseNames = new Map(
		basePresets?.map( ( { name, slug } ) => [ slug, name ] )
	);

	return presets.map( ( preset ) => ( {
		...preset,
		name: preset.name ?? baseNames.get( preset.slug ) ?? preset.slug,
	} ) );
}
