/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

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

	// Tracks whether the image pixels have actually loaded. The cropper's
	// geometry is driven by the known media dimensions, so its handles and
	// overlays would otherwise appear before the image finishes streaming in.
	const [ status, setStatus ] = useState< 'loading' | 'loaded' | 'error' >(
		'loading'
	);

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

	const isImage = mediaType.type === 'image';

	// Probe the image to know when its pixels have loaded (or failed),
	// independent of the cropper. The browser shares one fetch/cache with the
	// cropper's own `<img>`, so this adds no network cost. The cropper stays
	// framework-pure — load/error handling lives here in the wrapper layer.
	useEffect( () => {
		if ( ! mediaUrl || ! isImage ) {
			return;
		}
		setStatus( 'loading' );
		const probe = new window.Image();
		probe.onload = () => setStatus( 'loaded' );
		probe.onerror = () => setStatus( 'error' );
		probe.src = mediaUrl;
		// Cached images may already be complete before listeners attach.
		if ( probe.complete ) {
			setStatus( probe.naturalWidth > 0 ? 'loaded' : 'error' );
		}
		return () => {
			probe.onload = null;
			probe.onerror = null;
		};
	}, [ mediaUrl, isImage ] );

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
					<Spinner />
				</div>
			) }
			{ /*
			 * The cropper stays mounted while loading (hidden behind the
			 * spinner) so the image decodes off-screen and reveals in one paint
			 * instead of streaming in top-to-bottom. Until it's revealed it's
			 * non-interactive (`pointer-events: none` in CSS), and focus is
			 * withheld by gating `focusOnMount` on the loaded state — the
			 * cropper's focus effect keys off that prop, so focus lands on the
			 * crop area only once it's visible.
			 */ }
			<div
				className={ clsx( 'media-editor-canvas__cropper', {
					'is-loaded': status === 'loaded',
				} ) }
			>
				<Cropper
					src={ mediaUrl }
					controller={ controller }
					aspectRatio={ aspectRatio }
					freeformCrop
					focusOnMount={ focusOnMount && status === 'loaded' }
					showGrid="interactive"
					isPlacementActive={ isPlacementActive }
					onGestureStart={ handleGestureStart }
					onGestureEnd={ handleGestureEnd }
				/>
			</div>
		</div>
	);
}
