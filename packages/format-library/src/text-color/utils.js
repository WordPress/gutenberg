/**
 * Builds the effective highlight color palette and whether the Highlight
 * toolbar control should be available, matching ColorPalette's origin rules.
 *
 * @param {Object}  settings
 * @param {Array}   [settings.themeColors]
 * @param {Array}   [settings.defaultColors]
 * @param {Array}   [settings.customColors]
 * @param {boolean} [settings.enableCustomColors]
 * @param {boolean} [settings.enableDefaultColors]
 * @return {{ colors: Array, hasColorsToChoose: boolean }} Available colors and visibility.
 */
export function getAvailableHighlightColors( {
	themeColors,
	defaultColors,
	customColors,
	enableCustomColors,
	enableDefaultColors,
} = {} ) {
	const colors = enableDefaultColors
		? [
				...( themeColors || [] ),
				...( defaultColors || [] ),
				...( customColors || [] ),
		  ]
		: [ ...( themeColors || [] ), ...( customColors || [] ) ];

	return {
		colors,
		hasColorsToChoose: colors.length > 0 || !! enableCustomColors,
	};
}
