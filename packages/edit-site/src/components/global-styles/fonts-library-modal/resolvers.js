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
	// If data is not FormData object, we need to pass it as the body of the request.
	// We are doing this because to upload local fonts we need to use FormData
	// To homogenize the request, we are using FormData for both cases (google fonts and local fonts)

	let body = data;

	// If the data is not a FormData object, we need to create it
	// Data for google fonts is an array of font families
	if ( ! ( data instanceof FormData ) ) {
		const formData = new FormData();
		formData.append( 'fontFamilies', JSON.stringify( data ) );
		body = formData;
	}

	const config = {
		path: '/wp/v2/fonts_library',
		method: 'POST',
		body,
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
