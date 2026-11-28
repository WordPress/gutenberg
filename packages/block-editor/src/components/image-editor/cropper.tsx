import clsx from 'clsx';
import { Spinner as WCSpinner } from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';
import { ImageCropper as ImageCropperComponent } from '@wordpress/image-cropper';
import { useImageEditingContext } from './context';
import type { ImageEditorCropperProps } from './types';

export default function ImageCropper( {
	url,
	width,
	height,
	naturalHeight,
	naturalWidth,
	borderProps,
}: ImageEditorCropperProps ) {
	const { isInProgress, editedUrl, rotation } = useImageEditingContext();
	const [ contentResizeListener, { width: clientWidth } ] =
		useResizeObserver();

	// Arithmetic reads an unmeasured width as 0.
	let editedHeight =
		height || ( ( clientWidth as number ) * naturalHeight ) / naturalWidth;

	if ( rotation % 180 === 90 ) {
		editedHeight =
			( ( clientWidth as number ) * naturalWidth ) / naturalHeight;
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
				// An unmeasured width is left unset.
				width: ( width || clientWidth ) as number | undefined,
				height: editedHeight,
			} }
		>
			<ImageCropperComponent src={ editedUrl || url } />
			{ isInProgress && <WCSpinner /> }
		</div>
	);

	return (
		<>
			{ contentResizeListener }
			{ area }
		</>
	);
}
