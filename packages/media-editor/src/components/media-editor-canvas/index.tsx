/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useMediaEditorContext } from '../media-editor-provider';
import { getMediaTypeFromMimeType } from '../../utils';
import { Cropper } from '../../image-editor';
import { useMediaEditor, resolveAspectRatio } from '../../state';

export interface MediaEditorCanvasProps {
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
 * Editing surface for image media in the media editor modal. Pulls
 * its cropper controller from the surrounding `<MediaEditorStateProvider>`
 * so the bottom bar and Crop sidebar tab share the same state.
 *
 * Returns `null` for missing or non-image media so the modal's outer
 * guards can render a spinner or fall through to `<MediaPreview>`.
 *
 * @param props
 * @param props.focusOnMount
 * @param props.isPlacementActive
 * @param props.onGestureStart
 * @param props.onGestureEnd
 */
export default function MediaEditorCanvas( {
	focusOnMount,
	isPlacementActive = false,
	onGestureStart,
	onGestureEnd,
}: MediaEditorCanvasProps ) {
	const { media } = useMediaEditorContext();
	const controller = useMediaEditor();
	const { aspectRatioValue } = controller.cropOptions;
	const cropperImage = controller.state.image;
	const { beginGesture, endGesture, setImage } = controller;

	// Resolved aspect ratio is derived from the preset key + the
	// loaded image (for the "Original" preset). The reducer doesn't
	// store this number — only the preset key — so it's a render-time
	// derivation here.
	const aspectRatio = useMemo(
		() => resolveAspectRatio( aspectRatioValue, cropperImage ),
		[ aspectRatioValue, cropperImage ]
	);

	const handleGestureStart = useCallback( () => {
		beginGesture();
		onGestureStart?.();
	}, [ beginGesture, onGestureStart ] );

	const handleGestureEnd = useCallback( () => {
		endGesture();
		onGestureEnd?.();
	}, [ endGesture, onGestureEnd ] );

	const mediaUrl = media?.source_url;
	const mediaType = getMediaTypeFromMimeType( media?.mime_type );
	const mediaWidth = Number( media?.media_details?.width );
	const mediaHeight = Number( media?.media_details?.height );

	useEffect( () => {
		if (
			cropperImage ||
			! mediaUrl ||
			! Number.isFinite( mediaWidth ) ||
			! Number.isFinite( mediaHeight ) ||
			mediaWidth <= 0 ||
			mediaHeight <= 0
		) {
			return;
		}
		setImage( {
			src: mediaUrl,
			naturalWidth: mediaWidth,
			naturalHeight: mediaHeight,
		} );
	}, [ cropperImage, mediaUrl, mediaWidth, mediaHeight, setImage ] );

	if ( ! mediaUrl || mediaType.type !== 'image' ) {
		return null;
	}

	return (
		<div className="media-editor-canvas">
			<Cropper
				src={ mediaUrl }
				controller={ controller }
				aspectRatio={ aspectRatio }
				freeformCrop
				focusOnMount={ focusOnMount }
				showGrid="interactive"
				isPlacementActive={ isPlacementActive }
				onGestureStart={ handleGestureStart }
				onGestureEnd={ handleGestureEnd }
			/>
		</div>
	);
}
