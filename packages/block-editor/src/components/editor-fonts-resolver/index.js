/**
 * WordPress dependencies
 */
import { useState, useEffect, useMemo, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getDisplaySrcFromFontFace, loadFontFaceInBrowser } from './utils';
import { store as editorStore } from '../../store';

function EditorFontsResolver() {
	const [ loadedFontUrls, setLoadedFontUrls ] = useState( new Set() );

	const { currentTheme, fontFamilies = [] } = useSelect( ( select ) => {
		return {
			currentTheme:
				// Disable Reason: Using 'core' as string to avoid circular dependency importing from @wordpress/core-data.
				// eslint-disable-next-line @wordpress/data-no-store-string-literals
				select( 'core' ).getCurrentTheme(),
			fontFamilies:
				select( editorStore ).getSettings()?.__experimentalFeatures
					?.typography?.fontFamilies,
		};
	}, [] );

	const fontFaces = useMemo( () => {
		return Object.values( fontFamilies )
			.flat()
			.map( ( family ) => family.fontFace )
			.filter( Boolean )
			.flat();
	}, [ fontFamilies ] );

	const loadFontFaceAsset = useCallback(
		async ( fontFace ) => {
			if ( ! fontFace.src ) {
				return;
			}

			const src = getDisplaySrcFromFontFace(
				fontFace.src,
				currentTheme?.stylesheet_uri
			);

			if ( ! src || loadedFontUrls.has( src ) ) {
				return;
			}

			loadFontFaceInBrowser( fontFace, src );
			setLoadedFontUrls( ( prevUrls ) => new Set( prevUrls ).add( src ) );
		},
		[ currentTheme, loadedFontUrls ]
	);

	useEffect( () => {
		fontFaces.forEach( loadFontFaceAsset );
	}, [ fontFaces, loadFontFaceAsset ] );

	return null;
}

export default EditorFontsResolver;
