/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { ImageCropper as ImageCropperComponent } from '@wordpress/image-cropper';

/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
;

export default function ImageCropper( {
	url,
	width,
	height,
	naturalHeight,
	naturalWidth,
	borderProps,
} ) {
	// const {
	// 	isInProgress,
	// 	editedUrl,
	// 	position,
	// 	zoom,
	// 	aspect,
	// 	setPosition,
	// 	setCrop,
	// 	setZoom,
	// 	rotation,
	// } = useImageEditingContext();
	const [ contentResizeListener, { width: clientWidth } ] =
		useResizeObserver();


	// if ( rotation % 180 === 90 ) {
	// 	editedHeight = ( clientWidth * naturalWidth ) / naturalHeight;
	// }

	const [ editedHeight, setEditedHeight ] = useState( height || ( clientWidth * naturalHeight ) / naturalWidth );
	const [ editedWidth, setEditedWidth ] = useState( width || clientWidth );

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
				width: editedWidth,
				height: editedHeight,
			} }
		>
			<ImageCropperComponent src={ url } onLoad={ ( mediaSize ) => {
				setEditedHeight( mediaSize.height );
				setEditedWidth( mediaSize.width );
			} } />
			{/* { isInProgress && <Spinner /> } */}
		</div>
	);

	return (
		<>
			{ contentResizeListener }
			{ area }
		</>
	);
}
