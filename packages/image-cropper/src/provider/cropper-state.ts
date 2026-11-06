import {
	mapEditToOriginal,
	type ImageEditorState,
	type OriginalImageEdit,
} from '@wordpress/image-editor';
import type { Area, CropperState } from '../types';
import { rotateSize } from '../utils';

const FULL_FRAME: Area = { x: 0, y: 0, width: 100, height: 100 };

/**
 * Read the cropper's state from the image editor's.
 *
 * The crop area comes from the crop edit `mapEditToOriginal` returns, so
 * it is measured on the image after its flip and rotation, in the frame
 * a server applies it to. A crop the mapper leaves out, because it covers
 * the whole frame, reads as the full frame.
 *
 * @param state The image editor's state.
 * @return The state in the shape the hook has always exposed.
 */
export function toCropperState( state: ImageEditorState ): CropperState {
	const { image } = state;
	const edits = mapEditToOriginal( state );
	const cropEdit = edits.find(
		( edit ): edit is Extract< OriginalImageEdit, { type: 'crop' } > =>
			edit.type === 'crop'
	);
	const rotateEdit = edits.find(
		( edit ): edit is Extract< OriginalImageEdit, { type: 'rotate' } > =>
			edit.type === 'rotate'
	);

	const croppedArea: Area = cropEdit
		? {
				x: cropEdit.x * 100,
				y: cropEdit.y * 100,
				width: cropEdit.width * 100,
				height: cropEdit.height * 100,
			}
		: FULL_FRAME;

	let croppedAreaPixels: Area | null = null;
	if ( image ) {
		const rotated = rotateSize(
			image.naturalWidth,
			image.naturalHeight,
			rotateEdit?.angle ?? 0
		);
		croppedAreaPixels = {
			x: ( croppedArea.x / 100 ) * rotated.width,
			y: ( croppedArea.y / 100 ) * rotated.height,
			width: ( croppedArea.width / 100 ) * rotated.width,
			height: ( croppedArea.height / 100 ) * rotated.height,
		};
	}

	return {
		crop: { x: state.pan.x, y: state.pan.y },
		croppedArea,
		croppedAreaPixels,
		zoom: state.zoom,
		rotation: state.rotation,
		flip: { ...state.flip },
		aspectRatio:
			state.aspectRatio ??
			( image ? image.naturalWidth / image.naturalHeight : 1 ),
		mediaSize: image
			? {
					width: image.naturalWidth,
					height: image.naturalHeight,
					naturalWidth: image.naturalWidth,
					naturalHeight: image.naturalHeight,
				}
			: null,
	};
}
