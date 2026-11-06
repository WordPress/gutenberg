/**
 * A position. For `CropperState.crop` it is the image editor's pan: how
 * far the image sits from the centre of the crop, in fractions of the
 * image, so it is signed.
 */
export interface Point {
	x: number;
	y: number;
}

/**
 * A rectangle measured from its top-left corner. `croppedArea` is in
 * percentages of the image; `croppedAreaPixels` is in its pixels. Both
 * are measured on the image after its flip and rotation.
 */
export interface Area {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * The size of the loaded image. `width` and `height` equal the natural
 * size; the image editor does not report a rendered size.
 */
export interface MediaSize {
	width: number;
	height: number;
	naturalWidth: number;
	naturalHeight: number;
}

export type Flip = {
	horizontal: boolean;
	vertical: boolean;
};

export interface ImageCropperState {
	rotation?: number;
	/** Kept for compatibility. A reset state's crop region is not applied. */
	crop?: Area;
	zoom?: number;
	flip?: Flip;
	aspectRatio?: number;
}

export interface CropperState {
	crop: Point;
	croppedArea: Area;
	croppedAreaPixels: Area | null;
	zoom: number;
	rotation: number;
	flip: Flip;
	aspectRatio: number;
	mediaSize: MediaSize | null;
}

export interface ImageCropperProps {
	src: string;
	onLoad?: ( mediaSize: MediaSize ) => void;
	/**
	 * Kept for compatibility and ignored. The smallest zoom is the one
	 * that still keeps the image covering the crop.
	 */
	minZoom?: number;
	maxZoom?: number;
}

export interface ImageCropperContextValue {
	cropperState: CropperState;
	setCropperState: (
		newState:
			| Partial< CropperState >
			| ( ( prev: CropperState ) => Partial< CropperState > )
	) => void;
	resetState: ImageCropperState | null;
	setResetState: (
		newResetState: Partial< ImageCropperState > | null
	) => void;
	isDirty: boolean;
	reset: () => void;
	/**
	 * Export the crop as a JPEG object URL, or `null` before the image
	 * loads or when the export fails. `src` is the image to cut from,
	 * assumed to have the loaded image's dimensions; it defaults to the
	 * loaded image.
	 */
	getCroppedImage: ( src?: string ) => Promise< string | null >;
}
