/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalText as Text } from '@wordpress/components';
import { useContext, useEffect, useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';

function FontFaceDemo( { fontFace, text, style = {} } ) {
	const ref = useRef( null );
	const [ isIntersecting, setIsIntersecting ] = useState( false );
	const [ isAssetLoaded, setIsAssetLoaded ] = useState( false );
	const { demoConfig, loadFontFaceAsset } = useContext( FontLibraryContext );
	const { fontFamily, fontStyle, fontWeight } = fontFace;

	const demoStyle = {
		fontWeight,
		fontStyle,
		fontFamily,
		flexShrink: 0,
		fontSize: `${ demoConfig.fontSize }px`,
		opacity: isAssetLoaded ? '1' : '0',
		transition: 'opacity 0.3s ease-in-out',
		...style,
	};

	useEffect( () => {
		const observer = new IntersectionObserver( ( [ entry ] ) => {
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
	}, [ fontFace, isIntersecting ] );

	return (
		<Text style={ demoStyle } ref={ ref }>
			{ demoConfig.text || text }
		</Text>
	);
}

export default FontFaceDemo;
