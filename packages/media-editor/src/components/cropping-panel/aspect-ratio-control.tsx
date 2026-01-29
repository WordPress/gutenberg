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

/**
 * AspectRatioControl component provides a dropdown to select aspect ratio presets.
 * Includes Original, 1:1, 16:9, 4:3, 3:2, 3:4, 2:3
 */
export default function AspectRatioControl() {
	const { cropperState, setCropperState, resetState } = useImageCropper();
	const aspectRatio = cropperState.aspectRatio;

	const aspectRatios = getCommonAspectRatios();

	const handleAspectRatioChange = ( value: string ) => {
		const numValue = parseFloat( value );
		if ( ! isNaN( numValue ) ) {
			// If "Original" (value 0), use the natural aspect ratio from reset state
			if ( numValue === 0 && resetState?.aspectRatio ) {
				setCropperState( { aspectRatio: resetState.aspectRatio } );
			} else if ( numValue !== 0 ) {
				setCropperState( { aspectRatio: numValue } );
			}
		}
	};

	// Determine which option to show as selected
	// If current aspect ratio matches the natural ratio (original OR rotated), show "Original"
	const tolerance = 0.01;
	const naturalRatio = resetState?.aspectRatio || 0;
	const rotatedNaturalRatio = naturalRatio ? 1 / naturalRatio : 0;
	const matchesOriginal =
		naturalRatio && Math.abs( aspectRatio - naturalRatio ) < tolerance;
	const matchesRotated =
		rotatedNaturalRatio &&
		Math.abs( aspectRatio - rotatedNaturalRatio ) < tolerance;
	const displayValue =
		matchesOriginal || matchesRotated ? '0' : String( aspectRatio );

	const options = aspectRatios.map( ( ratio ) => ( {
		label: ratio.label,
		value: String( ratio.value ),
	} ) );

	return (
		<SelectControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ __( 'Aspect Ratio' ) }
			value={ displayValue }
			options={ options }
			onChange={ handleAspectRatioChange }
		/>
	);
}
