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
			onEdit: ( field: CropEditField, value: number ) => void;
			onEditEnd: () => void;
			/**
			 * Pass to each numeric control's `onSessionStart`. Pauses the
			 * cropper's auto-history debounce so a focused edit session
			 * accumulates state changes without producing intermediate
			 * undo entries.
			 */
			onSessionStart: () => void;
			/**
			 * Pass to each numeric control's `onSessionEnd`. Resumes the
			 * debounce. The session's single undo entry is recorded by
			 * `onEditEnd` (which calls `settleCrop` → `commitHistory`).
			 */
			onSessionEnd: () => void;
	  };

export interface UseAdvancedCropControlsArgs {
	aspectRatio?: number;
	freeformCrop: boolean;
	onPlacementControlInteraction?: () => void;
}

/**
 * Hook that wires the advanced crop panel to the cropper controller.
 *
 * Resolves the current crop geometry, computes editable ranges, and returns
 * commit handlers that:
 *  - call `setCropRect` immediately on each valid edit so the preview tracks
 *    typing,
 *  - call `settleCrop` on edit completion so the resize-end re-center fires
 *    once per discrete edit (rotation uses `commitHistory` instead — fine
 *    rotation doesn't reshape the crop, it just needs the gesture's history
 *    entry flushed).
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

	const onEdit = useCallback(
		( field: CropEditField, value: number ) => {
			if ( ! geometry.isReady ) {
				return;
			}
			const next = applyCropEdit( geometry.rect, field, value, {
				aspectRatio,
				bounds: geometry.imageBounds,
			} );
			setCropRect(
				cropPixelRectToNormalizedRect( next, state, imageSize )
			);
			onPlacementControlInteraction?.();
		},
		[
			geometry,
			aspectRatio,
			setCropRect,
			state,
			imageSize,
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
	imageBounds: CropPixelRectBounds,
	aspectRatio: number | undefined,
	freeformCrop: boolean
): AdvancedCropRanges {
	const left = makeRange(
		imageBounds.minLeft,
		imageBounds.maxRight - rect.width
	);
	const top = makeRange(
		imageBounds.minTop,
		imageBounds.maxBottom - rect.height
	);

	if ( ! freeformCrop ) {
		return {
			left,
			top,
			width: makeRange( rect.width, rect.width, false ),
			height: makeRange( rect.height, rect.height, false ),
		};
	}

	let minWidth = imageBounds.minWidth;
	let maxWidth = imageBounds.maxWidth;
	let minHeight = imageBounds.minHeight;
	let maxHeight = imageBounds.maxHeight;

	if ( aspectRatio && aspectRatio > 0 ) {
		minWidth = Math.max( minWidth, imageBounds.minHeight * aspectRatio );
		maxWidth = Math.min( maxWidth, imageBounds.maxHeight * aspectRatio );
		minHeight = Math.max( minHeight, imageBounds.minWidth / aspectRatio );
		maxHeight = Math.min( maxHeight, imageBounds.maxWidth / aspectRatio );
	}

	return {
		left,
		top,
		width: makeRange( minWidth, maxWidth ),
		height: makeRange( minHeight, maxHeight ),
	};
}
