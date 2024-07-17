/**
 * Internal dependencies
 */
import type { Position, Size, ResizeDirection } from './types';
import { rotatePoint, degreeToRadian, getFurthestVector } from './math';

export type State = {
	// The container/image's width.
	width: number;
	// The container/image's height.
	height: number;
	// The rotation angle between -45deg to 45deg.
	angle: number;
	// The number of 90-degree turns.
	turns: 0 | 1 | 2 | 3;
	// The zoom scale.
	scale: number;
	// Whether the image is flipped horizontally.
	flipped: boolean;
	// The offset position of the cropper window.
	offset: Position;
	// The position of center of the image.
	position: Position;
	// The size of the cropper window.
	size: Size;
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
		width,
		height,
		angle: 0,
		turns: 0,
		scale: 1,
		flipped: false,
		offset: { x: 0, y: 0 },
		position: { x: 0, y: 0 },
		size: { width, height },
		isResizing: false,
		isDragging: false,
	};
}

function imageCropperReducer( state: State, action: Action ) {
	const {
		width,
		height,
		scale,
		flipped,
		angle,
		turns,
		size,
		position,
		offset,
	} = state;
	const radian = degreeToRadian( angle + turns * 90 );

	switch ( action.type ) {
		case 'ZOOM': {
			const { x, y } = getFurthestVector(
				width,
				height,
				radian,
				size,
				position
			);

			const widthScale = ( Math.abs( x ) * 2 + width ) / width;
			const heightScale = ( Math.abs( y ) * 2 + height ) / height;
			const minScale = Math.max( widthScale, heightScale );
			return {
				...state,
				scale: Math.min( Math.max( action.scale, minScale ), 10 ),
			};
		}
		case 'ZOOM_BY': {
			const { x, y } = getFurthestVector(
				width,
				height,
				radian,
				size,
				position
			);

			const widthScale = ( Math.abs( x ) * 2 + width ) / width;
			const heightScale = ( Math.abs( y ) * 2 + height ) / height;
			const minScale = Math.max( widthScale, heightScale );
			return {
				...state,
				scale: Math.min(
					Math.max( state.scale + action.deltaScale, minScale ),
					10
				),
			};
		}
		case 'FLIP': {
			return {
				...state,
				flipped: ! flipped,
				angle: -angle,
				position: {
					x: -position.x,
					y: position.y,
				},
			};
		}
		case 'ROTATE': {
			const nextRadian = degreeToRadian( action.angle + turns * 90 );
			const scaledWidth = width * scale;
			const scaledHeight = height * scale;
			const { x, y } = getFurthestVector(
				scaledWidth,
				scaledHeight,
				nextRadian,
				size,
				position
			);
			const widthScale = ( Math.abs( x ) * 2 + scaledWidth ) / width;
			const heightScale = ( Math.abs( y ) * 2 + scaledHeight ) / height;
			const minScale = Math.max( widthScale, heightScale );
			return {
				...state,
				angle: action.angle,
				scale: Math.max( scale, minScale ),
			};
		}
		case 'ROTATE_CLOCKWISE': {
			const isCounterClockwise = action.isCounterClockwise;
			const nextTurns = ( ( turns + ( isCounterClockwise ? 3 : 1 ) ) %
				4 ) as 0 | 1 | 2 | 3;
			const rotatedPosition = rotatePoint(
				position,
				{ x: 0, y: 0 },
				( Math.PI / 2 ) * ( isCounterClockwise ? -1 : 1 )
			);
			return {
				...state,
				size: {
					width: size.height,
					height: size.width,
				},
				offset: {
					x: offset.y,
					y: offset.x,
				},
				turns: nextTurns,
				position: rotatedPosition,
			};
		}
		case 'TRANSLATE': {
			return {
				...state,
				offset: action.offset,
			};
		}
		case 'MOVE': {
			const scaledWidth = width * scale;
			const scaledHeight = height * scale;
			const vectorInUnrotated = getFurthestVector(
				scaledWidth,
				scaledHeight,
				radian,
				size,
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
				position: nextPosition,
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
				width: size.width + delta.width,
				height: size.height + delta.height,
			};
			const isAxisSwapped = turns % 2 !== 0;
			const imageDimensions = {
				width: isAxisSwapped ? height : width,
				height: isAxisSwapped ? width : height,
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
				offset: translated,
				size: scaledSize,
				scale: scale * windowScale,
				position: {
					x: ( position.x + deltaX / 2 ) * windowScale,
					y: ( position.y + deltaY / 2 ) * windowScale,
				},
				isResizing: false,
			};
		}
		case 'RESET': {
			return createInitialState( { width, height } );
		}
		default: {
			throw new Error( 'Unknown action' );
		}
	}
}

export { createInitialState, imageCropperReducer };
