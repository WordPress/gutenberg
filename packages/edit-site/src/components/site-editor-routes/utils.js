/**
 * Check if the classic theme supports the stylebook.
 *
 * @param {Object} siteData - The site data provided by the site editor route area resolvers.
 * @return {boolean} True if the stylebook is supported, false otherwise.
 */
export function isClassicThemeWithStyleBookSupport( siteData ) {
	const isBlockTheme = siteData.currentTheme?.is_block_theme;
	const supportsEditorStyles =
		siteData.currentTheme?.theme_supports[ 'editor-styles' ];
	// This is a temp solution until the has_theme_json value is available for the current theme.
	const hasThemeJson = siteData.editorSettings?.supportsLayout;
	return ! isBlockTheme && ( supportsEditorStyles || hasThemeJson );
}
