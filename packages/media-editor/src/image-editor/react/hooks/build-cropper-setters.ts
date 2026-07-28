/**
 * Internal dependencies
 */
import type {
	CropperAction,
	CropperState,
	Flip,
	NormalizedPoint,
	NormalizedRect,
	TransformOperation,
} from '../../core/types';
import { buildFocalPointZoomAction } from '../../core/setter-helpers';

/**
 * The named cropper setters shared by every hook that drives the
 * cropper reducer — the pure `useCropperReducer` and any composite
 * store that delegates cropper actions (e.g. `useMediaEditorState`).
 *
 * `setImage` and `reset` are intentionally NOT included: each hook
 * has additional bookkeeping for them (dirty-baseline, history clear)
 * that doesn't fit a shared factory.
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
	settleCrop: () => void;
	applyOperation: ( op: TransformOperation ) => void;
}

/**
 * Build the named cropper setters from a dispatch function and a
 * state getter. The two consuming hooks differ in how they dispatch:
 *
 * - `useCropperReducer` dispatches directly into its `useReducer`.
 * - `useMediaEditorState` wraps cropper actions in a composite
 *   `CROPPER` envelope so the history machinery can record them.
 *
 * Both pass their own dispatch function and a getter that returns
 * the current `CropperState`. The factory shape keeps the two hooks
 * in lockstep — add a setter here once, both hooks get it.
 *
 * @param dispatchCropperAction Apply a `CropperAction` to the
 *                              underlying reducer.
 * @param getCropperState       Return the current `CropperState`.
 *                              Used by setters that need to read
 *                              the latest state to compute their
 *                              payload (focal-point zoom, flip toggle).
 * @return The named cropper setters.
 */
export function buildCropperSetters(
	dispatchCropperAction: ( action: CropperAction ) => void,
	getCropperState: () => CropperState
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
		settleCrop: () => dispatchCropperAction( { type: 'SETTLE_CROP' } ),
		applyOperation: ( op ) =>
			dispatchCropperAction( {
				type: 'APPLY_OPERATION',
				payload: op,
			} ),
	};
}
