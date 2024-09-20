/**
 * WordPress dependencies
 */
import { useState, useMemo, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getDisplaySrcFromFontFace, loadFontFaceInBrowser } from './utils';
import { store as editorStore } from '../../store';

function useEditorFontsResolver() {
	const [ loadedFontUrls, setLoadedFontUrls ] = useState( new Set() );

	const { currentTheme = {}, fontFamilies = [] } = useSelect( ( select ) => {
		return {
			currentTheme:
				select( editorStore ).getSettings()?.__experimentalFeatures
					?.currentTheme,
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
		async ( fontFace, ownerDocument ) => {
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

			loadFontFaceInBrowser( fontFace, src, ownerDocument );
			setLoadedFontUrls( ( prevUrls ) => new Set( prevUrls ).add( src ) );
		},
		[ currentTheme, loadedFontUrls ]
	);

	return useCallback(
		( node ) => {
			if ( ! node ) {
				return;
			}

			const { ownerDocument } = node;
			fontFaces.forEach( ( fontFace ) =>
				loadFontFaceAsset( fontFace, ownerDocument )
			);
		},
		[ fontFaces, loadFontFaceAsset ]
	);
}

export default useEditorFontsResolver;
