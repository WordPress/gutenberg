import { useStyleOverride } from '@wordpress/block-editor';
import { useResizeObserver, useMergeRefs } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';

import { useBlockHighlighting } from './use-block-highlighting';
import { useRenderCursors } from './use-render-cursors';
import { ELEVATION_X_SMALL } from './collaborator-styles';

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
	border-radius: 1px;
	outline: 1px solid #fff;
	box-shadow: ${ ELEVATION_X_SMALL };
	animation: collaborators-overlay-cursor-blink 1s infinite;
}
.collaborators-overlay-user-label {
	position: absolute;
	display: flex;
	align-items: center;
	max-width: 240px;
	border-radius: 9999px;
	transform: translate(-11px, -100%);
	margin-top: -4px;
	white-space: nowrap;
	overflow: clip;
	pointer-events: auto;
	outline: 1px solid #fff;
	box-shadow: ${ ELEVATION_X_SMALL };
}
.collaborators-overlay-user-label__avatar {
	box-sizing: border-box;
	background-image: var(--avatar-url);
	background-size: cover;
	background-position: center;
	border-radius: 50%;
	border-width: var(--wp-admin-border-width-focus, 2px);
	border-style: solid;
	width: 24px;
	height: 24px;
	flex-shrink: 0;
	box-shadow: inset 0 0 0 1px #fff;
}
.collaborators-overlay-user-label__name {
	font-size: 13px;
	line-height: 20px;
	color: #fff;
	max-width: 0;
	padding: 0 0 2px 0;
	overflow: hidden;
	opacity: 0;
	transition: max-width 0.3s ease, padding 0.3s ease, opacity 0.2s ease;
}
.collaborators-overlay-user-label:hover .collaborators-overlay-user-label__name {
	max-width: 200px;
	padding: 0 8px 2px 4px;
	opacity: 1;
}
@keyframes collaborators-overlay-cursor-blink {
	0%, 45% { opacity: 1; }
	55%, 95% { opacity: 0; }
	100% { opacity: 1; }
}
.collaborators-overlay-cursor-highlighted .collaborators-overlay-user-cursor {
	animation: collaborators-overlay-cursor-highlight 0.6s ease-in-out 3;
}
.collaborators-overlay-cursor-highlighted .collaborators-overlay-user-label {
	animation: collaborators-overlay-label-highlight 0.6s ease-in-out 3;
}
@keyframes collaborators-overlay-cursor-highlight {
	0%, 100% {
		transform: scale(1);
		filter: drop-shadow(0 0 0 transparent);
	}
	50% {
		transform: scale(1.2);
		filter: drop-shadow(0 0 8px currentColor);
	}
}
@keyframes collaborators-overlay-label-highlight {
	0%, 100% {
		transform: translate(-11px, -100%) scale(1);
		filter: drop-shadow(0 0 0 transparent);
	}
	50% {
		transform: translate(-11px, -100%) scale(1.1);
		filter: drop-shadow(0 0 6px currentColor);
	}
}
.block-editor-block-list__block.is-collaborator-selected:not(:focus)::after {
	content: "";
	position: absolute;
	pointer-events: none;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	outline-color: var(--collaborator-outline-color);
	outline-style: solid;
	outline-width: calc(var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
	outline-offset: calc(-1 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
	box-shadow: inset 0 0 0 calc(var(--wp-admin-border-width-focus, 2px) + 1px) #fff, 0 0 0 1px #fff, ${ ELEVATION_X_SMALL };
	z-index: 1;
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
						<div
							className="collaborators-overlay-user-label__avatar"
							style={
								{
									'--avatar-url': cursor.avatarUrl
										? `url(${ cursor.avatarUrl })`
										: undefined,
									borderColor: cursor.color,
								} as React.CSSProperties
							}
						/>
						<span className="collaborators-overlay-user-label__name">
							{ cursor.userName }
						</span>
					</div>
				</div>
			) ) }
		</div>
	);
}
