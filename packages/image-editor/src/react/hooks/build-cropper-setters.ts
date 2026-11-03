import type {
	CropperAction,
	CropperControllerState,
	Flip,
	NormalizedPoint,
	NormalizedRect,
	Size,
	TransformOperation,
} from '../../core/types';
import { buildFocalPointZoomAction } from '../../core/setter-helpers';

/**
 * The named cropper setters `useCropperController` exposes.
 *
 * `setImage` and `reset` are not included: the controller has extra
 * bookkeeping for them (its dirty baseline).
 */
export interface CropperSetters {
	setPan: ( pan: NormalizedPoint ) => void;
	setZoom: ( zoom: number ) => void;
	setZoomAtPoint: ( zoom: number, pan: NormalizedPoint ) => void;
	setRotation: ( rotation: number ) => void;
	setFlip: ( flip: Flip ) => void;
	toggleFlip: ( direction: 'horizontal' | 'vertical' ) => void;
	snapRotate90: ( direction: 1 | -1 ) => void;
	setCropRect: ( rect: NormalizedRect ) => void;
	/**
	 * Lock the crop to a width / height ratio in source pixels, or
	 * unlock it with `undefined`. Locking reshapes the crop to the
	 * largest box of that ratio. `<Cropper>` reads the ratio from the
	 * state to lock its resize handles.
	 */
	setAspectRatio: ( aspectRatio: number | undefined ) => void;
	settleCrop: () => void;
	applyOperation: ( op: TransformOperation ) => void;
}

/**
 * Build the named cropper setters from a dispatch function and getters
 * for the latest state and the rendered size.
 *
 * @param dispatchCropperAction Apply a `CropperAction` to the
 *                              underlying reducer.
 * @param getCropperState       Return the current `CropperControllerState`.
 *                              Used by setters that need to read
 *                              the latest state to compute their
 *                              payload (focal-point zoom, flip toggle).
 * @param getVisualSize         Return the rendered image size the
 *                              `<Cropper>` last reported, which
 *                              `setAspectRatio` needs to reshape the
 *                              crop.
 * @return The named cropper setters.
 */
export function buildCropperSetters(
	dispatchCropperAction: ( action: CropperAction ) => void,
	getCropperState: () => CropperControllerState,
	getVisualSize: () => Size
): CropperSetters {
	return {
		setPan: ( pan ) =>
			dispatchCropperAction( { type: 'SET_PAN', payload: pan } ),
		setZoom: ( zoom ) => {
			const action = buildFocalPointZoomAction( getCropperState(), zoom );
			if ( action ) {
				dispatchCropperAction( action );
			}
		},
		setZoomAtPoint: ( zoom, pan ) =>
			dispatchCropperAction( {
				type: 'SET_ZOOM_AT_POINT',
				payload: { zoom, pan },
			} ),
		setRotation: ( rotation ) =>
			dispatchCropperAction( {
				type: 'SET_ROTATION',
				payload: rotation,
			} ),
		setFlip: ( flip ) =>
			dispatchCropperAction( { type: 'SET_FLIP', payload: flip } ),
		toggleFlip: ( direction ) => {
			const { flip } = getCropperState();
			dispatchCropperAction( {
				type: 'SET_FLIP',
				payload: { ...flip, [ direction ]: ! flip[ direction ] },
			} );
		},
		snapRotate90: ( direction ) =>
			dispatchCropperAction( {
				type: 'SNAP_ROTATE_90',
				payload: { direction },
			} ),
		setCropRect: ( rect ) =>
			dispatchCropperAction( {
				type: 'SET_CROP_RECT',
				payload: rect,
			} ),
		setAspectRatio: ( aspectRatio ) =>
			dispatchCropperAction( {
				type: 'SET_ASPECT_RATIO',
				payload: { aspectRatio, visualSize: getVisualSize() },
			} ),
		settleCrop: () => dispatchCropperAction( { type: 'SETTLE_CROP' } ),
		applyOperation: ( op ) =>
			dispatchCropperAction( {
				type: 'APPLY_OPERATION',
				payload: op,
			} ),
	};
}
