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
		path: '/wp/v2/font-families',
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
		path: '/wp/v2/font-families',
		method: 'DELETE',
		data,
	};
	return apiFetch( config );
}

export async function fetchFontCollections() {
	const config = {
		path: '/wp/v2/font-collections',
		method: 'GET',
	};
	return apiFetch( config );
}

export async function fetchFontCollection( id ) {
	const config = {
		path: `/wp/v2/font-collections/${ id }`,
		method: 'GET',
	};
	return apiFetch( config );
}
