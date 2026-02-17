// @ts-expect-error No exported types
import { useStyleOverride } from '@wordpress/block-editor';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { useResizeObserver, useMergeRefs } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';

import { unlock } from '../../lock-unlock';
import { useBlockHighlighting } from './use-block-highlighting';
import { useRenderCursors } from './use-render-cursors';
import { ELEVATION_X_SMALL } from './collaborator-styles';

const { Avatar } = unlock( componentsPrivateApis );

// wp-components styles are excluded from the editor canvas iframe, so the
// Avatar component's SCSS is not available there. We inject compiled versions
// of the relevant rules alongside the overlay-specific positioning styles.
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

/* ── Avatar component (compiled from packages/components/src/avatar/styles.scss) ── */
.components-avatar {
	display: inline-flex;
	align-items: center;
	border-radius: 9999px;
	overflow: clip;
	flex-shrink: 0;
	background-color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
	box-shadow: 0 0 0 var(--wp-admin-border-width-focus, 2px) #fff, ${ ELEVATION_X_SMALL };
}
.components-avatar__image {
	box-sizing: border-box;
	position: relative;
	width: 32px;
	height: 32px;
	border-radius: 9999px;
	border: 0;
	background-color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
	overflow: clip;
	flex-shrink: 0;
	font-size: 0;
	color: #fff;
}
.is-small > .components-avatar__image {
	width: 24px;
	height: 24px;
}
.has-src > .components-avatar__image {
	background-image: var(--components-avatar-url);
	background-size: cover;
	background-position: center;
}
.has-avatar-border-color > .components-avatar__image {
	border: var(--wp-admin-border-width-focus, 2px) solid var(--components-avatar-outline-color);
	box-shadow: inset 0 0 0 var(--wp-admin-border-width-focus, 2px) #fff;
	background-clip: padding-box;
}
.components-avatar:not(.has-src) > .components-avatar__image {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 11px;
	font-weight: 499;
	border: 0;
	box-shadow: none;
	background-clip: border-box;
}
.components-avatar:not(.has-src).has-avatar-border-color > .components-avatar__image {
	background-color: var(--components-avatar-outline-color);
}
.components-avatar__name {
	font-size: 13px;
	line-height: 20px;
	color: #fff;
	min-width: 0;
	padding-bottom: 2px;
	overflow: hidden;
	opacity: 0;
	white-space: nowrap;
	transition: opacity 0.15s cubic-bezier(0.15, 0, 0.15, 1);
}
.components-avatar.has-badge {
	display: inline-grid;
	grid-template-columns: min-content 0fr;
	column-gap: 0;
	padding-inline-end: 0;
	transition:
		grid-template-columns 0.3s cubic-bezier(0.15, 0, 0.15, 1),
		column-gap 0.3s cubic-bezier(0.15, 0, 0.15, 1),
		padding-inline-end 0.3s cubic-bezier(0.15, 0, 0.15, 1);
}
.components-avatar.has-badge:hover {
	grid-template-columns: min-content 1fr;
	column-gap: 4px;
	padding-inline-end: 8px;
	transition-timing-function: cubic-bezier(0.85, 0, 0.85, 1);
}
.components-avatar.has-badge:hover .components-avatar__name {
	opacity: 1;
	transition-timing-function: cubic-bezier(0.85, 0, 0.85, 1);
}
.components-avatar.has-badge.has-avatar-border-color {
	background-color: var(--components-avatar-outline-color);
}
/* ── end Avatar ── */

/* Overlay-specific positioning applied to the Avatar cursor label. */
.collaborators-overlay-user-label.components-avatar {
	position: absolute;
	transform: translate(-11px, -100%);
	margin-top: -4px;
	pointer-events: auto;
	overflow: visible;
	width: max-content;
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
@media (prefers-reduced-motion: reduce) {
	.components-avatar.has-badge,
	.components-avatar__name,
	.collaborators-overlay-user-label,
	.collaborators-overlay-user-cursor {
		transition: none;
		animation: none;
	}
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
	const mergedRef = useMergeRefs< HTMLDivElement | null >( [
		setOverlayElement,
		resizeObserverRef,
	] );

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
					<Avatar
						className="collaborators-overlay-user-label"
						badge
						size="small"
						src={ cursor.avatarUrl }
						name={ cursor.userName }
						borderColor={ cursor.color }
					/>
				</div>
			) ) }
		</div>
	);
}
