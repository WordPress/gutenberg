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
		font_families: fonts,
	};
	const config = {
		path: '/wp/v2/fonts',
		method: 'DELETE',
		data,
	};
	return apiFetch( config );
}

export async function fetchFontCollections() {
	const config = {
		path: '/wp/v2/fonts/collections',
		method: 'GET',
	};
	return apiFetch( config );
}

export async function fetchFontCollection( id ) {
	const config = {
		path: `/wp/v2/fonts/collections/${ id }`,
		method: 'GET',
	};
	return apiFetch( config );
}
