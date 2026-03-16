/**
 * CSS for the collaborators overlay — cursor indicators, block highlights,
 * and positioning of Avatar labels inside the editor canvas iframe.
 */

import {
	BORDER_WIDTH,
	BORDER_WIDTH_FOCUS_FALLBACK,
	ELEVATION_X_SMALL,
	GRID_UNIT_05,
	GRID_UNIT_10,
	WHITE,
} from './collaborator-styles';

export const OVERLAY_IFRAME_STYLES = `
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
/* Cursor lines render below avatar labels across all users. The parent
   .collaborators-overlay-user has no z-index so it does not create a
   stacking context — children participate in the shared overlay context. */
.collaborators-overlay-user-cursor {
	position: absolute;
	z-index: 0;
	width: ${ BORDER_WIDTH_FOCUS_FALLBACK };
	border-radius: ${ BORDER_WIDTH };
	outline: ${ BORDER_WIDTH } solid ${ WHITE };
	box-shadow: ${ ELEVATION_X_SMALL };
	animation: collaborators-overlay-cursor-blink 1s infinite;
}
.collaborators-overlay-selection-rect {
	position: absolute;
	opacity: 0.15;
	pointer-events: none;
	border-radius: 2px;
}

/* Overlay-specific positioning applied to the Avatar cursor label. */
.collaborators-overlay-user-label.editor-avatar {
	position: absolute;
	z-index: 1;
	transform: translate(-11px, -100%);
	margin-top: -${ GRID_UNIT_05 };
	pointer-events: auto;
	overflow: visible;
	width: max-content;
}
/* Avatar positioned above a highlighted block as a label. */
.collaborators-overlay-block-label.editor-avatar {
	position: absolute;
	z-index: 1;
	transform: translateY(calc(-100% - ${ GRID_UNIT_10 }));
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
	box-shadow: inset 0 0 0 calc(var(--wp-admin-border-width-focus, ${ BORDER_WIDTH_FOCUS_FALLBACK }) + ${ BORDER_WIDTH }) ${ WHITE }, 0 0 0 ${ BORDER_WIDTH } ${ WHITE }, ${ ELEVATION_X_SMALL };
	z-index: 1;
}
@media (prefers-reduced-motion: reduce) {
	.collaborators-overlay-user-label,
	.collaborators-overlay-user-cursor {
		animation: none;
	}
}
`;
