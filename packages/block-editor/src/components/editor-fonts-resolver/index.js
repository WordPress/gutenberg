/**
 * WordPress dependencies
 */
import { useState, useEffect, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useGlobalSetting } from '../global-styles/hooks';
import { getDisplaySrcFromFontFace, loadFontFaceInBrowser } from './utils';

function EditorFontsResolver() {
	const [ loadedFontUrls ] = useState( new Set() );

	const { currentTheme } = useSelect( ( select ) => {
		return {
			currentTheme:
				// Disable Reason: Using 'core' as string to avoid circular dependency importing from @wordpress/core-data.
				// eslint-disable-next-line @wordpress/data-no-store-string-literals
				select( 'core' ).getCurrentTheme(),
		};
	}, [] );

	// Get the fonts from merged theme.json settings.fontFamilies.
	const [ fontFamilies = [] ] = useGlobalSetting( 'typography.fontFamilies' );

	const fontFaces = useMemo( () => {
		return Object.values( fontFamilies )
			.flat()
			.map( ( family ) => family.fontFace )
			.filter( Boolean )
			.flat();
	}, [ fontFamilies ] );

	const loadFontFaceAsset = async ( fontFace ) => {
		// If the font doesn't have a src, don't load it.
		if ( ! fontFace.src ) {
			return;
		}
		// Get the src of the font.
		const src = getDisplaySrcFromFontFace(
			fontFace.src,
			currentTheme?.stylesheet_uri
		);
		// If the font is already loaded, don't load it again.
		if ( ! src || loadedFontUrls.has( src ) ) {
			return;
		}
		// Load the font in the browser.
		loadFontFaceInBrowser( fontFace, src );
		// Add the font to the loaded fonts list.
		loadedFontUrls.add( src );
	};

	useEffect( () => {
		fontFaces.forEach( loadFontFaceAsset );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ fontFaces ] );

	return null;
}

export default EditorFontsResolver;
