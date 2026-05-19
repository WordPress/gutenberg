/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useMediaEditorContext } from '../media-editor-provider';
import { getMediaTypeFromMimeType } from '../../utils';
import { Cropper, useCropper } from '../../image-editor';

export interface MediaEditorCanvasProps {
	/** Fixed aspect ratio (width / height). `undefined` means free. */
	aspectRatio?: number;
	/** Enable freeform crop mode (resize handles). */
	freeformCrop?: boolean;
	/** Focus the crop area when the canvas mounts. */
	focusOnMount?: boolean;
	/** Whether external placement activity should reveal the grid. */
	isPlacementActive?: boolean;
	/** Fires when a canvas cropper gesture begins. */
	onGestureStart?: () => void;
	/** Fires when a canvas cropper gesture ends. */
	onGestureEnd?: () => void;
}

/**
 * Editing surface for image media in the media editor modal. Pulls its
 * cropper controller from the surrounding `<CropperProvider>` so the
 * bottom bar and Crop sidebar tab share the same state.
 *
 * Returns `null` for missing or non-image media so the modal's outer
 * guards can render a spinner or fall through to `<MediaPreview>`.
 * @param props
 * @param props.aspectRatio
 * @param props.freeformCrop
 * @param props.focusOnMount
 * @param props.isPlacementActive
 * @param props.onGestureStart
 * @param props.onGestureEnd
 */
export default function MediaEditorCanvas( {
	aspectRatio,
	freeformCrop,
	focusOnMount,
	isPlacementActive = false,
	onGestureStart,
	onGestureEnd,
}: MediaEditorCanvasProps ) {
	const { media } = useMediaEditorContext();
	const controller = useCropper();

	const handleGestureStart = useCallback( () => {
		onGestureStart?.();
		controller.commitHistory();
	}, [ controller, onGestureStart ] );

	const handleGestureEnd = useCallback( () => {
		controller.commitHistory();
		onGestureEnd?.();
	}, [ controller, onGestureEnd ] );

	const mediaUrl = media?.source_url;
	const mediaType = getMediaTypeFromMimeType( media?.mime_type );

	if ( ! mediaUrl || mediaType.type !== 'image' ) {
		return null;
	}

	return (
		<div className="media-editor-canvas">
			<Cropper
				src={ mediaUrl }
				controller={ controller }
				aspectRatio={ aspectRatio }
				freeformCrop={ freeformCrop }
				focusOnMount={ focusOnMount }
				showGrid="interactive"
				isPlacementActive={ isPlacementActive }
				// Flush on gesture start so any pending sidebar interaction
				// (e.g. zoom slider debounce) is committed as its own undo
				// step before the canvas gesture begins.
				onGestureStart={ handleGestureStart }
				onGestureEnd={ handleGestureEnd }
			/>
		</div>
	);
}
