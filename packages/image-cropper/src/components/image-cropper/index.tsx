import { useCallback, useEffect } from '@wordpress/element';
import { ImageEditorCanvas, type Size } from '@wordpress/image-editor';
import { useImageCropperInternals } from '../../provider';
import type { ImageCropperProps } from '../../types';
import { MAX_ZOOM } from '../../constants';

export default function ImageCropper( {
	src,
	onLoad,
	maxZoom = MAX_ZOOM,
}: ImageCropperProps ) {
	const { controller, setMaxZoom } = useImageCropperInternals();

	useEffect( () => {
		setMaxZoom( maxZoom );
	}, [ maxZoom, setMaxZoom ] );

	const handleImageLoaded = useCallback(
		( size: Size ) => {
			onLoad?.( {
				width: size.width,
				height: size.height,
				naturalWidth: size.width,
				naturalHeight: size.height,
			} );
		},
		[ onLoad ]
	);

	return (
		<ImageEditorCanvas
			src={ src }
			controller={ controller }
			className="image-cropper__container"
			freeformCrop={ false }
			// The old library showed its rule-of-thirds grid by default.
			showGrid
			showDimensions={ false }
			onImageLoaded={ handleImageLoaded }
		/>
	);
}
