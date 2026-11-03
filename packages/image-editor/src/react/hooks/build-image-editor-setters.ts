import type {
	ImageEditorAction,
	InternalImageEditorState,
	Flip,
	NormalizedPoint,
	NormalizedRect,
} from '../../core/types';
import { buildFocalPointZoomAction } from '../../core/setter-helpers';

/**
 * The named editor setters `useInternalImageEditor` exposes.
 *
 * `setImage` and `reset` are not included: the controller has extra
 * bookkeeping for them (its dirty baseline).
 */
export interface ImageEditorSetters {
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
	 * largest box of that ratio. `<ImageEditorCanvas>` reads the ratio from the
	 * state to lock its resize handles.
	 */
	setAspectRatio: ( aspectRatio: number | undefined ) => void;
	settleCrop: () => void;
}

/**
 * Build the named editor setters from a dispatch function and a getter
 * for the latest state.
 *
 * @param dispatchAction Apply a `ImageEditorAction` to the
 *                       underlying reducer.
 * @param getState       Return the current `InternalImageEditorState`.
 *                       Used by setters that need to read
 *                       the latest state to compute their
 *                       payload (focal-point zoom, flip toggle).
 * @return The named editor setters.
 */
export function buildImageEditorSetters(
	dispatchAction: ( action: ImageEditorAction ) => void,
	getState: () => InternalImageEditorState
): ImageEditorSetters {
	return {
		setPan: ( pan ) => dispatchAction( { type: 'SET_PAN', payload: pan } ),
		setZoom: ( zoom ) => {
			const action = buildFocalPointZoomAction( getState(), zoom );
			if ( action ) {
				dispatchAction( action );
			}
		},
		setZoomAtPoint: ( zoom, pan ) =>
			dispatchAction( {
				type: 'SET_ZOOM_AT_POINT',
				payload: { zoom, pan },
			} ),
		setRotation: ( rotation ) =>
			dispatchAction( {
				type: 'SET_ROTATION',
				payload: rotation,
			} ),
		setFlip: ( flip ) =>
			dispatchAction( { type: 'SET_FLIP', payload: flip } ),
		toggleFlip: ( direction ) => {
			const { flip } = getState();
			dispatchAction( {
				type: 'SET_FLIP',
				payload: { ...flip, [ direction ]: ! flip[ direction ] },
			} );
		},
		snapRotate90: ( direction ) =>
			dispatchAction( {
				type: 'SNAP_ROTATE_90',
				payload: { direction },
			} ),
		setCropRect: ( rect ) =>
			dispatchAction( {
				type: 'SET_CROP_RECT',
				payload: rect,
			} ),
		setAspectRatio: ( aspectRatio ) =>
			dispatchAction( {
				type: 'SET_ASPECT_RATIO',
				payload: aspectRatio,
			} ),
		settleCrop: () => dispatchAction( { type: 'SETTLE_CROP' } ),
	};
}
