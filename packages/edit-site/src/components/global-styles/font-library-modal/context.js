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
	// Global Styles Fonts
    const [ customFontFamilies ] = useGlobalSetting( 'typography.fontFamilies' );
	const customFonts = customFontFamilies?.theme  || [];

	// Library Fonts
	const [ libraryFonts, setLibraryFonts ] = useState( [] );

	// Google Fonts
	const [ googleFonts, setGoogleFonts ] = useState( [] );
	const [ googleFontsCategories, setGoogleFontsCategories ] = useState( [] );

	useEffect( () => {
		getFontLibrary().then( ( response ) => {
			setLibraryFonts( response );
		} );
		getGoogleFonts().then( ( { items, categories } ) => {
			setGoogleFonts( items );
			setGoogleFontsCategories( categories );
		} );
	}, [] );

	// Set used to check if a font is already installed on the Google Fonts Tab of the modal
	const installedFontNames = useMemo( () => {
		const names = new Set();
		customFonts.forEach( ( font ) => {
			if ( font.name || font.fontFamily ) names.add( font.name || font.fontFamily );
		} );
		libraryFonts.forEach( ( font ) => {
			if ( font.name || font.fontFamily ) names.add( font.name || font.fontFamily );
		} );
		return names;
	}, [ customFonts, libraryFonts ] );

	
	const addToLibrary = ( newFontFamily ) => {
		return [ ...libraryFonts, newFontFamily ];
	}


    async function updateLibrary ( newLibrary ) {
        const newFontFamilies = await updateFontsLibrary( newLibrary );
		console.log( 'newFontFamilies', newFontFamilies );
		setLibraryFonts( newFontFamilies );
    }

	return (
		<FontLibraryContext.Provider
			value={ {
                customFonts,
				libraryFonts,
				googleFonts,
				googleFontsCategories,
				installedFontNames,
				addToLibrary,
                updateLibrary,
			} }
		>
			{ children }
		</FontLibraryContext.Provider>
	);
}

export default FontLibraryProvider;
