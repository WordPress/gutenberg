/**
 * External dependencies
 */
import { css } from '@emotion/core';

/**
 * Internal dependencies
 */
import { font, config, color, reduceMotion, lighten } from '../../utils';

export const buttonBase = css`
	display: inline-flex;
	text-decoration: none;
	font-size: ${ font( 'default.fontSize' ) };
	margin: 0;
	border: 0;
	cursor: pointer;
	-webkit-appearance: none;
	background: none;
	transition: box-shadow 0.1s linear;
	${ reduceMotion( 'transition' ) }
	height: ${ config( 'buttonSize' ) };
	align-items: center;
	box-sizing: border-box;
	padding: 6px 12px;
	border-radius: ${ config( 'radiusBlockUi' ) };
	color: ${ color( 'gray.900' ) };

	&[aria-expanded='true'],
	&:hover {
		color: var( --wp-admin-theme-color );
	}

	// Unset some hovers, instead of adding :not specificity.
	&[aria-disabled='true']:hover {
		color: initial;
	}

	// Focus.
	// See https://github.com/WordPress/gutenberg/issues/13267 for more context on these selectors.
	&:focus:not( :disabled ) {
		box-shadow: 0 0 0 ${ config(
			'borderWidthFocus'
		) } var( --wp-admin-theme-color );

		// Windows High Contrast mode will show this outline, but not the box-shadow.
		outline: 1px solid transparent;
	}

	&:not([aria-disabled="true"]):active {
		color: inherit;
	}

	&:disabled,
	&[aria-disabled="true"] {
		cursor: default;
		opacity: 0.3;
	}

	svg {
		fill: currentColor;
		outline: none;
	}

	// Fixes a Safari+VoiceOver bug, where the screen reader text is announced not respecting the source order.
	// See https://core.trac.wordpress.org/ticket/42006 and https://github.com/h5bp/html5-boilerplate/issues/1985
	.components-visually-hidden {
		height: auto;
	}
`;

export const secondaryAndTertiaryBase = css`
	${ buttonBase }

	&:active:not(:disabled) {
		background: ${ color( 'gray.200' ) };
		color: var( --wp-admin-theme-color-darker-10 );
		box-shadow: none;
	}

	&:hover:not( :disabled ) {
		color: var( --wp-admin-theme-color-darker-10 );
		box-shadow: inset 0 0 0 ${ config( 'borderWidth' ) }
			var( --wp-admin-theme-color-darker-10 );
	}

	&:disabled,
	&[aria-disabled='true'],
	&[aria-disabled='true']:hover {
		color: ${ lighten( color( 'gray.700' ), 5 ) };
		background: ${ lighten( color( 'gray.300' ), 5 ) };
		transform: none;
		opacity: 1;
		box-shadow: none;
	}
`;

export const small = css`
	height: 24px;
	line-height: 22px;
	padding: 0 8px;
	font-size: 11px;
`;

export const smallOnlyIcon = css`
	${ small }

	padding: 0 8px;
	width: 24px;
`;

export const icon = css`
	padding: 6px; // Works for 24px icons. Smaller icons are vertically centered by flex alignments.

	// Icon buttons are square.
	min-width: ${ config( 'buttonSize' ) };
	justify-content: center;

	.dashicon {
		display: inline-block;
		flex: 0 0 auto;
	}
`;

export const iconWithText = css`
	justify-content: left;

	svg {
		margin-right: 8px;
	}
`;

export const pressed = css`
	color: ${ color( 'white' ) };
	background: ${ color( 'gray.900' ) };

	&:focus:not( :disabled ) {
		box-shadow: inset 0 0 0 1px ${ color( 'white' ) },
			0 0 0 $border-width-focus var( --wp-admin-theme-color );

		// Windows High Contrast mode will show this outline, but not the box-shadow.
		outline: 2px solid transparent;
	}

	&:hover:not( :disabled ) {
		color: ${ color( 'white' ) };
		background: ${ color( 'gray.900' ) };
	}
`;
