/**
 * ImageFile class.
 *
 * Small wrapper around the `File` class to hold
 * information about current dimensions and original
 * dimensions, in case the image was resized.
 */
export class ImageFile extends File {
	width = 0;
	height = 0;
	originalWidth? = 0;
	originalHeight? = 0;

	get wasResized() {
		return (
			( this.originalWidth || 0 ) > this.width ||
			( this.originalHeight || 0 ) > this.height
		);
	}

	constructor(
		file: File,
		width: number,
		height: number,
		originalWidth?: number,
		originalHeight?: number
	) {
		super( [ file ], file.name, {
			type: file.type,
			lastModified: file.lastModified,
		} );

		this.width = width;
		this.height = height;
		this.originalWidth = originalWidth;
		this.originalHeight = originalHeight;
	}
}
