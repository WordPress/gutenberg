/**
 * Internal dependencies
 */
import type { Size, ResizeDirection } from './types';
import {
	rotatePoint,
	degreeToRadian,
	getFurthestVector,
	calculateRotatedBounds,
} from './math';

export type State = {
	// The image dimensions.
	image: {
		// The x position of the image center.
		x: number;
		// The y position of the image center.
		y: number;
		// The width of the image. This doesn't change.
		readonly width: number;
		// The height of the image. This doesn't change.
		readonly height: number;
	};
	// The image transforms.
	transforms: {
		// The angle of the image in degrees, from -45 to 45 degrees.
		angle: number;
		// The number of 90-degree turns clockwise.
		turns: 0 | 1 | 2 | 3;
		// The image scale.
		scale: number;
		// Whether the image is flipped horizontally.
		flipped: boolean;
	};
	// The cropper window dimensions.
	cropper: {
		// The x position of the cropper window center.
		x: number;
		// The y position of the cropper window center.
		y: number;
		// The width of the cropper window.
		width: number;
		// The height of the cropper window
		height: number;
	};
	// Whether the cropper window is resizing.
	isResizing: boolean;
	// Whether the image is dragging/moving.
	isDragging: boolean;
};

type Action =
	// Zoom in/out to a  scale.
	| { type: 'ZOOM'; scale: number }
	// Zoom in/out by a delta scale.
	| { type: 'ZOOM_BY'; deltaScale: number }
	// Flip the image horizontally.
	| { type: 'FLIP' }
	// Rotate the image to an angle.
	| { type: 'ROTATE'; angle: number }
	// Rotate the image 90-degree clockwise or counter-clockwise.
	| { type: 'ROTATE_CLOCKWISE'; isCounterClockwise?: boolean }
	// Move the image to a position.
	| { type: 'MOVE'; x: number; y: number }
	// End moving the image.
	| { type: 'MOVE_END' }
	// Start resizing the cropper window.
	| { type: 'RESIZE_START' }
	// Resize the cropper window by a delta size in a direction.
	| { type: 'RESIZE_WINDOW'; direction: ResizeDirection; delta: Size }
	// Reset the state to the initial state.
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
		case 'MOVE': {
			// Calculate the boundaries of the area where the cropper can move.
			// These boundaries ensure the cropper stays within the image.
			const { minX, maxX, minY, maxY } = calculateRotatedBounds(
				radian,
				image.width * scale,
				image.height * scale,
				cropper.width,
				cropper.height
			);

			// Rotate the action point to align with the non-rotated coordinate system.
			const rotatedPoint = rotatePoint(
				{ x: action.x, y: action.y },
				-radian
			);

			// Constrain the rotated point to within the calculated boundaries.
			// This ensures the cropper doesn't move outside the image.
			const boundPoint = {
				x: Math.min( Math.max( rotatedPoint.x, minX ), maxX ),
				y: Math.min( Math.max( rotatedPoint.y, minY ), maxY ),
			};

			// Rotate the constrained point back to the original coordinate system.
			const nextPosition = rotatePoint( boundPoint, radian );

			return {
				...state,
				image: {
					...state.image,
					x: nextPosition.x,
					y: nextPosition.y,
				},
				isDragging: true,
			};
		}
		case 'MOVE_END': {
			return {
				...state,
				isDragging: false,
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
