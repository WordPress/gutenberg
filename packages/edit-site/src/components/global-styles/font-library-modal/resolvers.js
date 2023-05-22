/**
 * WordPress dependencies
 *
 */
import apiFetch from '@wordpress/api-fetch';


export async function getFontLibrary() {
    const config = {
        path: '/wp/v2/fonts_library',
    };
    const response = await apiFetch( config );
    const { fontFamilies } = await JSON.parse( response );
    return fontFamilies;
}

export async function getGoogleFonts() {
    const config = {
        path: '/wp/v2/fonts_library/google_fonts',
    };
    const { fontFamilies, categories } = await apiFetch( config );
    return {
        fontFamilies,
        categories,
    };
}

export async function postInstallFonts( data ) {
    const config = {
        path: '/wp/v2/fonts_library/install',
        method: 'POST',
        data: data,
    };
    const response = await apiFetch( config );
    const { fontFamilies } = await JSON.parse( response );
    return fontFamilies;
}