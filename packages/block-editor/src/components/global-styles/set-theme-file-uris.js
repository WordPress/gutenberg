/**
 * WordPress dependencies
 */
import { isURL, isValidPath } from '@wordpress/url';

function isRelativePath( url ) {
	return isValidPath( url ) && ! isURL( url );
}

/**
 * Looks up a theme file URI based on a relative path.
 *
 * @param {string}        file          A relative path.
 * @param {Array<Object>} themeFileURIs A collection of absolute theme file URIs and their corresponding file paths.
 * @return {string?} A resolved theme file URI, if one is found in the themeFileURIs collection.
 */
export function getThemeFileURI( file, themeFileURIs = [] ) {
	if ( ! isRelativePath( file ) ) {
		return file;
	}

	const uri = themeFileURIs.find(
		( themeFileUri ) => themeFileUri.file === file
	);

	return uri?.href;
}

/**
 * Houses logic of where to look for unresolved theme file paths.
 *
 * @param {Object}        styles        A styles object.
 * @param {Array<Object>} themeFileURIs A collection of absolute theme file URIs and their corresponding file paths.
 * @return {Object} Returns mutated styles object.
 */
function setUnresolvedThemeFilePaths( styles, themeFileURIs ) {
	// Top level styles.
	if (
		!! styles?.background?.backgroundImage?.url &&
		isRelativePath( styles?.background?.backgroundImage?.url )
	) {
		const backgroundImageUrl = getThemeFileURI(
			styles?.background?.backgroundImage?.url,
			themeFileURIs
		);
		if ( backgroundImageUrl ) {
			styles.background.backgroundImage.url = backgroundImageUrl;
		}
	}

	return styles;
}

/**
 * Resolves any relative paths if a corresponding theme file URI is available.
 * Note: this function mutates the object and is specifically to be used in
 * an async styles build context in useGlobalStylesOutput
 *
 * @param {Object}        themeJson     Theme.json/Global styles tree.
 * @param {Array<Object>} themeFileURIs A collection of absolute theme file URIs and their corresponding file paths.
 * @return {Object} Returns mutated object.
 */
export default function setThemeFileUris( themeJson, themeFileURIs ) {
	if ( ! themeJson?.styles || ! themeFileURIs ) {
		return themeJson;
	}

	// Mutating function.
	setUnresolvedThemeFilePaths( themeJson.styles, themeFileURIs );

	return themeJson;
}
