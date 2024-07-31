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
import {
	useRef,
	useMemo,
	useReducer,
	useCallback,
	useEffect,
} from '@wordpress/element';

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
						initial: { x: state.image.x, y: state.image.y },
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

	const stateRef = useRef< State >( state );
	useEffect( () => {
		stateRef.current = state;
	}, [ state ] );
	const getState = useCallback( () => stateRef.current, [] );

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
			getState,
			dispatch,
			getImageBlob,
		} ),
		[ state, src, width, height, getImageBlob, getState ]
	);
};
