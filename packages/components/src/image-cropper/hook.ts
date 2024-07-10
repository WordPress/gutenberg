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
import { degreeToRadian, getRotatedScale } from './math';
import { imageCropperReducer, createInitialState } from './reducer';

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
		},
		{
			target: cropperWindowRef,
			pinch: { scaleBounds: { min: 1, max: 10 } },
			wheel: { threshold: 10 },
			drag: { from: () => [ state.position.x, state.position.y ] },
		}
	);

	const getImageBlob = useCallback( async () => {
		const offscreenCanvas = new OffscreenCanvas(
			state.size.width,
			state.size.height
		);
		const ctx = offscreenCanvas.getContext( '2d' )!;
		ctx.translate(
			state.position.x + offscreenCanvas.width / 2,
			state.position.y + offscreenCanvas.height / 2
		);
		ctx.rotate( degreeToRadian( state.angle ) );
		const rotatedScale = getRotatedScale(
			state.angle,
			state.scale,
			width,
			height
		);
		ctx.scale( rotatedScale, rotatedScale );
		ctx.drawImage(
			imageRef.current!,
			-state.offset.x - offscreenCanvas.width / 2,
			-state.offset.y - offscreenCanvas.height / 2,
			width,
			height
		);
		const blob = await offscreenCanvas.convertToBlob();
		return blob;
	}, [
		width,
		height,
		state.angle,
		state.offset,
		state.position,
		state.scale,
		state.size,
	] );

	return useMemo(
		() => ( {
			state,
			src,
			width,
			height,
			refs: {
				imageRef,
				cropperWindowRef,
			},
			dispatch,
			getImageBlob,
		} ),
		[ state, src, width, height, getImageBlob ]
	);
};
