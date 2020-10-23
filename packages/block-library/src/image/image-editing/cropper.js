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

import useImageEditingContext from './context';

export default function ImageCropper( { url } ) {
	const {
		isInProgress,
		editedUrl,
		editedWidth,
		editedHeight,
		position,
		zoom,
		aspect,
		setPosition,
		setCrop,
		setZoom,
	} = useImageEditingContext();

	return (
		<div
			className={ classnames( 'wp-block-image__crop-area', {
				'is-applying': isInProgress,
			} ) }
			style={ {
				width: editedWidth,
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
				onCropChange={ setPosition }
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
}
