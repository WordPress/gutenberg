/**
 * External dependencies
 */
import { css } from '@emotion/core';

import {
	color,
	space,
	layout,
	flexbox,
	background,
	border,
	position,
	shadow,
} from 'styled-system';

/**
 * WordPress dependencies
 */
import { adminColorSchemes, variables } from '@wordpress/base-styles';

/**
 * Internal dependencies
 */
import { color as getColor, shade } from '../utils/colors';

const base = css`
	border: 0;
	cursor: pointer;
	-webkit-appearance: none;
	background: none;
	transition: box-shadow 0.1s linear;
	display: inline-flex;
	text-decoration: none;
	margin: 0;
	align-items: center;
	box-sizing: border-box;
	overflow: hidden;
	padding: 6 12px;
	border-radius: ${variables.radiusBlockUi};
	height: ${variables.iconButtonSize};
	color: ${getColor( 'black' )};
	@media ( prefers-reduced-motion: reduce ) {
		transition-duration: 0s;
	}

	&[aria-expanded='true'],
	&:hover {
		color: ${adminColorSchemes.defaults.primary};
	}

	&:enabled:focus {
		box-shadow: 0 0 0 2px ${adminColorSchemes.defaults.primary};
		outline: 1px solid transparent;
	}

	&:enabled:active {
		color: inherit;
	}

	&[aria-disabled='true']:hover {
		color: initial;
	}

	&:disabled,
	&[aria-disabled='true'] {
		cursor: default;
		opacity: 0.3;
	}

	.screen-reader-text {
		height: auto;
	}

	@keyframes components-button__busy-animation {
		0% {
			background-position: 200px 0;
		}
	}

	svg {
		fill: currentColor;
		outline: none;
	}
`;

const secondaryTertiaryCommon = `
&:hover {
	box-shadow: inset 0 0 0 ${ variables.borderWidth }
		${ shade( adminColorSchemes.defaults.primary, -10 ) };
	color: ${ shade( adminColorSchemes.defaults.primary, -10 ) };
}

&:active {
	background: ${ getColor( 'lightGray.tertiary' ) };
	color: ${ shade( adminColorSchemes.defaults.primary, -10 ) };
	box-shadow: none;
}

&:disabled,
&[aria-disabled='true'],
&[aria-disabled='true']:hover {
	color: ${ shade( getColor( 'mediumGray.text' ), 5 ) };
	background: ${ shade( getColor( 'lightGray.tertiary' ), 5 ) };
	transform: none;
	opacity: 1;
	box-shadow: none;
}`;

const secondary = css`
	box-shadow: inset 0 0 0 ${variables.borderWidth}
		${adminColorSchemes.defaults.primary};
	outline: 1px solid transparent; // Shown in high contrast mode.
	background: transparent;
	white-space: nowrap;

	${secondaryTertiaryCommon}
`;

const primary = css`
	border-style: solid;
	white-space: nowrap;
	text-shadow: none;
	color: ${getColor( 'white' )};
	background: ${adminColorSchemes.defaults.primary};

	&:hover {
		color: ${getColor( 'white' )};
		background: ${shade( adminColorSchemes.defaults.primary, -10 )};
	}

	&:enabled:focus {
		box-shadow: inset 0 0 0 1px ${getColor( 'white' )},
			0 0 0 2px ${adminColorSchemes.defaults.primary};
		outline: 1px solid transparent;
	}

	&:enabled:active {
		color: ${getColor( 'white' )};
		background: ${shade( adminColorSchemes.defaults.primary, -20 )};
		border-color: ${shade( adminColorSchemes.defaults.primary, -20 )};
	}

	&:disabled,
	&:disabled:active:enabled,
	&[aria-disabled='true'],
	&[aria-disabled='true']:enabled,
	&[aria-disabled='true']:active:enabled {
		opacity: 1;
		color: ${shade( adminColorSchemes.defaults.primary, 40 )};
		background: ${shade( adminColorSchemes.defaults.primary, 10 )};
		border-color: ${shade( adminColorSchemes.defaults.primary, 10 )};

		&:focus:enabled {
			box-shadow: 0 0 0 ${getColor( 'white' )},
				0 0 0 3px ${adminColorSchemes.defaults.primary};
		}
	}
	&.is-busy,
	&.is-busy:disabled,
	&.is-busy[aria-disabled='true'] {
		color: ${getColor( 'white' )};
		background-size: 100px 100%;
		border-color: ${adminColorSchemes.defaults.primary};
		background-image: linear-gradient(
			-45deg,
			${adminColorSchemes.defaults.primary} 28%,
			${shade( adminColorSchemes.defaults.primary, -20 )} 28%,
			${shade( adminColorSchemes.defaults.primary, -20 )} 72%,
			${adminColorSchemes.defaults.primary} 72%
		);
	}
`;

const link = css`
	margin: 0;
	padding: 0;
	box-shadow: none;
	border: 0;
	border-radius: 0;
	background: none;
	outline: none;
	text-align: left;
	color: #0073aa;
	text-decoration: underline;
	transition-property: border, background, color;
	transition-duration: 0.05s;
	transition-timing-function: ease-in-out;
	@media ( prefers-reduced-motion: reduce ) {
		transition-duration: 0s;
	}

	&:hover,
	&:active {
		color: #00a0d2;
	}

	&:enabled:focus {
		color: #124964;
		box-shadow: 0 0 0 ${variables.borderWidth} #5b9dd9,
			0 0 2px ${variables.borderWidth} rgba( 30, 140, 190, 0.8 );
	}
	&.is-destructive {
		color: ${getColor( 'alert.red' )};
	}
`;

const busy = css`
	background-size: 100px 100%;
	opacity: 1;
	animation: components-button__busy-animation 2500ms infinite linear;
	background-image: repeating-linear-gradient(
		-45deg,
		${adminColorSchemes.defaults.outlines},
		${getColor( 'white' )} 11px,
		${getColor( 'white' )} 10px,
		${getColor( 'lightGray.500' )} 20px
	);
`;
const small = css`
	height: 24px;
	line-height: 22px;
	padding: 0 8px;
	font-size: 11px;

	&.has-icon:not( .has-text ) {
		width: 24px;
	}
`;

const tertiary = css`
	color: ${adminColorSchemes.defaults.primary};
	white-space: nowrap;
	background: transparent;
	padding: 6px;
	${secondaryTertiaryCommon}
	.dashicon {
		display: inline-block;
		flex: 0 0 auto;
	}
`;

const hasIcon = css`
	padding: 6px;
	min-width: 36px;
	justify-content: center;
	.dashicon {
		display: inline-block;
		flex: 0 0 auto;
	}

	&.has-text {
		justify-content: left;
	}

	&.has-text svg {
		margin-right: 8px;
	}
`;

const styledSystem = ( props ) => css`
	${ color( props ) }
	${ space( props ) }
	${ layout( props ) }
	${ flexbox( props ) }
	${ background( props ) }
	${ border( props ) }
	${ position( props ) }
	${ shadow( props ) }
`;

export default {
	base,
	secondary,
	primary,
	link,
	small,
	tertiary,
	hasIcon,
	busy,
	styledSystem,
};
