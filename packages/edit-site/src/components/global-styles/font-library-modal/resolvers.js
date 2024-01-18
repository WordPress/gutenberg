/**
 * WordPress dependencies
 *
 */
/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

export async function fetchInstallFontFamily( data ) {
	const config = {
		path: '/wp/v2/font-families',
		method: 'POST',
		body: data,
	};
	const response = await apiFetch( config );
	return {
		id: response.id,
		...response.font_family_settings,
		fontFace: [],
	};
}

export async function fetchInstallFontFace( fontFamilyId, data ) {
	const config = {
		path: `/wp/v2/font-families/${ fontFamilyId }/font-faces`,
		method: 'POST',
		body: data,
	};
	const response = await apiFetch( config );
	return {
		id: response.id,
		...response.font_face_settings,
	};
}

export async function fetchGetFontFamilyBySlug( slug ) {
	const config = {
		path: `/wp/v2/font-families?slug=${ slug }&_embed=true`,
		method: 'GET',
	};
	const response = await apiFetch( config );
	if ( ! response || response.length === 0 ) {
		return null;
	}
	const fontFamilyPost = response[ 0 ];
	return {
		id: fontFamilyPost.id,
		...fontFamilyPost.font_family_settings,
		fontFace:
			fontFamilyPost?._embedded?.font_faces.map(
				( face ) => face.font_face_settings
			) || [],
	};
}

export async function fetchUninstallFontFamily( fontFamilyId ) {
	const config = {
		path: `/wp/v2/font-families/${ fontFamilyId }?force=true`,
		method: 'DELETE',
	};
	return await apiFetch( config );
}

export async function fetchFontCollections() {
	const config = {
		path: '/wp/v2/font-collections',
		method: 'GET',
	};
	return await apiFetch( config );
}

export async function fetchFontCollection( id ) {
	const config = {
		path: `/wp/v2/font-collections/${ id }`,
		method: 'GET',
	};
	return await apiFetch( config );
}
