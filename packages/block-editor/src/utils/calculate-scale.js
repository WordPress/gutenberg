const clamp = ( lowerlimit, x, upperlimit ) => {
	if ( x < lowerlimit ) return lowerlimit;
	if ( x > upperlimit ) return upperlimit;
	return x;
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
