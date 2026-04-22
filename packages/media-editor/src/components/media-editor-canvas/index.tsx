/**
 * Internal dependencies
 */
import { useMediaEditorContext } from '../media-editor-provider';
import { getMediaTypeFromMimeType } from '../../utils';
import { Cropper, useCropperState } from '../../image-editor';

/**
 * Props for MediaEditorCanvas.
 */
export interface MediaEditorCanvasProps {
	/**
	 * Called on each cropper gesture end with the current dirty state.
	 *
	 * The modal captures this so a later save-path PR can react without
	 * re-plumbing. Not used to drive UI in this PR.
	 */
	onDirtyChange?: ( isDirty: boolean ) => void;
}

/**
 * Editing surface for image media in the media editor modal.
 *
 * Sibling to `MediaPreview`: `MediaPreview` is a passive viewer, this is the
 * interactive editor. The modal decides which to render based on media type.
 *
 * Returns `null` for missing or non-image media so the modal's outer guards
 * can render a spinner or fall through to `<MediaPreview>` respectively.
 *
 * @param props               Component props.
 * @param props.onDirtyChange Called on each cropper gesture end with the
 *                            current dirty state.
 */
export default function MediaEditorCanvas( {
	onDirtyChange,
}: MediaEditorCanvasProps ) {
	const { media } = useMediaEditorContext();
	const controller = useCropperState();

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
				onGestureEnd={ () => onDirtyChange?.( controller.isDirty ) }
			/>
		</div>
	);
}
