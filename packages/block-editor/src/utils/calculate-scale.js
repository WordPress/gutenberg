const clamp = ( lowerlimit, width, upperlimit ) => {
	if ( width < lowerlimit ) return lowerlimit;
	if ( width > upperlimit ) return upperlimit;
	return width;
};

export default function calculateScale( scaleConfig, width ) {
	const scaleSlope =
		( scaleConfig.maxScale - scaleConfig.minScale ) /
		( scaleConfig.maxWidth - scaleConfig.minWidth );

	const scaleIntercept =
		scaleConfig.minScale - scaleSlope * scaleConfig.minWidth;

	return clamp(
		scaleConfig.maxScale,
		scaleSlope * width + scaleIntercept,
		scaleConfig.minScale
	);
}
