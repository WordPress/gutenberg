/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useImageCropper } from '@wordpress/image-cropper';

/**
 * Internal dependencies
 */
import { getCommonAspectRatios } from '../../utils/aspect-ratio';
import { useMediaEditorContext } from '../media-editor-provider';

/**
 * AspectRatioControl component provides a dropdown to select aspect ratio presets.
 * Includes Original, 1:1, 16:9, 4:3, 3:2, 3:4, 2:3
 */
export default function AspectRatioControl() {
	const { media } = useMediaEditorContext();
	const { cropperState, setCropperState } = useImageCropper();
	const aspectRatio = cropperState.aspectRatio;

	const aspectRatios = getCommonAspectRatios();

	const handleAspectRatioChange = ( value: string ) => {
		const numValue = parseFloat( value );
		if ( ! isNaN( numValue ) ) {
			// If "Original" (value 0), calculate from media dimensions
			if ( numValue === 0 && media?.source_url ) {
				// Use natural aspect ratio from media
				// For now, set to free aspect (aspectRatio: 1)
				// TODO: Calculate actual media aspect ratio
				setCropperState( { aspectRatio: 1 } );
			} else {
				setCropperState( { aspectRatio: numValue } );
			}
		}
	};

	const options = aspectRatios.map( ( ratio ) => ( {
		label: ratio.label,
		value: String( ratio.value ),
	} ) );

	return (
		<SelectControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ __( 'Aspect Ratio' ) }
			value={ String( aspectRatio ) }
			options={ options }
			onChange={ handleAspectRatioChange }
		/>
	);
}
