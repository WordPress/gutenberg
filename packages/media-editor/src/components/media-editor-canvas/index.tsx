import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { Spinner as WCSpinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMediaEditorContext } from '../media-editor-provider';
import { getMediaTypeFromMimeType } from '../../utils';
import { Cropper } from '../../image-editor';
import { useMediaEditor, resolveAspectRatio } from '../../state';

export interface MediaEditorCanvasProps {
	/** Whether external placement activity should reveal the grid. */
	isPlacementActive?: boolean;
	/** Fires when a canvas cropper gesture begins. */
	onGestureStart?: () => void;
	/** Fires when a canvas cropper gesture ends. */
	onGestureEnd?: () => void;
	/**
	 * Disable crop interaction on the canvas. Set while the edit is saving,
	 * so a drag cannot change the crop after the request was built.
	 */
	disabled?: boolean;
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
 * @param props.isPlacementActive
 * @param props.onGestureStart
 * @param props.onGestureEnd
 * @param props.disabled
 */
export default function MediaEditorCanvas( {
	isPlacementActive = false,
	onGestureStart,
	onGestureEnd,
	disabled = false,
}: MediaEditorCanvasProps ) {
	const { media } = useMediaEditorContext();
	const session = useMediaEditor();
	const { aspectRatioValue } = session.cropOptions;
	const cropperImage = session.cropper.state.image;
	const { beginGesture, endGesture, setSourceImage } = session;

	// Tracks whether the image pixels have actually loaded. The cropper's
	// geometry is driven by the known media dimensions, so its handles and
	// overlays would otherwise appear before the image finishes streaming in.
	// Stored with the URL it is for, so a new URL (restoring the original
	// swaps it in place) counts as loading until the cropper reports back.
	const [ settled, setSettled ] = useState< {
		url: string | undefined;
		status: 'loaded' | 'error';
	} >();

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
			! mediaUrl ||
			! Number.isFinite( mediaWidth ) ||
			! Number.isFinite( mediaHeight ) ||
			mediaWidth <= 0 ||
			mediaHeight <= 0
		) {
			return;
		}
		setSourceImage( {
			src: mediaUrl,
			naturalWidth: mediaWidth,
			naturalHeight: mediaHeight,
		} );
	}, [ mediaUrl, mediaWidth, mediaHeight, setSourceImage ] );

	const isImage = mediaType.type === 'image';
	const status =
		settled && settled.url === mediaUrl ? settled.status : 'loading';
	const handleImageLoaded = useCallback( () => {
		setSettled( { url: mediaUrl, status: 'loaded' } );
	}, [ mediaUrl ] );
	const handleImageError = useCallback( () => {
		setSettled( { url: mediaUrl, status: 'error' } );
	}, [ mediaUrl ] );

	if ( ! mediaUrl || ! isImage ) {
		return null;
	}

	if ( status === 'error' ) {
		return (
			<div className="media-editor-canvas">
				<div className="media-editor-canvas__error" role="alert">
					<p>{ __( 'Failed to load image.' ) }</p>
				</div>
			</div>
		);
	}

	return (
		<div className="media-editor-canvas">
			{ status === 'loading' && (
				<div className="media-editor-canvas__spinner">
					<WCSpinner />
				</div>
			) }
			{ /*
			 * The cropper stays mounted while loading (hidden behind the
			 * spinner) so the image decodes off-screen and reveals in one paint
			 * instead of streaming in top-to-bottom. Until it's revealed it's
			 * non-interactive (`pointer-events: none` in CSS).
			 *
			 * The crop area is never focused programmatically: the modal keeps
			 * initial focus on the dialog frame, and users reach the crop area
			 * by tabbing to it.
			 */ }
			<div
				className={ clsx( 'media-editor-canvas__cropper', {
					'is-loaded': status === 'loaded',
				} ) }
			>
				<Cropper
					src={ mediaUrl }
					controller={ session.cropper }
					aspectRatio={ aspectRatio }
					freeformCrop
					showGrid="interactive"
					isPlacementActive={ isPlacementActive }
					onGestureStart={ handleGestureStart }
					onGestureEnd={ handleGestureEnd }
					onImageLoaded={ handleImageLoaded }
					onImageError={ handleImageError }
					disabled={ disabled }
				/>
			</div>
		</div>
	);
}
