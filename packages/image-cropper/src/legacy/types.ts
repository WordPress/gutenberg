import type { Point, Area, MediaSize } from 'react-easy-crop';

// Re-export types for convenience.
/** @deprecated Use `Cropper` instead. */
export type { Point, Area, MediaSize };

export type Flip = {
	horizontal: boolean;
	vertical: boolean;
};

/** @deprecated Use `Cropper` instead. */
export interface ImageCropperState {
	rotation?: number;
	crop?: Area;
	zoom?: number;
	flip?: Flip;
	aspectRatio?: number;
}

/** @deprecated Use `Cropper` instead. */
export interface CropperState {
	crop: Point;
	croppedArea?: Area;
	croppedAreaPixels?: Area | null;
	zoom: number;
	rotation: number;
	flip: Flip;
	aspectRatio: number;
	mediaSize: MediaSize | null;
}

/** @deprecated Use `Cropper` instead. */
export interface ImageCropperProps {
	src: string;
	onLoad?: ( mediaSize: MediaSize ) => void;
	minZoom?: number;
	maxZoom?: number;
}

/** @deprecated Use `Cropper` instead. */
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
	getCroppedImage: ( src: string ) => Promise< string | null >;
}
