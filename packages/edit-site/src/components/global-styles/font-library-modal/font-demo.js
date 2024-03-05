/**
 * WordPress dependencies
 */
import { __experimentalText as Text } from '@wordpress/components';
import { useContext, useEffect, useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';
import {
	getFacePreviewStyle,
	getFamilyPreviewStyle,
} from './utils/preview-styles';

function getPreviewUrl( fontFace ) {
	if ( fontFace.preview ) {
		return fontFace.preview;
	}
	if ( fontFace.src ) {
		return Array.isArray( fontFace.src ) ? fontFace.src[ 0 ] : fontFace.src;
	}
}

function getDisplayFontFace( font ) {
	// if this IS a font face return it
	if ( font.fontStyle || font.fontWeight ) {
		return font;
	}
	// if this is a font family with a collection of font faces
	// return the first one that is normal and 400 OR just the first one
	if ( font.fontFace && font.fontFace.length ) {
		return (
			font.fontFace.find(
				( face ) =>
					face.fontStyle === 'normal' && face.fontWeight === '400'
			) || font.fontFace[ 0 ]
		);
	}
	// This must be a font family with no font faces
	// return a fake font face
	return {
		fontStyle: 'normal',
		fontWeight: '400',
		fontFamily: font.fontFamily,
		fake: true,
	};
}

function FontDemo( { font, text } ) {
	const ref = useRef( null );

	const fontFace = getDisplayFontFace( font );
	const style = getFamilyPreviewStyle( font );
	text = text || font.name;
	const customPreviewUrl = font.preview;

	const [ isIntersecting, setIsIntersecting ] = useState( false );
	const [ isAssetLoaded, setIsAssetLoaded ] = useState( false );
	const { loadFontFaceAsset } = useContext( FontLibraryContext );

	const previewUrl = customPreviewUrl ?? getPreviewUrl( fontFace );
	const isPreviewImage =
		previewUrl && previewUrl.match( /\.(png|jpg|jpeg|gif|svg)$/i );

	const faceStyles = getFacePreviewStyle( fontFace );
	const textDemoStyle = {
		fontSize: '18px',
		lineHeight: 1,
		opacity: isAssetLoaded ? '1' : '0',
		...style,
		...faceStyles,
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
				if ( ! isPreviewImage && fontFace.src ) {
					await loadFontFaceAsset( fontFace );
				}
				setIsAssetLoaded( true );
			}
		};
		loadAsset();
	}, [ fontFace, isIntersecting, loadFontFaceAsset, isPreviewImage ] );

	return (
		<div ref={ ref }>
			{ isPreviewImage ? (
				<img
					src={ previewUrl }
					loading="lazy"
					alt={ text }
					className="font-library-modal__font-variant_demo-image"
				/>
			) : (
				<Text
					style={ textDemoStyle }
					className="font-library-modal__font-variant_demo-text"
				>
					{ text }
				</Text>
			) }
		</div>
	);
}

export default FontDemo;
