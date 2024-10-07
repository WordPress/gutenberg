/**
 * WordPress dependencies
 */
import { useState, useMemo, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { loadFontFaceInBrowser } from './utils';
import { store as blockEditorStore } from '../../store';
import { globalStylesLinksDataKey } from '../../store/private-keys';

function resolveThemeFontFaceSrc( src, _links ) {
	const firstSrc = Array.isArray( src ) ? src[ 0 ] : src;
	return _links.find( ( link ) => link.name === firstSrc )?.href || firstSrc;
}

function useEditorFontsResolver() {
	const [ loadedFontUrls, setLoadedFontUrls ] = useState( new Set() );

	const { _links = [], fontFamilies = [] } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const _settings = getSettings();
		return {
			_links: _settings[ globalStylesLinksDataKey ]?.[ 'wp:theme-file' ],
			fontFamilies:
				_settings?.__experimentalFeatures?.typography?.fontFamilies,
		};
	}, [] );

	// eslint-disable-next-line no-console
	console.log( 'fontFamilies', fontFamilies, 'links', _links );

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

			const src = resolveThemeFontFaceSrc( fontFace.src, _links );

			if ( ! src || loadedFontUrls.has( src ) ) {
				return;
			}

			loadFontFaceInBrowser( fontFace, src, ownerDocument );
			setLoadedFontUrls( ( prevUrls ) => new Set( prevUrls ).add( src ) );
		},
		[ loadedFontUrls, _links ]
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
