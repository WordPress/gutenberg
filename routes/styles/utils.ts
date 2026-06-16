/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { unlock } from '@wordpress/routes-lock-unlock';

type Theme = {
	is_block_theme?: boolean;
	theme_supports?: Record< string, boolean >;
};

type EditorSettings = {
	supportsLayout?: boolean;
};

/**
 * Check if a classic theme supports the Style Book.
 *
 * @param currentTheme   The current theme data.
 * @param editorSettings The editor settings data.
 * @return True if a classic theme supports Style Book.
 */
export function isClassicThemeWithStyleBookSupport(
	currentTheme: Theme | undefined,
	editorSettings: EditorSettings | undefined
) {
	const supportsEditorStyles =
		currentTheme?.theme_supports?.[ 'editor-styles' ];
	// This matches the v1 Site Editor's temporary theme.json heuristic.
	const hasThemeJson = editorSettings?.supportsLayout;

	return (
		! currentTheme?.is_block_theme &&
		!! ( supportsEditorStyles || hasThemeJson )
	);
}

/**
 * Check if the Styles route is supported by the current theme.
 *
 * @param currentTheme   The current theme data.
 * @param editorSettings The editor settings data.
 * @return True if the Styles route is supported.
 */
export function isStylesRouteSupported(
	currentTheme: Theme | undefined,
	editorSettings: EditorSettings | undefined
) {
	return (
		!! currentTheme?.is_block_theme ||
		isClassicThemeWithStyleBookSupport( currentTheme, editorSettings )
	);
}

/**
 * Resolve whether the current theme supports the Styles route.
 *
 * @return True if the Styles route is supported.
 */
export async function resolveIsStylesRouteSupported() {
	const [ currentTheme, editorSettings ] = await Promise.all( [
		resolveSelect( coreStore ).getCurrentTheme(),
		unlock( resolveSelect( coreStore ) as any ).getEditorSettings(),
	] );

	return isStylesRouteSupported( currentTheme, editorSettings );
}
