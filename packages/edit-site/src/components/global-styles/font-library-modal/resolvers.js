/**
 * WordPress dependencies
 *
 */
import apiFetch from '@wordpress/api-fetch';


export async function getFontLibrary() {
    const config = {
        path: '/wp/v2/fonts_library',
    };
    const data = await apiFetch( config );
    return data;
}

export async function getGoogleFonts() {
    const config = {
        path: '/wp/v2/fonts_library/google_fonts',
    };
    const { items, categories } = await apiFetch( config );
    return {
        items,
        categories,
    };
}

export async function updateFontsLibrary( data ) {
    const config = {
        path: '/wp/v2/fonts_library',
        method: 'POST',
        data: data,
    };
    const response = await apiFetch( config );
    return response;
}