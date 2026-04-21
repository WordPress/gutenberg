/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';
import { ImageCropper as ImageCropperComponent } from '@wordpress/image-cropper';

/**
 * Internal dependencies
 */
import { useImageEditingContext } from './context';

export default function ImageCropper( {
	url,
	width,
	height,
	naturalHeight,
	naturalWidth,
	borderProps,
} ) {
	const { isInProgress, editedUrl, rotation } = useImageEditingContext();
	const [ contentResizeListener, { width: clientWidth } ] =
		useResizeObserver();

	let editedHeight = height || ( clientWidth * naturalHeight ) / naturalWidth;

	if ( rotation % 180 === 90 ) {
		editedHeight = ( clientWidth * naturalWidth ) / naturalHeight;
	}

	const area = (
		<div
			className={ clsx(
				'wp-block-image__crop-area',
				borderProps?.className,
				{
					'is-applying': isInProgress,
				}
			) }
			style={ {
				...borderProps?.style,
				width: width || clientWidth,
				height: editedHeight,
			} }
		>
			<ImageCropperComponent src={ editedUrl || url } />
			{ isInProgress && <Spinner /> }
		</div>
	);

	return (
		<>
			{ contentResizeListener }
			{ area }
		</>
	);
}
