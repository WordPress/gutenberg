// @ts-expect-error No exported types
import { useStyleOverride } from '@wordpress/block-editor';
import { useResizeObserver, useMergeRefs } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';

import { useBlockHighlighting } from './use-block-highlighting';
import { useRenderCursors } from './use-render-cursors';

const COLLABORATORS_OVERLAY_STYLES = `
.block-canvas-cover {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	z-index: 20000;
}
.block-canvas-cover .collaborators-overlay-full {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}
.block-canvas-cover .collaborators-overlay-fixed {
	position: fixed;
	width: 100%;
	height: 100%;
}
.collaborators-overlay-user {
	position: absolute;
}
.collaborators-overlay-user-cursor {
	position: absolute;
	width: 2px;
	animation: collaborators-overlay-cursor-blink 1s infinite;
}
.collaborators-overlay-user-label {
	position: absolute;
	font-size: 11px;
	padding: 2px 6px;
	border-radius: 4px;
	transform: translateY(-100%);
	margin-top: -2px;
	background-color: var(--wp--preset--color--black);
	color: var(--wp--preset--color--white);
	white-space: nowrap;
}
@keyframes collaborators-overlay-cursor-blink {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.5; }
}
`;

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
		css: COLLABORATORS_OVERLAY_STYLES,
	} );

	// Use state for the overlay element so that the hook re-runs once the ref is attached.
	const [ overlayElement, setOverlayElement ] =
		useState< HTMLDivElement | null >( null );

	const { cursors, rerenderCursorsAfterDelay } = useRenderCursors(
		overlayElement,
		blockEditorDocument ?? null,
		postId ?? null,
		postType ?? null
	);

	// Detect layout changes on overlay (e.g. turning on "Show Template") and window
	// resizes, and re-render the cursors.
	const resizeObserverRef = useResizeObserver( rerenderCursorsAfterDelay );
	useEffect( rerenderCursorsAfterDelay, [ rerenderCursorsAfterDelay ] );

	// Merge the refs to use the same element for both overlay and resize observation
	const mergedRef = useMergeRefs( [ setOverlayElement, resizeObserverRef ] );

	useBlockHighlighting(
		blockEditorDocument ?? null,
		postId ?? null,
		postType ?? null
	);

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
					<div
						className="collaborators-overlay-user-label"
						style={ {
							backgroundColor: cursor.color,
						} }
					>
						{ cursor.userName }
					</div>
				</div>
			) ) }
		</div>
	);
}
