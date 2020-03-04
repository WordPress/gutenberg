/**
 * External dependencies
 */

import ReactCrop from 'react-image-crop';

const CroppedImage = ( {
	url,
	currentCrop,
	setCrop,
	children,
	inProgress,
} ) => {
	if ( currentCrop === null ) {
		return children;
	}

	return (
		<ReactCrop
			src={ url }
			crop={ currentCrop }
			ruleOfThirds
			disabled={ inProgress }
			onChange={ ( newCrop, newCropPercent ) =>
				setCrop( newCropPercent )
			}
		/>
	);
};

export default CroppedImage;
