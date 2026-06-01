/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { store as coreDataStore } from '@wordpress/core-data';
import type {
	CollectionFontFace,
	CollectionFontFamily,
	FontFace,
} from '@wordpress/core-data';
import type { DataRegistry } from '@wordpress/data';

const FONT_FAMILIES_URL = '/wp/v2/font-families';

/**
 * Invalidates the cache for font family queries.
 * This should be called after installing fonts
 * to ensure the UI reflects the latest state.
 *
 * @param registry The data registry to use for dispatching actions.
 */
export function invalidateFontFamilyCache( registry: DataRegistry ) {
	const { receiveEntityRecords } = registry.dispatch( coreDataStore );

	// Invalidate all font family queries
	// Ideally there should be a dedicated action to do this
	// "invalide all cacches for this entity type"
	receiveEntityRecords(
		'postType',
		'wp_font_family',
		[],
		undefined,
		true // invalidateCache
	);
}

export async function fetchInstallFontFamily(
	data: FormData,
	registry: DataRegistry
) {
	const config = {
		path: FONT_FAMILIES_URL,
		method: 'POST',
		body: data,
	};
	const response: CollectionFontFamily = await apiFetch( config );
	invalidateFontFamilyCache( registry );

	return {
		id: response.id as string,
		...response.font_family_settings,
		fontFace: [],
	};
}

export async function fetchInstallFontFace(
	fontFamilyId: string,
	data: FormData,
	registry: DataRegistry
): Promise< FontFace > {
	const config = {
		path: `${ FONT_FAMILIES_URL }/${ fontFamilyId }/font-faces`,
		method: 'POST',
		body: data,
	};
	const response = ( await apiFetch( config ) ) as CollectionFontFace;
	invalidateFontFamilyCache( registry );
	return {
		id: response.id,
		...response.font_face_settings,
	};
}

export async function fetchDeleteFontFace(
	fontFamilyId: string,
	fontFaceId: string
) {
	const attempts = [
		`${ FONT_FAMILIES_URL }/${ fontFamilyId }/font-faces/${ fontFaceId }?force=true`,
		`/wp/v2/font-faces/${ fontFaceId }?force=true`,
	];

	let lastError: unknown;

	for ( const path of attempts ) {
		try {
			const response = await apiFetch( {
				path,
				method: 'DELETE',
			} );
			return response;
		} catch ( error ) {
			lastError = error;
		}
	}

	throw lastError;
}
