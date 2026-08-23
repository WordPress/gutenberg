import clsx from 'clsx';
import { useContext, useEffect, useState, useRef } from '@wordpress/element';
import type { FontFamily, FontFace } from '@wordpress/core-data';
import { Skeleton } from '@wordpress/ui';
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

	const fontFace = getDisplayFontFace( font );
	const style = getFamilyPreviewStyle( font );
	text = text || ( 'name' in font ? font.name : '' );
	const customPreviewUrl = font.preview;

	const previewUrl = customPreviewUrl ?? getPreviewUrl( fontFace );
	const isPreviewImage = Boolean(
		previewUrl && /\.(png|jpg|jpeg|gif|svg)$/i.test( previewUrl )
	);

	const [ isIntersecting, setIsIntersecting ] = useState< boolean >( false );
	const [ isFontLoaded, setIsFontLoaded ] = useState< boolean >( false );
	const [ resolvedUrl, setResolvedUrl ] = useState< string >();
	const { loadFontFaceAsset } = useContext( FontLibraryContext );

	// The same component instance gets reused for different fonts, so the
	// loaded state is tracked per URL.
	const isAssetLoaded = isPreviewImage
		? !! previewUrl &&
		  ( loadedPreviews.has( previewUrl ) || resolvedUrl === previewUrl )
		: isFontLoaded;

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
		// Image previews are lazy loaded by the browser, so only font files
		// need the viewport check.
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

	useEffect( () => {
		const loadAsset = async () => {
			if ( isIntersecting && ! isPreviewImage ) {
				if ( fontFace.src ) {
					await loadFontFaceAsset( fontFace );
				}
				setIsFontLoaded( true );
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
						src={ previewUrl }
						loading="lazy"
						alt={ text }
						onLoad={ () => {
							if ( previewUrl ) {
								loadedPreviews.add( previewUrl );
							}
							setResolvedUrl( previewUrl );
						} }
						// Also on failure, otherwise skeleton will pulse forever.
						onError={ () => setResolvedUrl( previewUrl ) }
						className={ clsx(
							'font-library__font-variant_demo-image',
							{ 'is-loading': ! isAssetLoaded }
						) }
					/>
				</>
			) : (
				<span
					style={ textDemoStyle }
					className="font-library__font-variant_demo-text"
				>
					{ text }
				</span>
			) }
		</div>
	);
}

export default FontDemo;
