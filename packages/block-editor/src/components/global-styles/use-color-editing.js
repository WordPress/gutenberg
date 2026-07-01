/**
 * WordPress dependencies
 */
import { useCallback, useMemo, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useStyleOverride } from '../../hooks/utils';
import { store as blockEditorStore } from '../../store';
import { colorEditingSettingsKey } from '../../store/private-keys';

// Hosts (e.g. @wordpress/editor) supply palette editing at
// `settings.color[ colorEditingSettingsKey ]`. Read from the block-editor store
// to sync in real time. `useSettings` only reflects theme.json and misses this
// config.
function useHostColorEditingSettings() {
	return useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		return settings?.color?.[ colorEditingSettingsKey ];
	}, [] );
}

/**
 * Wires the host-provided palette editing configuration into a `colorEditing`
 * object suitable for `ColorGradientControl`/`ColorPalette`, together with a
 * live preview of the edited color applied through a style override.
 *
 * The same picker is now split across several panels (Typography for text,
 * Background for background, and the Elements color panel for link/heading/
 * button/caption). Each of those panels calls this hook so palette editing is
 * available wherever a color palette is shown. Only one picker dropdown can be
 * open at a time, so a single shared preview override id cannot be clobbered by
 * another picker.
 *
 * @return {Object|undefined} The `colorEditing` config, or `undefined` when the
 *                            host does not enable palette editing.
 */
export default function useColorEditing() {
	const hostColorEditing = useHostColorEditingSettings();
	const [ palettePreview, setPalettePreview ] = useState( null );

	const onPreview = useCallback( ( payload ) => {
		setPalettePreview(
			payload ? { slug: payload.slug, color: payload.color } : null
		);
	}, [] );

	const previewCss = useMemo( () => {
		if ( ! palettePreview ) {
			return undefined;
		}
		const { slug, color } = palettePreview;
		// Validate slug and color before embedding them in CSS.
		if ( ! /^[a-zA-Z0-9_-]+$/.test( slug ) ) {
			return undefined;
		}
		const trimmedColor = color.trim();
		if (
			/[;{}]/.test( trimmedColor ) ||
			! /^[\w#(),.%\s-]+$/.test( trimmedColor )
		) {
			return undefined;
		}
		return `body{--wp--preset--color--${ slug }:${ trimmedColor };}`;
	}, [ palettePreview ] );

	useStyleOverride( { id: 'color-palette-value-preview', css: previewCss } );

	return useMemo(
		() =>
			hostColorEditing ? { ...hostColorEditing, onPreview } : undefined,
		[ hostColorEditing, onPreview ]
	);
}
