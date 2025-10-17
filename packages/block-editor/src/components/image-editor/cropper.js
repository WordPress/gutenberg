/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';
import {
	ImageCropper as ImageCropperComponent,
	useImageCropper,
} from '@wordpress/image-cropper';

/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 * @param root0
 * @param root0.url
 * @param root0.width
 * @param root0.height
 * @param root0.naturalHeight
 * @param root0.naturalWidth
 * @param root0.borderProps
 */
export default function ImageCropper( {
	url,
	width,
	height,
	naturalHeight,
	naturalWidth,
	borderProps,
} ) {
	const { setResetState, cropperState } = useImageCropper();
	const [ contentResizeListener, { width: clientWidth } ] =
		useResizeObserver();

		// This is clunky. I think we need a dedicated modal to reduce tool clutter and to be able to focus on the image.
	let editedHeight = height || ( clientWidth * naturalHeight ) / naturalWidth;

	if ( cropperState.rotation % 180 === 90 ) {
		editedHeight = ( clientWidth * naturalWidth ) / naturalHeight;
	}

	const handleOnload = useCallback(
		( loadedMediaSize ) => {
			// setEditedHeight( loadedMediaSize.height );
			// setEditedWidth( loadedMediaSize.width );
			const newResetState = {
				aspectRatio:
					loadedMediaSize.naturalWidth /
					loadedMediaSize.naturalHeight,
				crop: {
					x: 0,
					y: 0,
					width: loadedMediaSize.naturalWidth,
					height: loadedMediaSize.naturalHeight,
				},
				zoom: 1,
				rotation: 0,
				flip: {
					horizontal: false,
					vertical: false,
				},
			};

			setResetState( newResetState );
		},
		[ setResetState ]
	);

	if ( ! url ) {
		return <Spinner />;
	}

	const area = (
		<div
			className={ clsx(
				'wp-block-image__crop-area',
				borderProps?.className,
				{
					// 'is-applying': isInProgress,
				}
			) }
			style={ {
				...borderProps?.style,
				width: width || clientWidth,
				height: editedHeight,
			} }
		>
			<ImageCropperComponent src={ url } onLoad={ handleOnload } />
			{ /* { isInProgress && <Spinner /> } */ }
		</div>
	);

	return (
		<>
			{ contentResizeListener }
			{ area }
		</>
	);
}
