/**
 * Looks up a theme file URI based on a relative path.
 *
 * @param {string}        file          A relative path.
 * @param {Array<Object>} themeFileURIs A collection of absolute theme file URIs and their corresponding file paths.
 * @return {string?} A resolved theme file URI, if one is found in the themeFileURIs collection.
 */
export function getResolvedThemeFilePath( file, themeFileURIs = [] ) {
	const uri = themeFileURIs.find(
		( themeFileUri ) => themeFileUri.name === file
	);

	if ( ! uri?.href ) {
		return file;
	}

	return uri?.href;
}
