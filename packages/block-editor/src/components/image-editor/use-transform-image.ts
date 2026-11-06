import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { useImageCropper } from '@wordpress/image-cropper';
import type { ImageEditorProps, TransformImage } from './types';

export default function useTransformImage( {
	naturalWidth,
	naturalHeight,
}: Pick<
	ImageEditorProps,
	'url' | 'naturalWidth' | 'naturalHeight'
> ): TransformImage {
	const { cropperState, setCropperState } = useImageCropper();
	const { zoom, aspectRatio, croppedArea, rotation } = cropperState;

	const setZoom = useCallback(
		( newZoom: number ) => {
			setCropperState( { zoom: newZoom } );
		},
		[ setCropperState ]
	);

	const setAspectRatio = useCallback(
		( newAspect: number ) => {
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
	 * Rotates the image a quarter turn clockwise. The cropper refits the
	 * view to the turned image, so nothing is redrawn. A crop with a chosen
	 * ratio or zoom keeps them; otherwise the crop follows the image's
	 * orientation.
	 */
	const rotateClockwise = useCallback( () => {
		const isDefaultAspect =
			defaultAspect === aspectRatio || rotatedAspect === aspectRatio;
		const keepsAspect = zoom !== 1 || ! isDefaultAspect;
		const nextRotation = ( rotation + 90 ) % 360;
		let nextAspect = aspectRatio;
		if ( ! keepsAspect ) {
			nextAspect =
				nextRotation % 180 === 90 ? rotatedAspect : defaultAspect;
		}
		setCropperState( {
			rotation: nextRotation,
			aspectRatio: nextAspect,
		} );
	}, [
		aspectRatio,
		defaultAspect,
		rotatedAspect,
		rotation,
		setCropperState,
		zoom,
	] );

	return useMemo(
		() => ( {
			crop: croppedArea,
			zoom,
			setZoom,
			rotation,
			rotateClockwise,
			aspect: aspectRatio,
			setAspect: setAspectRatio,
			defaultAspect,
		} ),
		[
			croppedArea,
			zoom,
			setZoom,
			rotation,
			rotateClockwise,
			aspectRatio,
			setAspectRatio,
			defaultAspect,
		]
	);
}
