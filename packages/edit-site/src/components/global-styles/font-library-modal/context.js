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
import { DEMO_TEXT } from './constants';
const { useGlobalSetting } = unlock( blockEditorPrivateApis );

export const FontLibraryContext = createContext( {} );

function FontLibraryProvider( { children } ) {
	// Global settings fonts
    const [ fontFamilies, setFontFamilies ] = useGlobalSetting( 'typography.fontFamilies' );

	const themeFonts = fontFamilies.theme || [];
	const customFonts = fontFamilies.custom || [];

	// // Fonts added by theme
	// const [ { theme: themeFonts = [] } = baseFonts ] = useGlobalSetting( 'typography.fontFamilies', null, 'base' );
	// // Active fonts ( global styles )
	// const [ { custom: customFonts = [] } = baseFonts, setCustomFonts ] = useGlobalSetting( 'typography.fontFamilies', null, 'user' );

	console.log("fontFamilies", fontFamilies);
	console.log("themeFonts", themeFonts);
	console.log("customFonts", customFonts);

	// Library Fonts
	const [ libraryFonts, setLibraryFonts ] = useState( [] );

	// Installed fonts
	const installedFonts = useMemo( () => (
		[ ...themeFonts, ...libraryFonts ]
	), [ themeFonts, libraryFonts ] );

	// Google Fonts
	const [ googleFonts, setGoogleFonts ] = useState( [] );
	const [ googleFontsCategories, setGoogleFontsCategories ] = useState( [] );
	
	// Demo
	const loadedFontUrls = new Set();
	const [ demoText, setDemoText ] = useState( DEMO_TEXT );

	useEffect( () => {
		getFontLibrary().then( ( response ) => {
			setLibraryFonts( response );
		} );
		getGoogleFonts().then( ( { fontFamilies, categories } ) => {
			setGoogleFonts( fontFamilies );
			console.log("googleFonts", fontFamilies, "categories", categories);
			setGoogleFontsCategories( categories );
		} );
	}, [] );

	// Set used to check if a font is already installed on the Google Fonts Tab of the modal
	const installedFontNames = useMemo( () => {
		const names = new Set();
		themeFonts.forEach( ( font ) => {
			if ( font.name || font.fontFamily ) names.add( font.name || font.fontFamily );
		} );
		libraryFonts.forEach( ( font ) => {
			if ( font.name || font.fontFamily ) names.add( font.name || font.fontFamily );
		} );
		return names;
	}, [ themeFonts, libraryFonts ] );

	
	const addToLibrary = ( newFontFamily ) => {
		return [ ...libraryFonts, newFontFamily ];
	}

    async function updateLibrary ( newLibrary ) {
        const newFontFamilies = await updateFontsLibrary( newLibrary );
		setLibraryFonts( newFontFamilies );
    }

	const toggleActivateFont = ( name, style, weight ) => {
		console.log("toggleActivateFont", name, style, weight);
		const installedFont = installedFonts.find( ( font ) => font.name === name );
		const activatedFont = customFonts.find( ( font ) => font.name === name );
		let newCustomFonts;
	
		// Entire font family
		if ( !style || !weight ) {
			if ( !activatedFont ) { 
				// If the font is not active, activate the entire font family
				newCustomFonts = [ ...customFonts, installedFont ];
			} else {
				// If the font is already active, deactivate the entire font family
				newCustomFonts = customFonts.filter( ( font ) => font.name !== name );
			}
		} else { //single font variant
			let newFontFaces;
			
			const activatedFontFace = (activatedFont.fontFace || []).find(face => face.fontWeight === weight && face.fontStyle === style);
	
			// If the font family is active
			if ( activatedFont ) {
				// If the font variant is active
				if ( activatedFontFace ) {
					// Deactivate the font variant
					newFontFaces = activatedFont.fontFace.filter( ( face ) => face.fontWeight !== weight || face.fontStyle !== style );
				} else {
					// Activate the font variant
					const fontFaceToAdd = installedFont.fontFace.find( ( face ) => face.fontWeight === weight && face.fontStyle === style );
					newFontFaces = [ ...activatedFont.fontFace, fontFaceToAdd ];
				}
			} else {
				// If the font family is not active, activate the font family with the font variant
				const fontFaceToAdd = installedFont.fontFace.find( ( face ) => face.fontWeight === weight && face.fontStyle === style );
				newFontFaces = [ fontFaceToAdd ];
			}
	
			// set the newFontFaces in the newCustomFonts
			newCustomFonts = customFonts.map( font => font.name === name ? { ...font, fontFace: newFontFaces } : font);
		}
	

		console.log("toggleActivateFont", newCustomFonts);
		setFontFamilies( {
			theme: themeFonts,
			custom: newCustomFonts,
		} );
	}

	// Load a font asset from a url
	const loadFontFaceAsset = async ( fontFace ) => {
		const src = Array.isArray( fontFace.src ) ? fontFace.src[ 0 ] : fontFace.src;

		if ( loadedFontUrls.has( src ) ) {
			return;
		}

		const newFont = new FontFace( fontFace.fontFamily, `url( ${ src } )`, {
			style: fontFace.fontStyle,
			weight: fontFace.fontWeight,
		} );

		const loadedFace = await newFont.load();
		loadedFontUrls.add( src );
		document.fonts.add( loadedFace );
	}

	return (
		<FontLibraryContext.Provider
			value={ {
				demoText,
                themeFonts,
				customFonts,
				libraryFonts,
				installedFonts,
				installedFontNames,
				googleFonts,
				googleFontsCategories,
				loadFontFaceAsset,
				addToLibrary,
                updateLibrary,
				toggleActivateFont,
			} }
		>
			{ children }
		</FontLibraryContext.Provider>
	);
}

export default FontLibraryProvider;
