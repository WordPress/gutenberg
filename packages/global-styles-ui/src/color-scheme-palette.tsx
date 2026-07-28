/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/icons';

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

const lightIcon = (
	<svg
		aria-hidden="true"
		focusable="false"
		fill="currentColor"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d="M12 7.25A4.75 4.75 0 1 0 12 16.75 4.75 4.75 0 0 0 12 7.25Zm0 8A3.25 3.25 0 1 1 12 8.75 3.25 3.25 0 0 1 12 15.25ZM11.25 2h1.5v3h-1.5V2Zm0 17h1.5v3h-1.5v-3ZM2 11.25h3v1.5H2v-1.5Zm17 0h3v1.5h-3v-1.5ZM4.58 3.52 6.7 5.64 5.64 6.7 3.52 4.58l1.06-1.06Zm12.72 12.72 2.12 2.12-1.06 1.06-2.12-2.12 1.06-1.06Zm1.06-12.72 1.06 1.06-2.12 2.12-1.06-1.06 2.12-2.12ZM5.64 16.24 6.7 17.3l-2.12 2.12-1.06-1.06 2.12-2.12Z" />
	</svg>
);

const darkIcon = (
	<svg
		aria-hidden="true"
		focusable="false"
		fill="currentColor"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d="M20.31 15.22A8.4 8.4 0 0 1 8.78 3.69 8.4 8.4 0 1 0 20.31 15.22Zm-8.09 4.03A6.9 6.9 0 0 1 6.6 8.35a9.9 9.9 0 0 0 9.05 9.05 6.87 6.87 0 0 1-3.43 1.85Z" />
	</svg>
);

export function SchemePaletteIcon( { scheme }: { scheme: ColorScheme } ) {
	return (
		<Icon
			className="global-styles-ui-scheme-palette-icon"
			icon={ scheme === 'light' ? lightIcon : darkIcon }
			size={ 20 }
		/>
	);
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
