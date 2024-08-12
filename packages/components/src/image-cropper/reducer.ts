/**
 * Internal dependencies
 */
import type { ResizeDirection, Position } from './types';
import {
	rotatePoint,
	degreeToRadian,
	calculateRotatedBounds,
	getMinScale,
	PI_OVER_TWO,
} from './math';

export type State = {
	/** The image dimensions. */
	image: {
		/** The width of the image. */
		width: number;
		/** The height of the image. */
		height: number;
	};
	/** The image transforms. */
	transforms: {
		/** The rotation angle of the image in radians. */
		rotate: number;
		/** The image scale. */
		scale: { x: number; y: number };
		/** Position of the image relative to the container in pixels. */
		translate: { x: number; y: number };
	};
	/** The cropper window dimensions. */
	cropper: {
		/** The width of the cropper window. */
		width: number;
		/** The height of the cropper window */
		height: number;
	};
	/** The tilt angle in degrees from -45 to 45 for UI state. */
	tilt: number;
	/** Whether the image axis is swapped from 90 degree turns. */
	isAxisSwapped: boolean;
	/** Whether the cropper window aspect ratio is locked. */
	isAspectRatioLocked: boolean;
	/** Whether the cropper window is resizing. */
	isResizing: boolean;
	/** Whether the image is dragging/moving. */
	isDragging: boolean;
	/** Whether the image is zooming/pinching. */
	isZooming: boolean;
};

/** Zoom in/out to a scale. */
type ZoomAction = {
	/** Zoom type action. */
	type: 'ZOOM';
	/** Zoom scale. */
	scale: number;
	/** Zoom position. */
	position: Position;
};

/** End zooming. */
type ZoomEndAction = {
	/** Zoom end type action. */
	type: 'ZOOM_END';
};

/** Flip the image horizontally. */
type FlipAction = {
	/** Flip type action. */
	type: 'FLIP';
};

/** Set the image tilt to an angle. */
type SetTiltAction = {
	/** Rotate type action. */
	type: 'SET_TILT';
	/** Angle in degrees from -45 to 45. */
	tilt: number;
};

/** Rotate the image 90-degree clockwise or counter-clockwise. */
type Rotate90DegAction = {
	/** Rotate clockwise type action. */
	type: 'ROTATE_90_DEG';
	/** Whether to rotate counter-clockwise instead. */
	isCounterClockwise?: boolean;
};

/** Move the image to a position. */
type MoveAction = {
	/** Move type action. */
	type: 'MOVE';
	/** Move x position. */
	x: number;
	/** Move y position. */
	y: number;
};

/** End moving the image. */
type MoveEndAction = {
	/** Move end type action. */
	type: 'MOVE_END';
};

/** Start resizing the cropper window. */
type ResizeStartAction = {
	/** Resize start type action. */
	type: 'RESIZE_START';
};

/** Resize the cropper window by a delta size in a direction. */
type ResizeWindowAction = {
	/** Resize window type action. */
	type: 'RESIZE_WINDOW';
	/** Resize direction. */
	direction: ResizeDirection;
	/** Change in size. */
	delta: {
		/** Change in width. */
		width: number;
		/** Change in height. */
		height: number;
	};
};

/** Resize the container and image to a new width. */
type ResizeContainerAction = {
	/** Resize container type action. */
	type: 'RESIZE_CONTAINER';
	/** New width of the container. */
	width: number;
};

/** Reset the state to the initial state. */
type ResetAction = {
	/** Reset type action. */
	type: 'RESET';
};

/** Lock the aspect ratio of the cropper window. */
type lockAspectRatioAction = {
	/** Lock aspect ratio type action. */
	type: 'LOCK_ASPECT_RATIO';
	/** Aspect ratio to lock. */
	aspectRatio: number;
};

/** Unlock the aspect ratio of the cropper window. */
type unlockAspectRatioAction = {
	/** Unlock aspect ratio type action. */
	type: 'UNLOCK_ASPECT_RATIO';
};

/** All possible actions. */
type Action =
	| ZoomAction
	| ZoomEndAction
	| FlipAction
	| SetTiltAction
	| Rotate90DegAction
	| MoveAction
	| MoveEndAction
	| ResizeStartAction
	| ResizeWindowAction
	| ResizeContainerAction
	| ResetAction
	| lockAspectRatioAction
	| unlockAspectRatioAction;

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
		},
		transforms: {
			rotate: 0,
			scale: { x: 1, y: 1 },
			translate: { x: 0, y: 0 },
		},
		cropper: {
			width,
			height,
		},
		tilt: 0,
		isAxisSwapped: false,
		isAspectRatioLocked: false,
		isResizing: false,
		isDragging: false,
		isZooming: false,
	};
}

function imageCropperReducer( state: State, action: Action ): State {
	const {
		image,
		transforms: { rotate, scale, translate },
		cropper,
		isAxisSwapped,
	} = state;
	switch ( action.type ) {
		case 'ZOOM': {
			const minScale = getMinScale(
				rotate,
				image.width,
				image.height,
				cropper.width,
				cropper.height,
				translate.x,
				translate.y
			);
			const nextScale = Math.min(
				Math.max( action.scale, minScale ),
				10
			);

			return {
				...state,
				transforms: {
					...state.transforms,
					translate: action.position,
					scale: {
						x: nextScale * Math.sign( scale.x ),
						y: nextScale * Math.sign( scale.y ),
					},
				},
				isZooming: true,
			};
		}
		case 'ZOOM_END': {
			return {
				...state,
				isZooming: false,
			};
		}
		case 'FLIP': {
			return {
				...state,
				transforms: {
					...state.transforms,
					translate: {
						...translate,
						x: -translate.x,
					},
					rotate: -rotate,
					scale: {
						x: scale.x * ( isAxisSwapped ? 1 : -1 ),
						y: scale.y * ( isAxisSwapped ? -1 : 1 ),
					},
				},
			};
		}
		case 'SET_TILT': {
			const radian = degreeToRadian( state.tilt );
			const nextRadian = degreeToRadian( action.tilt );
			const nextRotate = rotate - radian + nextRadian;
			const absScale = Math.abs( scale.x );
			const scaledWidth = image.width * absScale;
			const scaledHeight = image.height * absScale;

			// Calculate the translation of the image center after the rotation.
			// This is needed to rotate from the center of the cropper rather than the
			// center of the image.
			const rotatedPosition = rotatePoint(
				translate,
				nextRotate - rotate
			);

			// Calculate the minimum scale to fit the image within the cropper.
			// TODO: Optimize the performance?
			const minScale =
				getMinScale(
					nextRotate,
					scaledWidth,
					scaledHeight,
					cropper.width,
					cropper.height,
					rotatedPosition.x,
					rotatedPosition.y
				) * absScale;
			const nextScale = Math.min( Math.max( absScale, minScale ), 10 );

			return {
				...state,
				transforms: {
					...state.transforms,
					rotate: nextRotate,
					translate: rotatedPosition,
					scale: {
						x: nextScale * Math.sign( scale.x ),
						y: nextScale * Math.sign( scale.y ),
					},
				},
				tilt: action.tilt,
			};
		}
		case 'ROTATE_90_DEG': {
			const angle = action.isCounterClockwise
				? -PI_OVER_TWO
				: PI_OVER_TWO;
			const rotatedPosition = rotatePoint( translate, angle );
			return {
				...state,
				transforms: {
					...state.transforms,
					translate: rotatedPosition,
					rotate: rotate + angle,
				},
				cropper: {
					...state.cropper,
					width: cropper.height,
					height: cropper.width,
				},
				isAxisSwapped: ! isAxisSwapped,
			};
		}
		case 'MOVE': {
			const absScale = Math.abs( scale.x );

			// Calculate the boundaries of the area where the cropper can move.
			// These boundaries ensure the cropper stays within the image.
			const { minX, maxX, minY, maxY } = calculateRotatedBounds(
				rotate,
				image.width * absScale,
				image.height * absScale,
				cropper.width,
				cropper.height
			);

			// Rotate the action point to align with the non-rotated coordinate system.
			const rotatedPoint = rotatePoint(
				{ x: action.x, y: action.y },
				-rotate
			);

			// Constrain the rotated point to within the calculated boundaries.
			// This ensures the cropper doesn't move outside the image.
			const boundPoint = {
				x: Math.min( Math.max( rotatedPoint.x, minX ), maxX ),
				y: Math.min( Math.max( rotatedPoint.y, minY ), maxY ),
			};

			// Rotate the constrained point back to the original coordinate system.
			const nextPosition = rotatePoint( boundPoint, rotate );

			return {
				...state,
				transforms: {
					...state.transforms,
					translate: nextPosition,
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
		case 'RESIZE_WINDOW': {
			const { direction, delta } = action;

			// Calculate the new size of the cropper.
			const newSize = {
				width: cropper.width + delta.width,
				height: cropper.height + delta.height,
			};

			// Determine the actual dimensions of the image, considering rotations.
			const imageDimensions = {
				width: isAxisSwapped ? image.height : image.width,
				height: isAxisSwapped ? image.width : image.height,
			};

			// Calculate the scale of the image to fit within the new size.
			const widthScale = imageDimensions.width / newSize.width;
			const heightScale = imageDimensions.height / newSize.height;
			const windowScale = Math.min( widthScale, heightScale );
			const absScale = Math.abs( scale.x );
			const nextScale = absScale * windowScale;

			const scaledSize = {
				width: imageDimensions.width,
				height: imageDimensions.height,
			};
			const translated = { x: 0, y: 0 };
			// Adjust scaled size and translation based on which dimension is limiting.
			// We do this instead of multiplying by windowScale to account for floating point errors.
			if ( widthScale === windowScale ) {
				scaledSize.height = newSize.height * windowScale;
				translated.y =
					imageDimensions.height / 2 - scaledSize.height / 2;
			} else {
				scaledSize.width = newSize.width * windowScale;
				translated.x = imageDimensions.width / 2 - scaledSize.width / 2;
			}

			// Calculate the delta for the image in each direction.
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

			return {
				...state,
				transforms: {
					...state.transforms,
					translate: {
						x: ( translate.x + deltaX / 2 ) * windowScale,
						y: ( translate.y + deltaY / 2 ) * windowScale,
					},
					scale: {
						x: nextScale * Math.sign( scale.x ),
						y: nextScale * Math.sign( scale.y ),
					},
				},
				cropper: {
					...state.cropper,
					width: scaledSize.width,
					height: scaledSize.height,
				},
				isResizing: false,
			};
		}
		case 'LOCK_ASPECT_RATIO': {
			// Calculate the size of the cropper based on the aspect ratio.
			const largerDimension = Math.max( image.width, image.height );
			const cropperSize =
				action.aspectRatio > 1
					? {
							width: largerDimension,
							height: largerDimension / action.aspectRatio,
					  }
					: {
							width: largerDimension / action.aspectRatio,
							height: largerDimension,
					  };

			const minScale = getMinScale(
				rotate,
				image.width,
				image.height,
				cropperSize.width,
				cropperSize.height,
				translate.x,
				translate.y
			);
			const absScale = Math.abs( scale.x );
			const nextScale = Math.min( Math.max( absScale, minScale ), 10 );

			return {
				...state,
				transforms: {
					...state.transforms,
					scale: {
						x: nextScale * Math.sign( scale.x ),
						y: nextScale * Math.sign( scale.y ),
					},
				},
				cropper: {
					...state.cropper,
					...cropperSize,
				},
				isAspectRatioLocked: true,
			};
		}
		case 'UNLOCK_ASPECT_RATIO': {
			return {
				...state,
				isAspectRatioLocked: false,
			};
		}
		case 'RESIZE_CONTAINER': {
			const imageInlineSize = isAxisSwapped ? image.height : image.width;
			const ratio = action.width / imageInlineSize;

			if ( ratio === 1 ) {
				return state;
			}

			return {
				...state,
				image: {
					...state.image,
					width: image.width * ratio,
					height: image.height * ratio,
				},
				cropper: {
					...state.cropper,
					width: cropper.width * ratio,
					height: cropper.height * ratio,
				},
				transforms: {
					...state.transforms,
					translate: {
						x: translate.x * ratio,
						y: translate.y * ratio,
					},
				},
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
