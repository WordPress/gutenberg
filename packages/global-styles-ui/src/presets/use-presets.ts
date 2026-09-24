import type { BasePreset } from '@wordpress/global-styles-engine';
import { useSetting } from '../hooks';

const EMPTY_ARRAY: any[] = [];

/**
 * Read + mutate the preset array stored at `${settingsPath}.${origin}`.
 *
 * `presets` reflects the merged (user-edited) value; `basePresets` is read
 * explicitly from the theme base, used to compare against or reset to the
 * theme-provided values.
 *
 * @param settingsPath Origin-keyed base path, e.g. 'shadow.presets'.
 * @param origin       'default' | 'theme' | 'custom'.
 */
export function usePresets< T extends BasePreset >(
	settingsPath: string,
	origin: string
) {
	const path = `${ settingsPath }.${ origin }`;
	const [ presets = EMPTY_ARRAY, setPresets ] = useSetting< T[] >( path );
	const [ basePresets = EMPTY_ARRAY ] = useSetting< T[] >(
		path,
		undefined,
		'base'
	);

	return { presets, basePresets, setPresets };
}
