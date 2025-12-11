/**
 * External dependencies
 */
import { dequal } from 'dequal';

/**
 * WordPress dependencies
 */
import { useMemo, useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Point, ImageCropperState, CropperState } from '../types';
import { MIN_ZOOM } from '../constants';
import {
	getCroppedImage as getCroppedImageUtil,
	normalizeRotation,
} from '../utils';

export const DEFAULT_INITIAL_STATE: Required< ImageCropperState > = {
	crop: {
		x: 0,
		y: 0,
		width: 100,
		height: 100,
	},
	zoom: MIN_ZOOM,
	rotation: 0,
	aspectRatio: 1,
	flip: {
		horizontal: false,
		vertical: false,
	},
};

const DEFAULT_CROP_MEDIA_POSITION: Point = {
	x: 0,
	y: 0,
};

const DEFAULT_CROPPER_STATE: CropperState = {
	crop: DEFAULT_CROP_MEDIA_POSITION,
	croppedArea: DEFAULT_INITIAL_STATE.crop,
	croppedAreaPixels: null,
	zoom: DEFAULT_INITIAL_STATE.zoom,
	rotation: DEFAULT_INITIAL_STATE.rotation,
	flip: DEFAULT_INITIAL_STATE.flip,
	aspectRatio: DEFAULT_INITIAL_STATE.aspectRatio,
	mediaSize: null,
};

export default function useCropper() {
	const [ cropperState, setInternalCropperState ] = useState< CropperState >(
		DEFAULT_CROPPER_STATE
	);
	const [ resetState, setInternalResetState ] =
		useState< ImageCropperState | null >( null );

	// Unified setter that supports both partial updates and function updates
	const setCropperState = useCallback(
		(
			newState:
				| Partial< CropperState >
				| ( ( prev: CropperState ) => Partial< CropperState > )
		) => {
			setInternalCropperState( ( prev ) => {
				const updates =
					typeof newState === 'function'
						? newState( prev )
						: newState;

				// Apply normalization to rotation if it's being updated
				const normalizedUpdates = { ...updates };
				if (
					'rotation' in normalizedUpdates &&
					normalizedUpdates.rotation !== undefined
				) {
					normalizedUpdates.rotation = normalizeRotation(
						normalizedUpdates.rotation
					);
				}

				return { ...prev, ...normalizedUpdates };
			} );
		},
		[]
	);

	const setResetState = useCallback(
		( newResetState: Partial< ImageCropperState > | null = null ) => {
			// If null, wipe the reset state and reset the cropper state to the default state.
			if ( ! newResetState ) {
				setInternalResetState( null );
				setCropperState( DEFAULT_CROPPER_STATE );
				return;
			}
			if ( typeof newResetState === 'object' ) {
				const initialState = {
					...DEFAULT_INITIAL_STATE,
					...newResetState,
				};
				setInternalResetState( initialState );
				setCropperState( initialState );
			}
		},
		[ setCropperState, setInternalResetState ]
	);

	/*
	 * Resets the cropper state.
	 */
	const reset = useCallback( () => {
		if ( resetState ) {
			// Convert ImageCropperState to CropperState updates
			const resetUpdates: Partial< CropperState > = {
				// Reset media position to center
				crop: { x: 0, y: 0 },
				// Reset cropped area pixels (will be recalculated)
				croppedAreaPixels: null,
			};

			// Set the cropped area from resetState (this is the target crop area)
			if ( resetState.crop ) {
				resetUpdates.croppedArea = resetState.crop;
			}
			if ( resetState.zoom !== undefined ) {
				resetUpdates.zoom = resetState.zoom;
			}
			if ( resetState.rotation !== undefined ) {
				resetUpdates.rotation = resetState.rotation;
			}
			if ( resetState.aspectRatio !== undefined ) {
				resetUpdates.aspectRatio = resetState.aspectRatio;
			}
			if ( resetState.flip !== undefined ) {
				resetUpdates.flip = resetState.flip;
			}

			setCropperState( resetUpdates );
		} else {
			setCropperState( { ...DEFAULT_CROPPER_STATE } );
		}
	}, [ resetState, setCropperState ] );

	/*
	 * Returns true if the cropper state is dirty.
	 * Compare against reset state if available, otherwise against default state.
	 */
	const isDirty = useMemo( () => {
		if ( resetState ) {
			// Compare the relevant cropper properties against reset state
			const currentState = {
				crop:
					cropperState.croppedAreaPixels || cropperState.croppedArea,
				zoom: cropperState.zoom,
				rotation: normalizeRotation( cropperState.rotation ),
				aspectRatio: cropperState.aspectRatio,
				flip: cropperState.flip,
			};
			return false === dequal( currentState, resetState );
		}

		// Compare against default state using percentage values
		const currentState = {
			crop: cropperState.croppedArea,
			zoom: cropperState.zoom,
			rotation: normalizeRotation( cropperState.rotation ),
			aspectRatio: cropperState.aspectRatio,
			flip: cropperState.flip,
		};
		return false === dequal( currentState, DEFAULT_INITIAL_STATE );
	}, [ cropperState, resetState ] );

	/**
	 * Returns the cropped image.
	 *
	 * @param {string} src - The source of the image to crop.
	 * @return {Promise<string | null>} A promise that resolves to the cropped image.
	 */
	const getCroppedImage = useCallback(
		async ( src: string ) => {
			if ( ! cropperState.croppedAreaPixels ) {
				return null;
			}
			return getCroppedImageUtil(
				src,
				cropperState.croppedAreaPixels,
				cropperState.rotation,
				cropperState.flip
			);
		},
		[
			cropperState.croppedAreaPixels,
			cropperState.rotation,
			cropperState.flip,
		]
	);

	return useMemo(
		() => ( {
			cropperState,
			setCropperState,
			resetState,
			setResetState,
			isDirty,
			reset,
			getCroppedImage,
		} ),
		[
			cropperState,
			setCropperState,
			resetState,
			setResetState,
			isDirty,
			reset,
			getCroppedImage,
		]
	);
}
