/**
 * WordPress dependencies
 */
import { Icon, moon, sun } from '@wordpress/icons';
export {
	flattenColorSchemePresets as flattenSchemePresets,
	normalizeColorSchemePresets,
} from '@wordpress/global-styles-engine';
export type { ColorSchemePresetCollection as SchemePresetCollection } from '@wordpress/global-styles-engine';

export type ColorScheme = 'light' | 'dark';

export function SchemePaletteIcon( { scheme }: { scheme: ColorScheme } ) {
	return <Icon icon={ scheme === 'light' ? sun : moon } size={ 20 } />;
}
