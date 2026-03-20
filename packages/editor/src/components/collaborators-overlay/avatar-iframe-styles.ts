/**
 * Compiled CSS for the Avatar component, for injection into the editor canvas
 * iframe where the editor package's SCSS is not available.
 *
 * Source: ../collaborators-presence/avatar/styles.scss
 *
 * Dimmed and status-indicator styles are intentionally omitted — they are not
 * used in the overlay. Keep in sync when editing the SCSS source.
 */

import {
	BUTTON_SIZE_COMPACT,
	BUTTON_SIZE_SMALL,
	ELEVATION_X_SMALL,
	FONT_LINE_HEIGHT_SMALL,
	FONT_SIZE_MEDIUM,
	FONT_SIZE_X_SMALL,
	FONT_WEIGHT_MEDIUM,
	GRID_UNIT_05,
	GRID_UNIT_10,
	RADIUS_FULL,
	WHITE,
} from './collaborator-styles';

export const AVATAR_IFRAME_STYLES = `
.editor-avatar {
	position: relative;
	display: inline-flex;
	align-items: center;
	border-radius: ${ RADIUS_FULL };
	flex-shrink: 0;
	box-shadow: 0 0 0 var(--wp-admin-border-width-focus, 2px) ${ WHITE }, ${ ELEVATION_X_SMALL };
}
.editor-avatar__image {
	box-sizing: border-box;
	position: relative;
	width: ${ BUTTON_SIZE_COMPACT };
	height: ${ BUTTON_SIZE_COMPACT };
	border-radius: ${ RADIUS_FULL };
	border: 0;
	background-color: var(--wp-admin-theme-color, #3858e9);
	overflow: hidden;
	overflow: clip;
	flex-shrink: 0;
	font-size: 0;
	color: ${ WHITE };
}
.is-small > .editor-avatar__image {
	width: ${ BUTTON_SIZE_SMALL };
	height: ${ BUTTON_SIZE_SMALL };
}
.has-avatar-border-color > .editor-avatar__image {
	border: var(--wp-admin-border-width-focus, 2px) solid var(--editor-avatar-outline-color);
	background-clip: padding-box;
}
.has-avatar-border-color > .editor-avatar__image::after {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	box-shadow: inset 0 0 0 var(--wp-admin-border-width-focus, 2px) ${ WHITE };
	pointer-events: none;
	z-index: 1;
}
.editor-avatar__img {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
	border-radius: inherit;
	opacity: 0;
}
.has-src > .editor-avatar__image > .editor-avatar__img {
	opacity: 1;
}
.editor-avatar:not(.has-src) > .editor-avatar__image {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: ${ FONT_SIZE_X_SMALL };
	font-weight: ${ FONT_WEIGHT_MEDIUM };
	border: 0;
	background-clip: border-box;
}
.editor-avatar:not(.has-src) > .editor-avatar__image::after {
	content: none;
}
.editor-avatar:not(.has-src).has-avatar-border-color > .editor-avatar__image {
	background-color: var(--editor-avatar-outline-color);
}
.editor-avatar__name {
	font-size: ${ FONT_SIZE_MEDIUM };
	font-weight: ${ FONT_WEIGHT_MEDIUM };
	line-height: ${ FONT_LINE_HEIGHT_SMALL };
	color: var(--editor-avatar-name-color, ${ WHITE });
	min-width: 0;
	padding-bottom: 2px; /* $grid-unit-05 / 2 */
	overflow: hidden;
	opacity: 0;
	white-space: nowrap;
	transition: opacity 0.15s cubic-bezier(0.15, 0, 0.15, 1);
}
.editor-avatar.is-badge {
	display: inline-grid;
	grid-template-columns: min-content 0fr;
	column-gap: 0;
	padding-inline-end: 0;
	background-color: var(--wp-admin-theme-color, #3858e9);
	transition:
		grid-template-columns 0.3s cubic-bezier(0.15, 0, 0.15, 1),
		column-gap 0.3s cubic-bezier(0.15, 0, 0.15, 1),
		padding-inline-end 0.3s cubic-bezier(0.15, 0, 0.15, 1);
}
.editor-avatar.is-badge:hover {
	grid-template-columns: min-content 1fr;
	column-gap: ${ GRID_UNIT_05 };
	padding-inline-end: ${ GRID_UNIT_10 };
	transition-timing-function: cubic-bezier(0.85, 0, 0.85, 1);
}
.editor-avatar.is-badge:hover .editor-avatar__name {
	opacity: 1;
	transition-timing-function: cubic-bezier(0.85, 0, 0.85, 1);
}
.editor-avatar.is-badge.has-avatar-border-color {
	background-color: var(--editor-avatar-outline-color);
}
@media (prefers-reduced-motion: reduce) {
	.editor-avatar.is-badge,
	.editor-avatar__name {
		transition: none;
	}
}
`;
