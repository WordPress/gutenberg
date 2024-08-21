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
			onPinch: ( {
				origin: [ originX, originY ],
				offset: [ scale ],
				movement: [ deltaScale ],
				memo,
				first,
			} ) => {
				if ( first ) {
					const {
						width: imageWidth,
						height: imageHeight,
						x,
						y,
					} = imageRef.current.getBoundingClientRect();
					// Save the initial position and distances from the origin.
					memo = {
						initial: state.transforms.translate,
						distances: {
							x: originX - ( x + imageWidth / 2 ),
							y: originY - ( y + imageHeight / 2 ),
						},
					};
				}
				dispatch( {
					type: 'ZOOM',
					scale,
					// Calculate the new position based on the scale from the origin.
					position: {
						x:
							memo.initial.x -
							( deltaScale - 1 ) * memo.distances.x,
						y:
							memo.initial.y -
							( deltaScale - 1 ) * memo.distances.y,
					},
				} );
				return memo;
			},
			onPinchEnd: () => {
				dispatch( { type: 'ZOOM_END' } );
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
			pinch: {
				scaleBounds: { min: 1, max: 10 },
				from: () => [ Math.abs( state.transforms.scale.x ), 0 ],
			},
			drag: {
				from: () => [
					state.transforms.translate.x,
					state.transforms.translate.y,
				],
			},
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
			cropperState.transforms.translate.x * scaleFactor +
				offscreenCanvas.width / 2,
			cropperState.transforms.translate.y * scaleFactor +
				offscreenCanvas.height / 2
		);
		ctx.rotate( cropperState.transforms.rotate );
		ctx.scale(
			cropperState.transforms.scale.x,
			cropperState.transforms.scale.y
		);
		const isAxisSwapped = cropperState.isAxisSwapped;
		const imageDimensions = {
			width: isAxisSwapped
				? cropperState.image.height
				: cropperState.image.width,
			height: isAxisSwapped
				? cropperState.image.width
				: cropperState.image.height,
		};
		ctx.translate(
			-( ( imageDimensions.width - cropperState.cropper.width ) / 2 ) *
				scaleFactor,
			-( ( imageDimensions.height - cropperState.cropper.height ) / 2 ) *
				scaleFactor
		);
		const imageOffset = {
			x: isAxisSwapped ? ( naturalHeight - naturalWidth ) / 2 : 0,
			y: isAxisSwapped ? ( naturalWidth - naturalHeight ) / 2 : 0,
		};
		ctx.drawImage(
			image,
			-offscreenCanvas.width / 2 + imageOffset.x,
			-offscreenCanvas.height / 2 + imageOffset.y
		);
		const blob = await offscreenCanvas.convertToBlob();
		return blob;
	}, [] );

	return useMemo(
		() => ( {
			state,
			src,
			originalWidth: width,
			originalHeight: height,
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
