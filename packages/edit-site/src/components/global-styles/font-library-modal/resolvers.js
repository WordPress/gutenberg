/**
 * WordPress dependencies
 *
 */
/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

export async function fetchGoogleFonts() {
	const config = {
		path: '/wp/v2/fonts_library/google_fonts',
	};
	const { fontFamilies, categories } = await apiFetch( config );
	return {
		fontFamilies,
		categories,
	};
}

export async function fetchInstallFonts( data ) {

	// If data is a FormData object, we need to pass it as the body of the request.
	// Otherwise, we pass it as the data property of the request.
	// This is because FormData objects are not JSON serializable.
	// For Google fonts we use JSON and for  local fonts we use FormData to be able to send the files
	const content = data instanceof FormData
		? { body: data }
		: { data: { fontFamilies: data } };

	const config = {
		path: '/wp/v2/fonts_library',
		method: 'POST',
		...content,
	};
	
	const response = await apiFetch( config );
	return response;
}

export async function fetchUninstallFonts( data ) {
	const config = {
		path: '/wp/v2/fonts_library',
		method: 'DELETE',
		data,
	};
	const response = await apiFetch( config );
	const { fontFamilies } = await JSON.parse( response );
	return fontFamilies;
}
