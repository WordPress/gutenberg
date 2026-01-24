import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { analyzeCropToContent } from './crop-to-content-analyzer';

/**
 * Custom hook to analyze an image for crop-to-content bounds
 *
 * @param {string} imageUrl      - URL of the image to analyze
 * @param {number} naturalWidth  - Natural width of the image
 * @param {number} naturalHeight - Natural height of the image
 * @param {Object} context       - Block context (to check for parent blocks)
 * @return {Object} Object containing cropToContentBounds and isAnalyzingCrop
 */
export function useCropToContentAnalysis(
	imageUrl,
	naturalWidth,
	naturalHeight,
	context = {}
) {
	const [ cropToContentBounds, setCropToContentBounds ] = useState( null );
	const [ isAnalyzingCrop, setIsAnalyzingCrop ] = useState( false );

	useEffect( () => {
		if ( ! imageUrl || ! naturalWidth || ! naturalHeight ) {
			setCropToContentBounds( null );
			return;
		}

		// Don't analyze images inside Gallery blocks - they have their own cropping
		if ( context?.allowResize === false ) {
			setCropToContentBounds( null );
			return;
		}

		// Support formats with transparency (PNG, WebP, AVIF) and solid backgrounds (JPEG)
		const imageExt = imageUrl.toLowerCase();
		const hasTransparency =
			imageExt.endsWith( '.png' ) ||
			imageExt.endsWith( '.webp' ) ||
			imageExt.endsWith( '.avif' );
		const isJPEG = imageExt.match( /\.jpe?g(\?|$)/i );

		// Only analyze supported formats
		if ( ! hasTransparency && ! isJPEG ) {
			setCropToContentBounds( null );
			return;
		}

		let isCancelled = false;
		setIsAnalyzingCrop( true );

		analyzeCropToContent( imageUrl, naturalWidth, naturalHeight )
			.then( ( result ) => {
				if ( ! isCancelled ) {
					if ( result?.success ) {
						setCropToContentBounds( result );
					} else {
						setCropToContentBounds( null );
					}
					setIsAnalyzingCrop( false );
				}
			} )
			.catch( () => {
				if ( ! isCancelled ) {
					setCropToContentBounds( null );
					setIsAnalyzingCrop( false );
				}
			} );

		return () => {
			isCancelled = true;
		};
	}, [ imageUrl, naturalWidth, naturalHeight, context ] );

	return {
		cropToContentBounds,
		isAnalyzingCrop,
	};
}
