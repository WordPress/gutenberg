
export function calculatePreferedImageSize( image, container ) {
	const maxWidth = container.clientWidth;
	const exceedMaxWidth = image.width > maxWidth;
	const ratio = image.height / image.width;
	const width = exceedMaxWidth ? maxWidth : image.width;
	const height = exceedMaxWidth ? maxWidth * ratio : image.height;
	return { width, height };
}
