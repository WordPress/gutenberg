/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { useImageCropper } from '@wordpress/image-cropper';

export default function useTransformImage( {
	url,
	naturalWidth,
	naturalHeight,
	cropToContentBounds: initialCropBounds,
} ) {
	const [ editedUrl, setEditedUrl ] = useState();
	const [ cropToContentBounds, setCropToContentBounds ] =
		useState( initialCropBounds );
	const [ cropApplied, setCropApplied ] = useState( false );
	const { cropperState, setCropperState } = useImageCropper();
	const { zoom, aspectRatio, crop, croppedArea } = cropperState;

	const setZoom = useCallback(
		( newZoom ) => {
			setCropperState( { zoom: newZoom } );
		},
		[ setCropperState ]
	);

	const setAspectRatio = useCallback(
		( newAspect ) => {
			setCropperState( { aspectRatio: newAspect } );
		},
		[ setCropperState ]
	);

	const defaultAspect = naturalWidth / naturalHeight;
	const rotatedAspect = naturalHeight / naturalWidth;

	// Initialize aspect ratio on mount or when defaultAspect changes
	useEffect( () => {
		setAspectRatio( defaultAspect );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Update internal crop bounds when initial bounds change
	useEffect( () => {
		setCropToContentBounds( initialCropBounds );
		setCropApplied( false );
	}, [ initialCropBounds ] );

	/**
	 * Apply crop to content bounds with corrected positioning
	 */
	const applyCropToContent = useCallback( () => {
		if ( ! cropToContentBounds?.bounds ) {
			return;
		}

		const { bounds } = cropToContentBounds;

		// Calculate the aspect ratio of the content area
		const contentAspectRatio = bounds.width / bounds.height;

		// Calculate zoom needed
		const zoomX = naturalWidth / bounds.width;
		const zoomY = naturalHeight / bounds.height;
		const newZoom = Math.min( zoomX, zoomY ) * 0.985;

		// Calculate where the content center is as a percentage of image dimensions
		const contentCenterX = ( bounds.x + bounds.width / 2 ) / naturalWidth;
		const contentCenterY = ( bounds.y + bounds.height / 2 ) / naturalHeight;

		// Calculate crop offset with proper scaling
		// Through testing, we found the multiplier needs to be ~6.5x
		const cropX = ( 0.5 - contentCenterX ) * 100 * 6.5;
		const cropY = ( 0.5 - contentCenterY ) * 100 * 6.5;

		// Set everything at once
		setCropperState( {
			aspectRatio: contentAspectRatio,
			zoom: newZoom,
			crop: {
				x: cropX,
				y: cropY,
			},
		} );

		setCropApplied( true );
	}, [ cropToContentBounds, naturalWidth, naturalHeight, setCropperState ] );

	/**
	 * rotateClockwise rotates the image by 90° clockwise by drawing the original image onto a canvas with rotation applied,
	 * then saves it as a new blob URL (editedUrl).
	 * This creates a new rotated image file, bypassing the image-cropper's CSS transform rotation.
	 * It's a bespoke solution to ensure that the rotated image fills the content width.
	 */
	const [ internalRotation, setInternalRotation ] = useState( 0 );
	const rotateClockwise = useCallback( () => {
		const angle = ( internalRotation + 90 ) % 360;

		let naturalAspectRatio = defaultAspect;
		const isDefaultAspect =
			defaultAspect === aspectRatio || rotatedAspect === aspectRatio;
		const shouldResetAspect = zoom !== 1 || ! isDefaultAspect;

		if ( internalRotation % 180 === 90 ) {
			naturalAspectRatio = 1 / defaultAspect;
		}

		if ( angle === 0 ) {
			setEditedUrl();
			setInternalRotation( angle );
			const newAspectRatio = shouldResetAspect
				? aspectRatio
				: defaultAspect;
			setCropperState( {
				aspectRatio: newAspectRatio,
				crop: {
					x: -( crop.y * naturalAspectRatio ),
					y: crop.x * naturalAspectRatio,
				},
			} );
			return;
		}

		function editImage( event ) {
			const canvas = document.createElement( 'canvas' );

			let translateX = 0;
			let translateY = 0;

			if ( angle % 180 ) {
				canvas.width = event.target.height;
				canvas.height = event.target.width;
			} else {
				canvas.width = event.target.width;
				canvas.height = event.target.height;
			}

			if ( angle === 90 || angle === 180 ) {
				translateX = canvas.width;
			}

			if ( angle === 270 || angle === 180 ) {
				translateY = canvas.height;
			}

			const context = canvas.getContext( '2d' );

			context.translate( translateX, translateY );
			context.rotate( ( angle * Math.PI ) / 180 );
			context.drawImage( event.target, 0, 0 );

			canvas.toBlob( ( blob ) => {
				setEditedUrl( URL.createObjectURL( blob ) );
				setInternalRotation( angle );
				const newAspectRatio = shouldResetAspect
					? aspectRatio
					: canvas.width / canvas.height;
				setCropperState( {
					aspectRatio: newAspectRatio,
					crop: {
						x: -( crop.y * naturalAspectRatio ),
						y: crop.x * naturalAspectRatio,
					},
				} );
			} );
		}

		const el = new window.Image();
		el.src = url;
		el.onload = editImage;

		const imgCrossOrigin = applyFilters(
			'media.crossOrigin',
			undefined,
			url
		);
		if ( typeof imgCrossOrigin === 'string' ) {
			el.crossOrigin = imgCrossOrigin;
		}
	}, [
		internalRotation,
		defaultAspect,
		url,
		setCropperState,
		crop,
		zoom,
		aspectRatio,
		rotatedAspect,
		setInternalRotation,
	] );

	return useMemo(
		() => ( {
			editedUrl,
			setEditedUrl,
			crop: croppedArea,
			zoom,
			setZoom,
			rotation: internalRotation,
			rotateClockwise,
			aspect: aspectRatio,
			setAspect: setAspectRatio,
			defaultAspect,
			applyCropToContent,
			hasCropToContentBounds: !! cropToContentBounds && ! cropApplied,
			cropToContentApplied: cropApplied,
		} ),
		[
			editedUrl,
			croppedArea,
			zoom,
			setZoom,
			internalRotation,
			rotateClockwise,
			aspectRatio,
			setAspectRatio,
			defaultAspect,
			applyCropToContent,
			cropToContentBounds,
			cropApplied,
		]
	);
}
