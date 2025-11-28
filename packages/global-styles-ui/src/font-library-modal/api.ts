/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import type {
	CollectionFontFace,
	CollectionFontFamily,
	FontFace,
} from '@wordpress/core-data';

const FONT_FAMILIES_URL = '/wp/v2/font-families';

export async function fetchInstallFontFamily( data: FormData ) {
	const config = {
		path: FONT_FAMILIES_URL,
		method: 'POST',
		body: data,
	};
	const response: CollectionFontFamily = await apiFetch( config );
	return {
		id: response.id as string,
		...response.font_family_settings,
		fontFace: [],
	};
}

export async function fetchInstallFontFace(
	fontFamilyId: string,
	data: FormData
): Promise< FontFace > {
	const config = {
		path: `${ FONT_FAMILIES_URL }/${ fontFamilyId }/font-faces`,
		method: 'POST',
		body: data,
	};
	const response = ( await apiFetch( config ) ) as CollectionFontFace;
	return {
		id: response.id,
		...response.font_face_settings,
	};
}
