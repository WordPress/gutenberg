import { useResizeObserver, useMergeRefs } from '@wordpress/compose';
import { useEffect, useRef } from '@wordpress/element';

import { useBlockHighlighting } from './use-block-highlighting';
import { useRenderCursors } from './use-render-cursors';
import { type CursorRegistry } from './cursor-registry';
import { OVERLAY_IFRAME_STYLES } from './overlay-iframe-styles';

import './overlay.scss';

interface OverlayProps {
	blockEditorDocument?: Document;
	cursorRegistry: CursorRegistry;
	postId: number | null;
	postType: string | null;
}

/**
 * This component is responsible for rendering the overlay components within the editor iframe.
 *
 * @param props                     - The overlay props.
 * @param props.blockEditorDocument - The block editor document.
 * @param props.cursorRegistry      - The cursor registry.
 * @param props.postId              - The ID of the post.
 * @param props.postType            - The type of the post.
 * @return The Overlay component.
 */
export function Overlay( {
	blockEditorDocument,
	cursorRegistry,
	postId,
	postType,
}: OverlayProps ) {
	const overlayRef = useRef< HTMLDivElement >( null );
	const rerenderCursorsAfterDelay = useRenderCursors(
		overlayRef,
		blockEditorDocument ?? null,
		cursorRegistry,
		postId ?? null,
		postType ?? null
	);

	// Detect layout changes on overlay (e.g. turning on "Show Template") and window
	// resizes, and re-render the cursors.
	const resizeObserverRef = useResizeObserver( rerenderCursorsAfterDelay );
	useEffect( rerenderCursorsAfterDelay, [ rerenderCursorsAfterDelay ] );

	// Merge the refs to use the same element for both overlay and resize observation
	const mergedRef = useMergeRefs( [ overlayRef, resizeObserverRef ] );

	useBlockHighlighting( document, postId ?? null, postType ?? null );

	// Inject overlay styles into the iframe. The overlay renders inside the
	// iframe (via BlockCanvasCover) but overlay.scss is loaded in the parent
	// document, so the iframe has no access to it. We inject the same styles
	// here so cursors and labels are styled correctly.
	useEffect( () => {
		if ( ! blockEditorDocument ) {
			return;
		}
		const id = 'collaborators-overlay-styles';
		if ( blockEditorDocument.getElementById( id ) ) {
			return;
		}
		const style = blockEditorDocument.createElement( 'style' );
		style.id = id;
		style.textContent = OVERLAY_IFRAME_STYLES;
		blockEditorDocument.head.appendChild( style );
		return () => {
			style.remove();
		};
	}, [ blockEditorDocument ] );

	// This is a full overlay that covers the entire iframe document. Good for
	// scrollable elements like cursor indicators.
	return <div className="collaborators-overlay-full" ref={ mergedRef } />;
}
