/**
 * External dependencies
 */
import Cropper from 'react-easy-crop';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useImageCropper } from '../../provider';
import type { Area, ImageCropperProps, MediaSize, Point } from '../../types';
import { MIN_ZOOM, MAX_ZOOM } from '../../constants';

export default function ImageCropper( {
	src,
	onLoad,
	minZoom = MIN_ZOOM,
	maxZoom = MAX_ZOOM,
	...props
}: ImageCropperProps ) {
	const { cropperState, setCropperState } = useImageCropper();
	const { crop, zoom, rotation, aspectRatio, flip } = cropperState;

	const setCrop = ( newCrop: Point ) => setCropperState( { crop: newCrop } );
	const setZoom = ( newZoom: number ) => setCropperState( { zoom: newZoom } );
	const setRotation = ( newRotation: number ) =>
		setCropperState( { rotation: newRotation } );
	const setMediaSize = ( newMediaSize: MediaSize ) =>
		setCropperState( { mediaSize: newMediaSize } );

	/**
	 * Handles the crop complete event, when a user stops interacting with the cropper.
	 * Updates the cropped area in percentages and pixels.
	 *
	 * @param {Area} areaPercentage - The area percentage.
	 * @param {Area} areaPixels     - The area pixels.
	 */
	const onCropComplete = useCallback(
		( areaPercentage: Area, areaPixels: Area ) => {
			setCropperState( {
				croppedArea: areaPercentage,
				croppedAreaPixels: areaPixels,
			} );
		},
		[ setCropperState ]
	);

	return (
		<Cropper
			classes={ {
				containerClassName: 'image-cropper__container',
				cropAreaClassName: 'image-cropper__crop-area',
				mediaClassName: 'image-cropper__image',
			} }
			minZoom={ minZoom }
			maxZoom={ maxZoom }
			rotation={ rotation }
			image={ src }
			setMediaSize={ setMediaSize }
			crop={ crop }
			zoom={ zoom }
			aspect={ aspectRatio }
			onCropChange={ setCrop }
			onZoomChange={ setZoom }
			onCropComplete={ onCropComplete }
			onMediaLoaded={ ( loadedMediaSize: MediaSize ) => {
				onLoad?.( loadedMediaSize );
			} }
			onRotationChange={ setRotation }
			transform={ [
				`translate(${ crop.x }px, ${ crop.y }px)`,
				`rotateZ(${ rotation }deg)`,
				`rotateY(${ flip.horizontal ? 180 : 0 }deg)`,
				`rotateX(${ flip.vertical ? 180 : 0 }deg)`,
				`scale(${ zoom })`,
			].join( ' ' ) }
			{ ...props }
		/>
	);
}
