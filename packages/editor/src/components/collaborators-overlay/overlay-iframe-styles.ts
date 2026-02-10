/**
 * Overlay styles as a string for injection into the block editor iframe.
 * The overlay renders inside the iframe but the main overlay.scss is loaded in
 * the parent document, so we inject these same styles into the iframe.
 * Keep in sync with overlay.scss.
 */
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
		transform: translateY(-100%) scale(1);
		filter: drop-shadow(0 0 0 transparent);
	}
	50% {
		transform: translateY(-100%) scale(1.1);
		filter: drop-shadow(0 0 6px currentColor);
	}
}
`;
