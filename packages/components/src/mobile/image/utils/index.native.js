function getFocalPointOffset( imageRatio, container, imageSize, focusPoint ) {
	const containerCenter = Math.floor( container / 2 );
	const scaledImage = Math.floor( imageSize / imageRatio );
	const focus = Math.floor( focusPoint * scaledImage );
	let focusOffset = focus - containerCenter;
	const offsetRest = scaledImage - focus;
	const containerRest = container - containerCenter;

	if ( offsetRest < containerRest ) {
		focusOffset -= containerRest - offsetRest;
	}

	if ( focusOffset < 0 ) {
		focusOffset = 0;
	}

	return -focusOffset;
}

export function getImageWithFocalPointStyles(
	focalPoint,
	containerSize,
	originalImageData
) {
	const imageStyle = {};
	if ( focalPoint && containerSize && originalImageData ) {
		let horizontalOffset = 0;
		let verticalOffset = 0;
		const widthRatio = originalImageData.width / containerSize.width;
		const heightRatio = originalImageData.height / containerSize.height;

		imageStyle.resizeMode = 'stretch';

		if ( widthRatio > heightRatio ) {
			horizontalOffset = getFocalPointOffset(
				heightRatio,
				containerSize.width,
				originalImageData.width,
				focalPoint.x
			);
			imageStyle.width = undefined;
			imageStyle.left = horizontalOffset;
		} else if ( widthRatio < heightRatio ) {
			verticalOffset = getFocalPointOffset(
				widthRatio,
				containerSize.height,
				originalImageData.height,
				focalPoint.y
			);
			imageStyle.height = undefined;
			imageStyle.top = verticalOffset;
		}

		return imageStyle;
	}

	return imageStyle;
}
