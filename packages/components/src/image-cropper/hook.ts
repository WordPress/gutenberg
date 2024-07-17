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
		},
		{
			target: cropperWindowRef,
			pinch: { scaleBounds: { min: 1, max: 10 } },
			wheel: { threshold: 10 },
			drag: { from: () => [ state.position.x, state.position.y ] },
		}
	);

	// FIXME: This doesn't work for rotated images for now.
	const getImageBlob = useCallback( async ( cropperState: State ) => {
		const offscreenCanvas = new OffscreenCanvas(
			cropperState.size.width,
			cropperState.size.height
		);
		const ctx = offscreenCanvas.getContext( '2d' )!;
		ctx.translate(
			cropperState.position.x + offscreenCanvas.width / 2,
			cropperState.position.y + offscreenCanvas.height / 2
		);
		ctx.rotate(
			degreeToRadian( cropperState.angle + cropperState.turns * 90 )
		);
		const isAxisSwapped = cropperState.turns % 2 !== 0;
		ctx.scale(
			cropperState.scale *
				( cropperState.flipped && ! isAxisSwapped ? -1 : 1 ),
			cropperState.scale *
				( cropperState.flipped && isAxisSwapped ? -1 : 1 )
		);
		const imageOffset = {
			x: isAxisSwapped
				? ( cropperState.height - cropperState.width ) / 2
				: 0,
			y: isAxisSwapped
				? ( cropperState.width - cropperState.height ) / 2
				: 0,
		};
		ctx.drawImage(
			imageRef.current!,
			-cropperState.offset.x - offscreenCanvas.width / 2 + imageOffset.x,
			-cropperState.offset.y - offscreenCanvas.height / 2 + imageOffset.y,
			cropperState.width,
			cropperState.height
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
