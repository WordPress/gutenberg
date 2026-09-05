import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
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
	 * When set, load this image into the cropper instead of the media's own
	 * `source_url` — used by "Restore original image" to preview the lineage
	 * root before saving. Swapping the source resets the cropper baseline, so
	 * the restore counts as clean until the user re-crops.
	 */
	srcOverride?: {
		url: string;
		width: number;
		height: number;
	};
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
 * @param props.srcOverride
 */
export default function MediaEditorCanvas( {
	isPlacementActive = false,
	onGestureStart,
	onGestureEnd,
	srcOverride,
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

	const mediaType = getMediaTypeFromMimeType( media?.mime_type );

	// When a restore is active, the cropper shows the lineage root instead of
	// the media's own file. `loadUrl`/`loadWidth`/`loadHeight` are whichever
	// source is currently in play.
	const loadUrl = srcOverride?.url ?? media?.source_url;
	const loadWidth = srcOverride
		? srcOverride.width
		: Number( media?.media_details?.width );
	const loadHeight = srcOverride
		? srcOverride.height
		: Number( media?.media_details?.height );

	useEffect( () => {
		if (
			! loadUrl ||
			! Number.isFinite( loadWidth ) ||
			! Number.isFinite( loadHeight ) ||
			loadWidth <= 0 ||
			loadHeight <= 0
		) {
			return;
		}
		// Idempotent: skip when the cropper already holds this source. When the
		// source changes (initial load, or a restore swapping in the original)
		// this re-runs and `setImage` refreshes the clean baseline.
		if ( cropperImage?.src === loadUrl ) {
			return;
		}
		setImage( {
			src: loadUrl,
			naturalWidth: loadWidth,
			naturalHeight: loadHeight,
		} );
	}, [ cropperImage, loadUrl, loadWidth, loadHeight, setImage ] );

	const isImage = mediaType.type === 'image';

	// Probe the image to know when its pixels have loaded (or failed),
	// independent of the cropper. The browser shares one fetch/cache with the
	// cropper's own `<img>`, so this adds no network cost. The cropper stays
	// framework-pure — load/error handling lives here in the wrapper layer.
	useEffect( () => {
		if ( ! loadUrl || ! isImage ) {
			return;
		}
		setStatus( 'loading' );
		const probe = new window.Image();
		probe.onload = () => setStatus( 'loaded' );
		probe.onerror = () => setStatus( 'error' );
		probe.src = loadUrl;
		// Cached images may already be complete before listeners attach.
		if ( probe.complete ) {
			setStatus( probe.naturalWidth > 0 ? 'loaded' : 'error' );
		}
		return () => {
			probe.onload = null;
			probe.onerror = null;
		};
	}, [ loadUrl, isImage ] );

	if ( ! loadUrl || ! isImage ) {
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
					src={ loadUrl }
					controller={ controller }
					aspectRatio={ aspectRatio }
					freeformCrop
					showGrid="interactive"
					isPlacementActive={ isPlacementActive }
					onGestureStart={ handleGestureStart }
					onGestureEnd={ handleGestureEnd }
				/>
			</div>
		</div>
	);
}
