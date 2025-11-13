/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
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
 * ImageCropper component for editing images.
 *
 * @param {Object} props               Component props.
 * @param {string} props.url           The image URL.
 * @param {number} [props.width]       The display width of the image.
 * @param {number} [props.height]      The display height of the image.
 * @param {number} props.naturalHeight The natural height of the image.
 * @param {number} props.naturalWidth  The natural width of the image.
 * @param {Object} [props.borderProps] Border styling properties (className, style, etc.).
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
