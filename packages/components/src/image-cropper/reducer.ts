/**
 * Internal dependencies
 */
import type { Position, Size, ResizeDirection } from './types';
import { rotatePoint, degreeToRadian, getFurthestVector } from './math';

export type State = {
	image: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	transforms: {
		angle: number;
		turns: 0 | 1 | 2 | 3;
		scale: number;
		flipped: boolean;
	};
	cropper: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	// Whether the cropper window is resizing.
	isResizing: boolean;
	// Whether the image is dragging/moving.
	isDragging: boolean;
};

type Action =
	| { type: 'ZOOM'; scale: number }
	| { type: 'ZOOM_BY'; deltaScale: number }
	| { type: 'FLIP' }
	| { type: 'ROTATE'; angle: number }
	| { type: 'ROTATE_CLOCKWISE'; isCounterClockwise?: boolean }
	| { type: 'TRANSLATE'; offset: Position }
	| { type: 'MOVE'; x: number; y: number }
	| { type: 'RESIZE_START' }
	| { type: 'RESIZE_WINDOW'; direction: ResizeDirection; delta: Size }
	| { type: 'RESET' };

function createInitialState( {
	width,
	height,
}: {
	width: number;
	height: number;
} ): State {
	return {
		image: {
			width,
			height,
			x: 0,
			y: 0,
		},
		transforms: {
			angle: 0,
			turns: 0,
			scale: 1,
			flipped: false,
		},
		cropper: {
			width,
			height,
			x: 0,
			y: 0,
		},
		isResizing: false,
		isDragging: false,
	};
}

function imageCropperReducer( state: State, action: Action ) {
	const {
		image,
		transforms: { angle, turns, scale, flipped },
		cropper,
	} = state;
	const radian = degreeToRadian( angle + turns * 90 );

	switch ( action.type ) {
		case 'ZOOM': {
			const { x, y } = getFurthestVector(
				image.width,
				image.height,
				radian,
				{ width: cropper.width, height: cropper.height },
				{ x: image.x, y: image.y }
			);

			const widthScale =
				( Math.abs( x ) * 2 + image.width ) / image.width;
			const heightScale =
				( Math.abs( y ) * 2 + image.height ) / image.height;
			const minScale = Math.max( widthScale, heightScale );
			return {
				...state,
				transforms: {
					...state.transforms,
					scale: Math.min( Math.max( action.scale, minScale ), 10 ),
				},
			};
		}
		case 'ZOOM_BY': {
			const { x, y } = getFurthestVector(
				image.width,
				image.height,
				radian,
				{ width: cropper.width, height: cropper.height },
				{ x: image.x, y: image.y }
			);

			const widthScale =
				( Math.abs( x ) * 2 + image.width ) / image.width;
			const heightScale =
				( Math.abs( y ) * 2 + image.height ) / image.height;
			const minScale = Math.max( widthScale, heightScale );
			return {
				...state,
				transforms: {
					...state.transforms,
					scale: Math.min(
						Math.max( scale + action.deltaScale, minScale ),
						10
					),
				},
			};
		}
		case 'FLIP': {
			return {
				...state,
				image: {
					...state.image,
					x: -image.x,
				},
				transforms: {
					...state.transforms,
					angle: -angle,
					flipped: ! flipped,
				},
			};
		}
		case 'ROTATE': {
			const nextRadian = degreeToRadian( action.angle + turns * 90 );
			const scaledWidth = image.width * scale;
			const scaledHeight = image.height * scale;
			const { x, y } = getFurthestVector(
				scaledWidth,
				scaledHeight,
				nextRadian,
				{ width: cropper.width, height: cropper.height },
				{ x: image.x, y: image.y }
			);
			const widthScale =
				( Math.abs( x ) * 2 + scaledWidth ) / image.width;
			const heightScale =
				( Math.abs( y ) * 2 + scaledHeight ) / image.height;
			const minScale = Math.max( widthScale, heightScale );
			return {
				...state,
				transforms: {
					...state.transforms,
					angle: action.angle,
					scale: Math.max( scale, minScale ),
				},
			};
		}
		case 'ROTATE_CLOCKWISE': {
			const isCounterClockwise = action.isCounterClockwise;
			const nextTurns = ( ( turns + ( isCounterClockwise ? 3 : 1 ) ) %
				4 ) as 0 | 1 | 2 | 3;
			const rotatedPosition = rotatePoint(
				{ x: image.x, y: image.y },
				{ x: 0, y: 0 },
				( Math.PI / 2 ) * ( isCounterClockwise ? -1 : 1 )
			);
			return {
				...state,
				image: {
					...state.image,
					x: rotatedPosition.x,
					y: rotatedPosition.y,
				},
				transforms: {
					...state.transforms,
					turns: nextTurns,
				},
				cropper: {
					...state.cropper,
					width: cropper.height,
					height: cropper.width,
					x: cropper.y,
					y: cropper.x,
				},
			};
		}
		case 'TRANSLATE': {
			return {
				...state,
				cropper: {
					...state.cropper,
					x: action.offset.x,
					y: action.offset.y,
				},
			};
		}
		case 'MOVE': {
			const scaledWidth = image.width * scale;
			const scaledHeight = image.height * scale;
			const vectorInUnrotated = getFurthestVector(
				scaledWidth,
				scaledHeight,
				radian,
				{ width: cropper.width, height: cropper.height },
				{ x: action.x, y: action.y }
			);

			// Step 3: Rotate the vector back to the original coordinate system
			const vector = rotatePoint(
				vectorInUnrotated,
				{ x: 0, y: 0 },
				radian
			);

			const nextPosition = { x: action.x, y: action.y };
			if (
				Math.round( vector.x ) !== 0 ||
				Math.round( vector.y ) !== 0
			) {
				nextPosition.x += vector.x;
				nextPosition.y += vector.y;
			}

			return {
				...state,
				image: {
					...state.image,
					x: nextPosition.x,
					y: nextPosition.y,
				},
			};
		}
		case 'RESIZE_START': {
			return {
				...state,
				isResizing: true,
			};
		}
		// TODO: No idea how this should work for rotated(turned) images.
		case 'RESIZE_WINDOW': {
			const { direction, delta } = action;
			const deltaX = [ 'left', 'bottomLeft', 'topLeft' ].includes(
				direction
			)
				? delta.width
				: -delta.width;
			const deltaY = [ 'top', 'topLeft', 'topRight' ].includes(
				direction
			)
				? delta.height
				: -delta.height;
			const newSize = {
				width: cropper.width + delta.width,
				height: cropper.height + delta.height,
			};
			const isAxisSwapped = turns % 2 !== 0;
			const imageDimensions = {
				width: isAxisSwapped ? image.height : image.width,
				height: isAxisSwapped ? image.width : image.height,
			};
			const widthScale = imageDimensions.width / newSize.width;
			const heightScale = imageDimensions.height / newSize.height;
			const windowScale = Math.min( widthScale, heightScale );
			const scaledSize = {
				width: imageDimensions.width,
				height: imageDimensions.height,
			};
			const translated = { x: 0, y: 0 };
			if ( widthScale === windowScale ) {
				scaledSize.height = newSize.height * windowScale;
				translated.y =
					imageDimensions.height / 2 - scaledSize.height / 2;
			} else {
				scaledSize.width = newSize.width * windowScale;
				translated.x = imageDimensions.width / 2 - scaledSize.width / 2;
			}
			return {
				...state,
				image: {
					...state.image,
					x: ( image.x + deltaX / 2 ) * windowScale,
					y: ( image.y + deltaY / 2 ) * windowScale,
				},
				transforms: {
					...state.transforms,
					scale: scale * windowScale,
				},
				cropper: {
					...state.cropper,
					width: scaledSize.width,
					height: scaledSize.height,
					x: translated.x,
					y: translated.y,
				},
				isResizing: false,
			};
		}
		case 'RESET': {
			return createInitialState( {
				width: image.width,
				height: image.height,
			} );
		}
		default: {
			throw new Error( 'Unknown action' );
		}
	}
}

export { createInitialState, imageCropperReducer };
