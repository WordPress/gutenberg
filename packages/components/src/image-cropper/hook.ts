/**
 * External dependencies
 */
import {
	createUseGesture,
	dragAction,
	pinchAction,
	wheelAction,
} from '@use-gesture/react';
/**
 * WordPress dependencies
 */
import { useRef, useMemo, useReducer, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { degreeToRadian } from './math';
import { imageCropperReducer, createInitialState } from './reducer';
import type { State } from './reducer';

const useGesture = createUseGesture( [ dragAction, pinchAction, wheelAction ] );

export const useImageCropper = ( {
	src,
	width,
	height,
}: {
	src: string;
	width: number;
	height: number;
} ) => {
	const imageRef = useRef< HTMLImageElement >( null! );
	const cropperWindowRef = useRef< HTMLElement >( null! );

	const [ state, dispatch ] = useReducer(
		imageCropperReducer,
		{ width, height },
		createInitialState
	);

	useGesture(
		{
			onPinch: ( { offset: [ scale ] } ) => {
				dispatch( { type: 'ZOOM', scale } );
			},
			onWheel: ( { pinching, movement: [ , deltaY ] } ) => {
				if ( pinching ) {
					return;
				}
				const deltaScale = deltaY * 0.001;
				dispatch( { type: 'ZOOM_BY', deltaScale } );
			},
			onDrag: ( { offset: [ x, y ] } ) => {
				dispatch( { type: 'MOVE', x, y } );
			},
			onDragEnd: () => {
				dispatch( { type: 'MOVE_END' } );
			},
		},
		{
			target: cropperWindowRef,
			pinch: { scaleBounds: { min: 1, max: 10 } },
			wheel: { threshold: 10 },
			drag: { from: () => [ state.image.x, state.image.y ] },
		}
	);

	// FIXME: This doesn't work for rotated images for now.
	const getImageBlob = useCallback( async ( cropperState: State ) => {
		const offscreenCanvas = new OffscreenCanvas(
			cropperState.cropper.width,
			cropperState.cropper.height
		);
		const ctx = offscreenCanvas.getContext( '2d' )!;
		ctx.translate(
			cropperState.image.x + offscreenCanvas.width / 2,
			cropperState.image.y + offscreenCanvas.height / 2
		);
		ctx.rotate(
			degreeToRadian(
				cropperState.transforms.angle +
					cropperState.transforms.rotations * 90
			)
		);
		const isAxisSwapped = cropperState.transforms.rotations % 2 !== 0;
		ctx.scale(
			cropperState.transforms.scale *
				( cropperState.transforms.flipped && ! isAxisSwapped ? -1 : 1 ),
			cropperState.transforms.scale *
				( cropperState.transforms.flipped && isAxisSwapped ? -1 : 1 )
		);
		const imageOffset = {
			x: isAxisSwapped
				? ( cropperState.image.height - cropperState.image.width ) / 2
				: 0,
			y: isAxisSwapped
				? ( cropperState.image.width - cropperState.image.height ) / 2
				: 0,
		};
		ctx.drawImage(
			imageRef.current!,
			-cropperState.cropper.x - offscreenCanvas.width / 2 + imageOffset.x,
			-cropperState.cropper.y -
				offscreenCanvas.height / 2 +
				imageOffset.y,
			cropperState.image.width,
			cropperState.image.height
		);
		const blob = await offscreenCanvas.convertToBlob();
		return blob;
	}, [] );

	return useMemo(
		() => ( {
			state,
			src,
			refs: {
				imageRef,
				cropperWindowRef,
			},
			dispatch,
			getImageBlob,
		} ),
		[ state, src, getImageBlob ]
	);
};
