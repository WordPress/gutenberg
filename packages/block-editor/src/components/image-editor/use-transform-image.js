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
} ) {
	const [ editedUrl, setEditedUrl ] = useState();
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

	/**
	 * rotateClockwise rotates the image by 90° clockwise by drawing the original image onto a canvas with rotation applied,
	 * then saves it as a new blob URL (editedUrl).
	 * This creates a new rotated image file, bypassing the image-cropper’s CSS transform rotation.
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
		]
	);
}
