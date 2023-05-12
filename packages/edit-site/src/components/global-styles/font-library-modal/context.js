/**
 * WordPress dependencies
 *
 */
import { createContext, useState, useEffect, useMemo } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 *
 */
import { getFontLibrary, getGoogleFonts, updateFontsLibrary } from './resolvers';
import { unlock } from '../../../private-apis';
const { useGlobalSetting } = unlock( blockEditorPrivateApis );

export const FontLibraryContext = createContext( {} );

function FontLibraryProvider( { children } ) {
    const [ customFonts ] = useGlobalSetting( 'typography.fontFamilies' );
	const customFontFamilies = customFonts?.theme  || [];
	const [ fontLibrary, setFontLibrary ] = useState( {} );
	const libraryFontFamilies = fontLibrary.fontFamilies || [];
	const [ googleFonts, setGoogleFonts ] = useState( [] );
	const [ googleFontsCategories, setGoogleFontsCategories ] = useState( [] );

	useEffect( () => {
		getFontLibrary().then( ( response ) => {
			setFontLibrary( response );
		} );
		getGoogleFonts().then( ( { items, categories } ) => {
			setGoogleFonts( items );
			setGoogleFontsCategories( categories );
		} );
	}, [] );

	const installedFontNames = useMemo( () => {
		const names = new Set();
		customFontFamilies.forEach( ( font ) => {
			if (font.name || font.fontFamily) names.add( font.name || font.fontFamily );
		} );
		libraryFontFamilies.forEach( ( font ) => {
			if (font.name || font.fontFamily) names.add( font.name || font.fontFamily );
		} );
		return names;
	}, [ customFontFamilies, fontLibrary ] );

	console.log(installedFontNames);

    async function installGoogleFonts ( fonts ) {
        const response = await updateFontsLibrary( fonts );
        return response;
    }

	return (
		<FontLibraryContext.Provider
			value={ {
                customFontFamilies,
				fontLibrary,
				googleFonts,
				googleFontsCategories,
				installedFontNames,
                installGoogleFonts,
			} }
		>
			{ children }
		</FontLibraryContext.Provider>
	);
}

export default FontLibraryProvider;
