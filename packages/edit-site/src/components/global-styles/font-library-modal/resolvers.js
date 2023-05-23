/**
 * WordPress dependencies
 *
 */
import apiFetch from '@wordpress/api-fetch';


export async function fetchFontLibrary() {
    const config = {
        path: '/wp/v2/fonts_library',
    };
    const response = await apiFetch( config );
    const { fontFamilies } = await JSON.parse( response );
    return fontFamilies;
}

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
    const config = {
        path: '/wp/v2/fonts_library',
        method: 'POST',
        data: data,
    };
    const response = await apiFetch( config );
    const { fontFamilies } = await JSON.parse( response );
    return fontFamilies;
}

export async function fetchUninstallFonts( data ) {
    const config = {
        path: '/wp/v2/fonts_library',
        method: 'DELETE',
        data: data,
    };
    const response = await apiFetch( config );
    const { fontFamilies } = await JSON.parse( response );
    return fontFamilies;
}