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

	const getImageBlob = useCallback( async ( cropperState: State ) => {
		const image = imageRef.current;
		const { naturalWidth, naturalHeight } = image;
		const scaleFactor = naturalWidth / cropperState.image.width;
		const offscreenCanvas = new OffscreenCanvas(
			cropperState.cropper.width * scaleFactor,
			cropperState.cropper.height * scaleFactor
		);
		const ctx = offscreenCanvas.getContext( '2d' )!;
		ctx.translate(
			cropperState.image.x * scaleFactor + offscreenCanvas.width / 2,
			cropperState.image.y * scaleFactor + offscreenCanvas.height / 2
		);
		ctx.rotate(
			degreeToRadian(
				cropperState.transforms.angle +
					cropperState.transforms.rotations * 90
			)
		);
		const isAxisSwapped = cropperState.transforms.rotations % 2 !== 0;
		ctx.scale(
			cropperState.transforms.scale.x,
			cropperState.transforms.scale.y
		);
		const imageOffset = {
			x: isAxisSwapped ? ( naturalHeight - naturalWidth ) / 2 : 0,
			y: isAxisSwapped ? ( naturalWidth - naturalHeight ) / 2 : 0,
		};
		ctx.drawImage(
			image,
			-cropperState.cropper.x * scaleFactor -
				offscreenCanvas.width / 2 +
				imageOffset.x,
			-cropperState.cropper.y * scaleFactor -
				offscreenCanvas.height / 2 +
				imageOffset.y
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
