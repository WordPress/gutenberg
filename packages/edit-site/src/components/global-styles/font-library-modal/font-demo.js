/**
 * WordPress dependencies
 */
import { __experimentalText as Text } from '@wordpress/components';
import { useContext, useEffect, useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';
import { getFacePreviewStyle } from './utils/preview-styles';

function FontFaceDemo( { fontFace, text, style = {} } ) {
	const ref = useRef( null );
	const [ isIntersecting, setIsIntersecting ] = useState( false );
	const [ isAssetLoaded, setIsAssetLoaded ] = useState( false );
	const { loadFontFaceAsset } = useContext( FontLibraryContext );

	const faceStyles = getFacePreviewStyle( fontFace );

	const demoStyle = {
		flexShrink: 0,
		fontSize: '18px',
		opacity: isAssetLoaded ? '1' : '0',
		transition: 'opacity 0.3s ease-in-out',
		...faceStyles,
		...style,
	};

	useEffect( () => {
		const observer = new window.IntersectionObserver( ( [ entry ] ) => {
			setIsIntersecting( entry.isIntersecting );
		}, {} );
		observer.observe( ref.current );
		return () => observer.disconnect();
	}, [ ref ] );

	useEffect( () => {
		const loadAsset = async () => {
			if ( isIntersecting ) {
				if ( fontFace.src ) {
					await loadFontFaceAsset( fontFace );
				}
				setIsAssetLoaded( true );
			}
		};
		loadAsset();
	}, [ fontFace, isIntersecting, loadFontFaceAsset ] );

	return (
		<Text style={ demoStyle } ref={ ref }>
			{ text }
		</Text>
	);
}

export default FontFaceDemo;
