/**
 * WordPress dependencies
 */
import { isURL, isValidPath } from '@wordpress/url';

function isRelativePath( url ) {
	return isValidPath( url ) && ! isURL( url );
}

function getThemeFileURI( file, themeFileURIs = [] ) {
	if ( ! isRelativePath( file ) ) {
		return;
	}

	return themeFileURIs.find( ( themeFileUri ) => themeFileUri.file === file );
}

function setUnresolvedThemeFilePaths( config ) {
	const themeFileURIs = config._links.theme_file_uris;
	const backgroundImageUrl = getThemeFileURI(
		config?.styles?.background?.backgroundImage?.url,
		themeFileURIs
	);

	// Top level styles.
	if ( !! backgroundImageUrl?.href ) {
		config.styles.background.backgroundImage.url = backgroundImageUrl.href;
	}

	return config;
}

export default function useGetThemeFileURIs( mergedConfig ) {
	if ( ! mergedConfig?.styles || ! mergedConfig?._links?.theme_file_uris ) {
		return mergedConfig;
	}
	return setUnresolvedThemeFilePaths( mergedConfig );
}
