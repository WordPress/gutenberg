/**
 * External dependencies
 */
import Cropper from 'react-easy-crop';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { MIN_ZOOM, MAX_ZOOM } from './constants';

import { useImageEditingContext } from './context';

export default function ImageCropper( {
	url,
	width,
	height,
	clientWidth,
	naturalHeight,
	naturalWidth,
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
		rotation,
	} = useImageEditingContext();

	let editedHeight = height || ( clientWidth * naturalHeight ) / naturalWidth;

	if ( rotation % 180 === 90 ) {
		editedHeight = ( clientWidth * naturalWidth ) / naturalHeight;
	}

	return (
		<div
			className={ classnames( 'wp-block-image__crop-area', {
				'is-applying': isInProgress,
			} ) }
			style={ {
				width: width || clientWidth,
				height: editedHeight,
			} }
		>
			<Cropper
				image={ editedUrl || url }
				disabled={ isInProgress }
				minZoom={ MIN_ZOOM / 100 }
				maxZoom={ MAX_ZOOM / 100 }
				crop={ position }
				zoom={ zoom / 100 }
				aspect={ aspect }
				onCropChange={ ( newPosition ) => {
					if (
						! Number.isNaN( newPosition.x ) &&
						! Number.isNaN( newPosition.y )
					) {
						setPosition( newPosition );
					}
				} }
				onCropComplete={ ( newCropPercent ) => {
					if (
						! Number.isNaN( newCropPercent.x ) &&
						! Number.isNaN( newCropPercent.y ) &&
						! Number.isNaN( newCropPercent.width ) &&
						! Number.isNaN( newCropPercent.height )
					) {
						setCrop( newCropPercent );
					}
				} }
				onZoomChange={ ( newZoom ) => {
					setZoom( newZoom * 100 );
				} }
			/>
			{ isInProgress && <Spinner /> }
		</div>
	);
}
