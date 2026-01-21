/**
 * WordPress dependencies
 */
import { RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useImageCropper } from '@wordpress/image-cropper';

/**
 * ZoomControl component provides a slider to control image zoom level.
 * Range: 1-5 (100%-500%)
 */
export default function ZoomControl() {
	const { cropperState, setCropperState } = useImageCropper();
	const zoom = cropperState.zoom;

	const handleZoomChange = ( value: number | undefined ) => {
		if ( value !== undefined ) {
			setCropperState( { zoom: value } );
		}
	};

	return (
		<RangeControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ __( 'Zoom' ) }
			value={ zoom }
			onChange={ handleZoomChange }
			min={ 1 }
			max={ 5 }
			step={ 0.1 }
			withInputField={ false }
			help={ `${ Math.round( zoom * 100 ) }%` }
		/>
	);
}
