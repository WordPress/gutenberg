export function imageFillStyles( url, focalPoint ) {
	return url
		? {
				objectPosition: focalPoint
					? `${ Math.round( focalPoint.x * 100 ) }% ${ Math.round(
							focalPoint.y * 100
					  ) }%`
					: `50% 50%`,
		  }
		: {};
}
