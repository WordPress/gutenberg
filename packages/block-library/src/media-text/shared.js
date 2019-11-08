export function imageFillStyles( url, focalPoint ) {
	return url ?
		{
			backgroundImage: `url(${ url })`,
			backgroundPosition: focalPoint ? `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%` : `50% 50%`,
		} :
		{};
}
