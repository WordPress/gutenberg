/**
 * WordPress dependencies
 *
 */
/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

export async function fetchInstallFonts( data ) {
	const config = {
		path: '/wp/v2/fonts',
		method: 'POST',
		body: data,
	};
	return apiFetch( config );
}

export async function fetchUninstallFonts( fonts ) {
	const data = {
		fontFamilies: fonts,
	};
	const config = {
		path: '/wp/v2/fonts',
		method: 'DELETE',
		data,
	};
	return apiFetch( config );
}
