/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useMediaEditor } from '../../state';
import {
	applyCropEdit,
	cropPixelRectToNormalizedRect,
	type CropEditField,
	type CropPixelRect,
	type CropPixelRectBounds,
} from '../../image-editor/core/crop-geometry';
import { fineRotation } from '../../image-editor/core/fine-rotation';
import { useSetCropperPreviewRect } from '../../image-editor/react/components/cropper-provider';
import { useCropGeometry } from '../../image-editor/react/hooks/use-crop-geometry';
import { makeRange, type CropInputRange } from './crop-input-utils';

export interface AdvancedCropRanges {
	left: CropInputRange;
	top: CropInputRange;
	width: CropInputRange;
	height: CropInputRange;
}

export interface AdvancedFineRotationConfig {
	offset: number;
	range: CropInputRange;
	step: number;
	onEdit: ( value: number ) => void;
	onEditEnd: () => void;
}

export type AdvancedCropControlsState =
	| { isReady: false }
	| {
			isReady: true;
			rect: CropPixelRect;
			imageBounds: CropPixelRectBounds;
			canMoveCropRect: boolean;
			ranges: AdvancedCropRanges;
			fineRotation: AdvancedFineRotationConfig;
			onPreview: ( field: CropEditField, value: number | null ) => void;
			onEdit: ( field: CropEditField, value: number ) => void;
			onEditEnd: () => void;
			/**
			 * Pass to live numeric controls' `onSessionStart` so the focused
			 * edit session opens one undo boundary.
			 */
			onSessionStart: () => void;
			/**
			 * Pass to live numeric controls' `onSessionEnd` so the focused
			 * edit session closes one undo boundary.
			 */
			onSessionEnd: () => void;
	  };

export interface UseAdvancedCropControlsArgs {
	aspectRatio?: number;
	freeformCrop: boolean;
	onPlacementControlInteraction?: () => void;
}

// 1px — absorbs sub-pixel drift from rotation/zoom that would otherwise
// leave `rect.left` at, say, 0.0003 when the user clearly placed the crop
// against the image edge. Treat anything closer than 1px to the edge as
// anchored so the width/height ranges report a clean "from edge to edge".
const EDGE_SNAP_EPSILON = 1;

/**
 * Hook that wires the advanced crop panel to the cropper controller.
 *
 * Crop rectangle controls are draft-first: valid drafts paint a preview
 * rectangle, then blur/Enter commits the rect once and settles the cropper.
 * Fine rotation remains live because visual feedback is essential there.
 *
 * Returns `{ isReady: false }` until the cropper has measurements; the panel
 * component should render nothing in that case.
 *
 * @param args                               Hook arguments.
 * @param args.aspectRatio
 * @param args.freeformCrop
 * @param args.onPlacementControlInteraction
 * @return Either an unready sentinel or the panel's full data + handlers.
 */
export function useAdvancedCropControls( {
	aspectRatio,
	freeformCrop,
	onPlacementControlInteraction,
}: UseAdvancedCropControlsArgs ): AdvancedCropControlsState {
	const {
		state,
		setCropRect,
		setRotation,
		settleCrop,
		beginGesture,
		endGesture,
	} = useMediaEditor();
	const geometry = useCropGeometry();
	const setPreviewCropRect = useSetCropperPreviewRect();

	const imageSize = useMemo(
		() =>
			state.image
				? {
						width: state.image.naturalWidth,
						height: state.image.naturalHeight,
				  }
				: { width: 0, height: 0 },
		[ state.image ]
	);

	const getEditedRect = useCallback(
		( field: CropEditField, value: number ): CropPixelRect | null => {
			if ( ! geometry.isReady ) {
				return null;
			}
			return applyCropEdit( geometry.rect, field, value, {
				aspectRatio,
				bounds: geometry.imageBounds,
			} );
		},
		[ geometry, aspectRatio ]
	);

	const onPreview = useCallback(
		( field: CropEditField, value: number | null ) => {
			if ( value === null ) {
				setPreviewCropRect( null );
				return;
			}
			const next = getEditedRect( field, value );
			setPreviewCropRect(
				next
					? cropPixelRectToNormalizedRect( next, state, imageSize )
					: null
			);
			onPlacementControlInteraction?.();
		},
		[
			getEditedRect,
			state,
			imageSize,
			setPreviewCropRect,
			onPlacementControlInteraction,
		]
	);

	const onEdit = useCallback(
		( field: CropEditField, value: number ) => {
			const next = getEditedRect( field, value );
			setPreviewCropRect( null );
			if ( ! next ) {
				return;
			}
			setCropRect(
				cropPixelRectToNormalizedRect( next, state, imageSize )
			);
			onPlacementControlInteraction?.();
		},
		[
			getEditedRect,
			setCropRect,
			state,
			imageSize,
			setPreviewCropRect,
			onPlacementControlInteraction,
		]
	);

	const onEditEnd = useCallback( () => {
		settleCrop();
		onPlacementControlInteraction?.();
	}, [ settleCrop, onPlacementControlInteraction ] );

	const onFineRotationEdit = useCallback(
		( value: number ) => {
			const clampedOffset = fineRotation.clamp( value );
			if (
				! fineRotation.hasChanged(
					clampedOffset,
					fineRotation.offsetFromState( state.rotation, state.flip )
				)
			) {
				return;
			}
			setRotation(
				fineRotation.absoluteFromOffset(
					state.rotation,
					state.flip,
					clampedOffset
				)
			);
			onPlacementControlInteraction?.();
		},
		[
			state.rotation,
			state.flip,
			setRotation,
			onPlacementControlInteraction,
		]
	);

	const onSessionStart = useCallback( () => {
		beginGesture();
	}, [ beginGesture ] );

	const onSessionEnd = useCallback( () => {
		endGesture();
	}, [ endGesture ] );

	if ( ! geometry.isReady ) {
		return { isReady: false };
	}

	const { rect, imageBounds } = geometry;
	const ranges = buildRanges( rect, imageBounds, aspectRatio, freeformCrop );
	const fineRotationOffset = fineRotation.offsetFromState(
		state.rotation,
		state.flip
	);

	return {
		isReady: true,
		rect,
		imageBounds,
		canMoveCropRect: freeformCrop,
		ranges,
		onPreview,
		onSessionStart,
		onSessionEnd,
		fineRotation: {
			offset: fineRotationOffset,
			range: makeRange( fineRotation.min, fineRotation.max ),
			step: fineRotation.step,
			onEdit: onFineRotationEdit,
			onEditEnd: () => {},
		},
		onEdit,
		onEditEnd,
	};
}

function buildRanges(
	rect: CropPixelRect,
	bounds: CropPixelRectBounds,
	aspectRatio: number | undefined,
	freeformCrop: boolean
): AdvancedCropRanges {
	const anchoredLeft =
		Math.abs( rect.left - bounds.minLeft ) < EDGE_SNAP_EPSILON
			? bounds.minLeft
			: rect.left;
	const anchoredTop =
		Math.abs( rect.top - bounds.minTop ) < EDGE_SNAP_EPSILON
			? bounds.minTop
			: rect.top;
	const maxWidthAtCurrentLeft = bounds.maxRight - anchoredLeft;
	const maxHeightAtCurrentTop = bounds.maxBottom - anchoredTop;
	const left = makeRange( bounds.minLeft, bounds.maxRight - rect.width );
	const top = makeRange( bounds.minTop, bounds.maxBottom - rect.height );

	if ( ! freeformCrop ) {
		return {
			left,
			top,
			width: makeRange( rect.width, rect.width, false ),
			height: makeRange( rect.height, rect.height, false ),
		};
	}

	let minWidth = bounds.minWidth;
	let maxWidth = maxWidthAtCurrentLeft;
	let minHeight = bounds.minHeight;
	let maxHeight = maxHeightAtCurrentTop;

	if ( aspectRatio && aspectRatio > 0 ) {
		// Aspect-ratio coupling: lower bounds use the image's hard minimum
		// (independent of current position), upper bounds use the
		// position-anchored max so the coupled dimension can't push the
		// crop past the bottom/right edge of the image.
		minWidth = Math.max( minWidth, bounds.minHeight * aspectRatio );
		maxWidth = Math.min( maxWidth, maxHeightAtCurrentTop * aspectRatio );
		minHeight = Math.max( minHeight, bounds.minWidth / aspectRatio );
		maxHeight = Math.min( maxHeight, maxWidthAtCurrentLeft / aspectRatio );
	}

	return {
		left,
		top,
		width: makeRange( minWidth, maxWidth ),
		height: makeRange( minHeight, maxHeight ),
	};
}
