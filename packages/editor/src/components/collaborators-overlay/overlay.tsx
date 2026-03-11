// @ts-expect-error No exported types
import { useStyleOverride } from '@wordpress/block-editor';
import { useResizeObserver, useMergeRefs } from '@wordpress/compose';
import { useCallback, useEffect, useState } from '@wordpress/element';

import Avatar from '../collaborators-presence/avatar';
import { AVATAR_IFRAME_STYLES } from './avatar-iframe-styles';
import { OVERLAY_IFRAME_STYLES } from './overlay-iframe-styles';
import { useBlockHighlighting } from './use-block-highlighting';
import { useRenderCursors } from './use-render-cursors';

const RERENDER_DELAY_MS = 500;

interface OverlayProps {
	blockEditorDocument?: Document;
	postId: number | null;
	postType: string | null;
}

/**
 * This component is responsible for rendering the overlay components within the editor iframe.
 *
 * @param props                     - The overlay props.
 * @param props.blockEditorDocument - The block editor document.
 * @param props.postId              - The ID of the post.
 * @param props.postType            - The type of the post.
 * @return The Overlay component.
 */
export function Overlay( {
	blockEditorDocument,
	postId,
	postType,
}: OverlayProps ) {
	useStyleOverride( {
		id: 'collaborators-overlay',
		css: AVATAR_IFRAME_STYLES + OVERLAY_IFRAME_STYLES,
	} );

	// Use state for the overlay element so that the hook re-runs once the ref is attached.
	const [ overlayElement, setOverlayElement ] =
		useState< HTMLDivElement | null >( null );

	const { cursors, rerenderCursorsAfterDelay } = useRenderCursors(
		overlayElement,
		blockEditorDocument ?? null,
		postId ?? null,
		postType ?? null,
		RERENDER_DELAY_MS
	);

	const { highlights, rerenderHighlightsAfterDelay } = useBlockHighlighting(
		overlayElement,
		blockEditorDocument ?? null,
		postId ?? null,
		postType ?? null,
		RERENDER_DELAY_MS
	);

	// Detect layout changes on overlay (e.g. turning on "Show Template") and window
	// resizes, and re-render the cursors and block highlights.
	const onResize = useCallback( () => {
		rerenderCursorsAfterDelay();
		rerenderHighlightsAfterDelay();
	}, [ rerenderCursorsAfterDelay, rerenderHighlightsAfterDelay ] );
	const resizeObserverRef = useResizeObserver( onResize );

	// Trigger the initial position computation on mount.
	useEffect( () => {
		const cleanupCursors = rerenderCursorsAfterDelay();
		const cleanupHighlights = rerenderHighlightsAfterDelay();
		return () => {
			cleanupCursors();
			cleanupHighlights();
		};
	}, [ rerenderCursorsAfterDelay, rerenderHighlightsAfterDelay ] );

	// Merge the refs to use the same element for both overlay and resize observation
	const mergedRef = useMergeRefs< HTMLDivElement | null >( [
		setOverlayElement,
		resizeObserverRef,
	] );

	// This is a full overlay that covers the entire iframe document. Good for
	// scrollable elements like cursor indicators.
	return (
		<div className="collaborators-overlay-full" ref={ mergedRef }>
			{ cursors.map( ( cursor ) => (
				<div
					key={ cursor.clientId }
					className="collaborators-overlay-user"
					style={ {
						left: `${ cursor.x }px`,
						top: `${ cursor.y }px`,
					} }
				>
					<div
						className="collaborators-overlay-user-cursor"
						style={ {
							backgroundColor: cursor.color,
							height: `${ cursor.height }px`,
						} }
					/>
					<Avatar
						className="collaborators-overlay-user-label"
						variant="badge"
						size="small"
						src={ cursor.avatarUrl }
						name={ cursor.userName }
						borderColor={ cursor.color }
					/>
				</div>
			) ) }
			{ highlights.map( ( highlight ) => (
				<Avatar
					key={ highlight.blockId }
					className="collaborators-overlay-block-label"
					variant="badge"
					size="small"
					src={ highlight.avatarUrl }
					name={ highlight.userName }
					borderColor={ highlight.color }
					style={ {
						left: `${ highlight.x }px`,
						top: `${ highlight.y }px`,
					} }
				/>
			) ) }
		</div>
	);
}
