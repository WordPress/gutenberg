/**
 * External dependencies
 */
import Cropper from 'react-easy-crop';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { MIN_ZOOM, MAX_ZOOM } from './constants';

import { useImageEditingContext } from './context';

export default function ImageCropper( {
	url,
	width,
	height,
	naturalHeight,
	naturalWidth,
	borderProps,
} ) {
	const {
		isInProgress,
		editedUrl,
		position,
		zoom,
		aspect,
		setPosition,
		setCrop,
		setZoom,
	} = useImageEditingContext();
	const [ contentHeight, setContentHeight ] = useState( height );
	const [ contentWidth, setContentWidth ] = useState( width );
	const effectContentRef = useResizeObserver(
		( [ entry ] ) => {
			setContentWidth( entry.borderBoxSize[ 0 ].inlineSize );
			setContentHeight( entry.borderBoxSize[ 0 ].blockSize );
		},
		{ box: 'border-box' }
	);

	const editedWidth = contentWidth || width || naturalWidth;
	const editedHeight = contentHeight || height || naturalHeight;

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
				width: editedWidth,
				height: editedHeight,
			} }
			ref={ effectContentRef }
		>
			<Cropper
				image={ editedUrl || url }
				disabled={ isInProgress }
				minZoom={ MIN_ZOOM / 100 }
				maxZoom={ MAX_ZOOM / 100 }
				crop={ position }
				zoom={ zoom / 100 }
				aspect={ aspect }
				onCropChange={ ( pos ) => {
					setPosition( pos );
				} }
				onCropComplete={ ( newCropPercent ) => {
					setCrop( newCropPercent );
				} }
				onZoomChange={ ( newZoom ) => {
					setZoom( newZoom * 100 );
				} }
			/>
			{ isInProgress && <Spinner /> }
		</div>
	);

	return <>{ area }</>;
}
