/**
 * WordPress dependencies
 *
 */
import apiFetch from '@wordpress/api-fetch';


export async function getFontLibrary() {
    const config = {
        path: '/wp/v2/fonts_library',
    };
    const { fontFamilies } = await apiFetch( config );
    return fontFamilies;
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
        data: { fontFamilies: data },
    };
    const { fontFamilies } = await apiFetch( config );
    return fontFamilies;
}