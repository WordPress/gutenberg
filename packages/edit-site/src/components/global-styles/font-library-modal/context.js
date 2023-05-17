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
import { use } from '@wordpress/data';
const { useGlobalSetting } = unlock( blockEditorPrivateApis );

export const FontLibraryContext = createContext( {} );

function FontLibraryProvider( { children } ) {
	// Global settings fonts
    const [ fontFamilies, setFontFamilies ] = useGlobalSetting( 'typography.fontFamilies' );

	const themeFonts = fontFamilies.theme || [];
	const customFonts = fontFamilies.custom || [];

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
			setGoogleFontsCategories( categories );
		} );
	}, [] );

	const getAvailableFontsOutline = ( fontFamilies ) => {
		const outline = fontFamilies.reduce( ( acc, font ) => {
				if ( !font.shouldBeRemoved ) {
					const availableFontFaces = (font?.fontFace || []).reduce( (faces, face) => (
						!face.shouldBeRemoved ? [...faces, face.fontStyle + face.fontWeight] : faces
					), [] );
					if ( availableFontFaces.length ) {
						acc[ font.name ] = availableFontFaces;
					}
				}
				return acc;
			}
		, {} );
		return outline;
	}

	const installedFontsOutline = useMemo( () => {
		return getAvailableFontsOutline( installedFonts );
	}, [ installedFonts ] );

	const isFontInstalled = ( name, style, weight ) => {
		if (!style && !weight) {
			return !!installedFontsOutline[ name ];
		}
		return installedFontsOutline[ name ]?.includes( style + weight );
	}
	
    async function updateLibrary () {
        const newLibraryFonts = await updateFontsLibrary( libraryFonts );
		setLibraryFonts( newLibraryFonts );
    }

	const toggleInstallFont = ( name, fontFace ) => {
		console.log("libraryFonts", libraryFonts);
		const libraryFont = libraryFonts.find( ( font ) => font.name === name );
		const font = googleFonts.find( ( font ) => font.name === name );
		let newLibraryFonts;
		let newFontFaces;
		
		if ( !fontFace ) { // Entire font family
			if ( libraryFont ){ // If the font is already installed
				newLibraryFonts = libraryFonts.map( font => {
					if ( font.name === name ) {
						// This logic handles several sucesive install/remove calls for a font family in the client
						const { shouldBeRemoved, fontFace: familyFaces, ...restFont } = font;
						const newFont = {
							...restFont,
							fontFace: familyFaces.map( face => {
								const { shouldBeRemoved, ...restFace } = face;
								return { ...restFace, ...(!shouldBeRemoved ? { shouldBeRemoved: true } : {}) };
							} ),
							...(!shouldBeRemoved ? { shouldBeRemoved: true } : {}),
						};
						return newFont;
					}
					return font;
				});
			} else { // If the font is not installed
				newLibraryFonts = [ ...libraryFonts, font ];
			}

		} else { // Single font variant
			const libraryFontFace = (libraryFont?.fontFace || []).find( ( face ) => face.fontStyle === fontFace.fontStyle && face.fontWeight === fontFace.fontWeight );
			
			if ( !libraryFont ) { // If the font is not installed the fontface should be missing so we add it to the library
				newLibraryFonts = [ ...libraryFonts, { ...font, fontFace: [ fontFace ] } ];
			} else {
				//If the font is already installed the fontface the font face could be installed or not
				if ( libraryFontFace ) {
					const { shouldBeRemoved, ...restFontFace } = libraryFontFace;
					newFontFaces = libraryFont.fontFace.map( face => (
						face.fontStyle === fontFace.fontStyle && face.fontWeight === fontFace.fontWeight
						? { ...restFontFace, ...(!shouldBeRemoved ? { shouldBeRemoved: true } : {}) }
						: face
					));
				} else {
					newFontFaces = [ ...libraryFont.fontFace, fontFace ];
				}
				// Update the font face of a existing font
				newLibraryFonts = libraryFonts.map( font => {
					if ( font.name === name ) {
						const { shouldBeRemoved, ...restFont } = font;
						return {
							...restFont,
							fontFace: newFontFaces,
							...(!shouldBeRemoved ? { shouldBeRemoved: true } : {})
						};
					}
					return font;
				});

			}

		}
		console.log("newLibraryFonts", newLibraryFonts);
		setLibraryFonts( newLibraryFonts );
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
				isFontInstalled,
				googleFonts,
				googleFontsCategories,
				loadFontFaceAsset,
                updateLibrary,
				toggleActivateFont,
				toggleInstallFont,
			} }
		>
			{ children }
		</FontLibraryContext.Provider>
	);
}

export default FontLibraryProvider;
