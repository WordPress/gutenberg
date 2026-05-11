/**
 * External dependencies
 */
import type { Point, Area, MediaSize } from 'react-easy-crop';

// Re-export types for convenience.
export type { Point, Area, MediaSize };

export type Flip = {
	horizontal: boolean;
	vertical: boolean;
};

export interface ImageCropperState {
	rotation?: number;
	crop?: Area;
	zoom?: number;
	flip?: Flip;
	aspectRatio?: number;
}

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

export interface ImageCropperProps {
	src: string;
	onLoad?: ( mediaSize: MediaSize ) => void;
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
	getCroppedImage: ( src: string ) => Promise< string | null >;
}
