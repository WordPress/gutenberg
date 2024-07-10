/**
 * Internal dependencies
 */
import type { Position, Size } from './types';
import { rotatePoint, degreeToRadian, getRotatedScale } from './math';

type State = {
	readonly width: number;
	readonly height: number;
	angle: number;
	scale: number;
	offset: Position;
	position: Position;
	size: Size;
};

type Action =
	| { type: 'ZOOM'; scale: number }
	| { type: 'ZOOM_BY'; deltaScale: number }
	| { type: 'ROTATE'; angle: number }
	| { type: 'TRANSLATE'; offset: Position }
	| { type: 'MOVE'; x: number; y: number }
	| { type: 'RESIZE_WINDOW'; direction: string; delta: Size }
	| { type: 'RESET' };

function createInitialState( {
	width,
	height,
}: {
	width: number;
	height: number;
} ) {
	return {
		width,
		height,
		angle: 0,
		scale: 1,
		offset: { x: 0, y: 0 },
		position: { x: 0, y: 0 },
		size: { width, height },
	};
}

function imageCropperReducer( state: State, action: Action ) {
	const { width, height, scale, angle, size, position } = state;

	switch ( action.type ) {
		case 'ZOOM': {
			return {
				...state,
				scale: action.scale,
			};
		}
		case 'ZOOM_BY': {
			return {
				...state,
				scale: state.scale + action.deltaScale,
			};
		}
		case 'ROTATE': {
			return {
				...state,
				angle: action.angle,
			};
		}
		case 'TRANSLATE': {
			return {
				...state,
				offset: action.offset,
			};
		}
		case 'MOVE': {
			const windowVertices = [
				{ x: size.width / 2, y: -size.height / 2 }, // top right
				{ x: size.width / 2, y: size.height / 2 }, // bottom right
				{ x: -size.width / 2, y: +size.height / 2 }, // bottom left
				{ x: -size.width / 2, y: -size.height / 2 }, // top left
			];
			const radian = degreeToRadian( angle );
			const rotatedScale = getRotatedScale( angle, scale, width, height );
			const scaledWidth = width * rotatedScale;
			const scaledHeight = height * rotatedScale;

			let { x, y } = action;

			const minX = x - scaledWidth / 2;
			const maxX = x + scaledWidth / 2;
			const minY = y - scaledHeight / 2;
			const maxY = y + scaledHeight / 2;

			let furthestX = 0;
			let furthestY = 0;

			for ( const point of windowVertices ) {
				const rotatedPoint = rotatePoint( point, { x, y }, -radian );

				if ( rotatedPoint.x < minX ) {
					furthestX =
						Math.abs( rotatedPoint.x - minX ) >
						Math.abs( furthestX )
							? rotatedPoint.x - minX
							: furthestX;
				}
				if ( rotatedPoint.x > maxX ) {
					furthestX =
						Math.abs( rotatedPoint.x - maxX ) >
						Math.abs( furthestX )
							? rotatedPoint.x - maxX
							: furthestX;
				}
				if ( rotatedPoint.y < minY ) {
					furthestY =
						Math.abs( rotatedPoint.y - minY ) >
						Math.abs( furthestY )
							? rotatedPoint.y - minY
							: furthestY;
				}
				if ( rotatedPoint.y > maxY ) {
					furthestY =
						Math.abs( rotatedPoint.y - maxY ) >
						Math.abs( furthestY )
							? rotatedPoint.y - maxY
							: furthestY;
				}
			}

			const vectorInUnrotated = { x: furthestX, y: furthestY };

			// Step 3: Rotate the vector back to the original coordinate system
			const vector = rotatePoint(
				vectorInUnrotated,
				{ x: 0, y: 0 },
				radian
			);

			if (
				Math.round( vector.x ) !== 0 ||
				Math.round( vector.y ) !== 0
			) {
				x += vector.x;
				y += vector.y;
			}

			return {
				...state,
				position: { x, y },
			};
		}
		case 'RESIZE_WINDOW': {
			const { direction, delta } = action;
			const deltaX = direction.toLowerCase().includes( 'left' )
				? delta.width
				: -delta.width;
			const deltaY = direction.startsWith( 'top' )
				? delta.height
				: -delta.height;
			const newSize = {
				width: size.width + delta.width,
				height: size.height + delta.height,
			};
			const widthScale = width / newSize.width;
			const heightScale = height / newSize.height;
			const windowScale = Math.min( widthScale, heightScale );
			const scaledSize = { width, height };
			const translated = { x: 0, y: 0 };
			if ( widthScale === windowScale ) {
				scaledSize.height = newSize.height * windowScale;
				translated.y = height / 2 - scaledSize.height / 2;
			} else {
				scaledSize.width = newSize.width * windowScale;
				translated.x = width / 2 - scaledSize.width / 2;
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
