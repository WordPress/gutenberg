/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useContext, useEffect, useState, useRef } from '@wordpress/element';
import type { FontFamily, FontFace } from '@wordpress/core-data';
import { Text, Skeleton } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';
import {
	getFacePreviewStyle,
	getFamilyPreviewStyle,
} from './utils/preview-styles';
import type { FontDemoProps } from './types';

// Previews already loaded this session, so reopening the library doesn't flash
// a placeholder for images the browser already has.
const loadedPreviews = new Set< string >();

function getPreviewUrl( fontFace: FontFace ): string | undefined {
	if ( fontFace.preview ) {
		return fontFace.preview;
	}
	if ( fontFace.src ) {
		return Array.isArray( fontFace.src ) ? fontFace.src[ 0 ] : fontFace.src;
	}
	return undefined;
}

function getDisplayFontFace( font: FontFamily | FontFace ): FontFace {
	// if this IS a font face return it
	if (
		( 'fontStyle' in font && font.fontStyle ) ||
		( 'fontWeight' in font && font.fontWeight )
	) {
		return font;
	}
	// if this is a font family with a collection of font faces
	// return the first one that is normal and 400 OR just the first one
	if ( 'fontFace' in font && font.fontFace && font.fontFace.length ) {
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
	};
}

function FontDemo( { font, text }: FontDemoProps ) {
	const ref = useRef< HTMLDivElement >( null );
	const imgRef = useRef< HTMLImageElement >( null );

	const fontFace = getDisplayFontFace( font );
	const style = getFamilyPreviewStyle( font );
	text = text || ( 'name' in font ? font.name : '' );
	const customPreviewUrl = font.preview;

	const previewUrl = customPreviewUrl ?? getPreviewUrl( fontFace );
	const isPreviewImage = Boolean(
		previewUrl && /\.(png|jpg|jpeg|gif|svg)$/i.test( previewUrl )
	);

	const [ isIntersecting, setIsIntersecting ] = useState< boolean >( false );
	const [ isAssetLoaded, setIsAssetLoaded ] = useState< boolean >(
		() => !! previewUrl && loadedPreviews.has( previewUrl )
	);
	const { loadFontFaceAsset } = useContext( FontLibraryContext );

	// The previews scale with the label, so estimate ~12px per character.
	const estimatedImageWidth = Math.min(
		Math.max( text.length * 12, 48 ),
		300
	);

	const faceStyles = getFacePreviewStyle( fontFace );
	const textDemoStyle = {
		fontSize: '18px',
		lineHeight: 1,
		opacity: isAssetLoaded ? '1' : '0',
		...style,
		...faceStyles,
	};

	useEffect( () => {
		// Only font files need the viewport check. Image previews are lazy
		// loaded by the browser, and every row in the collection has one.
		if ( isPreviewImage ) {
			return;
		}
		const observer = new window.IntersectionObserver( ( [ entry ] ) => {
			setIsIntersecting( entry.isIntersecting );
		}, {} );
		if ( ref.current ) {
			observer.observe( ref.current );
		}
		return () => observer.disconnect();
	}, [ isPreviewImage ] );

	// Re-check on preview change, since an already complete image won't fire
	// onLoad and the component is reused across fonts.
	useEffect( () => {
		setIsAssetLoaded(
			( !! previewUrl && loadedPreviews.has( previewUrl ) ) ||
				!! imgRef.current?.complete
		);
	}, [ previewUrl ] );

	useEffect( () => {
		const loadAsset = async () => {
			if ( isIntersecting && ! isPreviewImage ) {
				if ( fontFace.src ) {
					await loadFontFaceAsset( fontFace );
				}
				setIsAssetLoaded( true );
			}
		};
		loadAsset();
	}, [ fontFace, isIntersecting, loadFontFaceAsset, isPreviewImage ] );

	return (
		<div ref={ ref } className="font-library__font-demo">
			{ isPreviewImage ? (
				<>
					{ ! isAssetLoaded && (
						<Skeleton
							className="font-library__font-variant-demo-skeleton"
							style={ { width: estimatedImageWidth } }
						/>
					) }
					<img
						ref={ imgRef }
						src={ previewUrl }
						loading="lazy"
						alt={ text }
						onLoad={ () => {
							if ( previewUrl ) {
								loadedPreviews.add( previewUrl );
							}
							setIsAssetLoaded( true );
						} }
						// Also on failure, otherwise it pulses forever.
						onError={ () => setIsAssetLoaded( true ) }
						className={ clsx(
							'font-library__font-variant_demo-image',
							{ 'is-loading': ! isAssetLoaded }
						) }
					/>
				</>
			) : (
				<Text
					style={ textDemoStyle }
					className="font-library__font-variant_demo-text"
				>
					{ text }
				</Text>
			) }
		</div>
	);
}

export default FontDemo;
