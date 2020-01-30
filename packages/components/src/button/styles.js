/**
 * External dependencies
 */
import { css } from '@emotion/core';

const base = ( theme, hoverStyle, focusedStyle, disabledStyle, activeStyle ) => css`
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
	padding: 0 ${ theme.space.medium }px;
	border-radius: 3px;
	height: ${ theme.space.iconButtonSize }px;
	color: ${ theme.colors[ 'dark-gray-500' ] };
	@media (prefers-reduced-motion: reduce) {
			transition-duration: 0s;
	}

	.screen-reader-text {
		height: auto;
	}

	@keyframes components-button__busy-animation {
		0% {
			background-position: 200px 0;
		}
	}

	&:hover:not(:disabled):not([aria-disabled="true"]) {
		background-color: ${ theme.colors.white };
		color: ${ theme.colors[ 'dark-gray-900' ] };
		box-shadow: inset 0 0 0 1px ${ theme.colors[ 'dark-gray-500' ] }, inset 0 0 0 2px ${ theme.colors.white };
		${ hoverStyle ? hoverStyle : '' }
	}

	&:focus:not(:disabled):not([aria-disabled="true"]) {
		color: ${ theme.colors[ 'dark-gray-900' ] };
		box-shadow: inset 0 0 0 1px ${ theme.colors[ 'dark-gray-300' ] }, inset 0 0 0 2px ${ theme.colors.white };
		outline: 2px solid transparent;
		${ focusedStyle ? focusedStyle : '' }
	}

	&:active:not(:disabled):not([aria-disabled="true"]) {
		color: inherit;
		${ activeStyle ? activeStyle : '' }
	}

	&:disabled,
	&[aria-disabled="true"] {
		cursor: default;
		opacity: 0.3;
		${ disabledStyle ? disabledStyle : '' }
	}
`;

const secondary = ( theme, hoverStyle, focusedStyle, disabledStyle, activeStyle ) => css`
		border-style: solid;
		white-space: nowrap;
		background: #f3f5f6;
		border-width: ${ theme.space.borderWidth }px;
		color: ${ theme.helpers.shade( theme.colors.primary, -5 ) };
		border-color: ${ theme.helpers.shade( theme.colors.primary, -5 ) };

		&:not(:disabled):not([aria-disabled="true"]):hover {
			background: #f1f1f1;
			text-decoration: none;
			box-shadow: none;
			border-color: ${ theme.helpers.shade( theme.colors.primary, -25 ) };
			color: ${ theme.helpers.shade( theme.colors.primary, -25 ) };
			${ hoverStyle ? hoverStyle : '' }
		}

		&:focus:enabled {
			outline: none;
			background: #f3f5f6;
			text-decoration: none;
			color: ${ theme.helpers.shade( theme.colors.primary, -25 ) };
			border-color: ${ theme.helpers.shade( theme.colors.primary, -5 ) };
			box-shadow: 0 0 0 ${ theme.space.borderWidth } ${ theme.helpers.shade( theme.colors.primary, -5 ) };
			${ focusedStyle ? focusedStyle : '' }
		}

		&:active:enabled {
			background: #f3f5f6;
			border-color: #7e8993;
			box-shadow: none;
			color: ${ theme.helpers.shade( theme.colors.primary, -5 ) };
			${ activeStyle ? activeStyle : '' }
		}

		&:disabled,
		&[aria-disabled="true"] {
			color: #a0a5aa;
			border-color: #ddd;
			background: #f7f7f7;
			transform: none;
			opacity: 1;
			text-shadow: 0 ${ theme.space.borderWidth } 0 ${ theme.colors.white };
			${ disabledStyle ? disabledStyle : '' }
		}

		&.is-busy,
		&.is-busy:disabled,
		&.is-busy[aria-disabled="true"] {
			background-size: 100px 100%;
			opacity: 1;
			animation: components-button__busy-animation 2500ms infinite linear;
			background-image: repeating-linear-gradient(
				-45deg,
				${ theme.colors.outlines },
				${ theme.colors.white } 11px,
				${ theme.colors.white } 10px,
				${ theme.colors[ 'light-gray-500' ] } 20px
			);
		}
`;

const primary = ( theme, hoverStyle, focusedStyle, disabledStyle, activeStyle ) => css`
		border-style: solid;
		white-space: nowrap;
		text-shadow: none;
		border-width: ${ theme.space.borderWidth }px;
		color: ${ theme.colors.white };
		background: ${ theme.colors.primary };
		border-color: ${ theme.colors.primary };

		&:not(:disabled):not([aria-disabled="true"]):hover {
			color: ${ theme.colors.white };
			background: ${ theme.helpers.shade( theme.colors.primary, -10 ) };
			border-color: ${ theme.helpers.shade( theme.colors.primary, -10 ) };
			box-shadow: none;
			${ hoverStyle ? hoverStyle : '' }
		}

		&:focus:enabled {
			color: ${ theme.colors.white };
			background: ${ theme.helpers.shade( theme.colors.primary, -10 ) };
			border-color: ${ theme.helpers.shade( theme.colors.primary, -10 ) };
			box-shadow:
				0 0 0 ${ theme.space.borderWidth } ${ theme.colors.white },
				0 0 0 3px ${ theme.colors.primary };
			${ focusedStyle ? focusedStyle : '' }
		}

		&:active:enabled {
			color: ${ theme.colors.white };
			background: ${ theme.helpers.shade( theme.colors.primary, -20 ) };
			border-color: ${ theme.helpers.shade( theme.colors.primary, -20 ) };
			${ activeStyle ? activeStyle : '' }
		}

		&:disabled,
		&:disabled:active:enabled,
		&[aria-disabled="true"],
		&[aria-disabled="true"]:enabled,
		&[aria-disabled="true"]:active:enabled {
			opacity: 1;
			color:  ${ theme.helpers.shade( theme.colors.primary, 10 ) };
			background:  ${ theme.helpers.shade( theme.colors.primary, 10 ) };
			border-color:  ${ theme.helpers.shade( theme.colors.primary, 10 ) };
			background-image: linear-gradient(
				-45deg,
				${ theme.colors.button } 28%,
				${ theme.helpers.shade( theme.colors.primary, -20 ) } 28%,
				${ theme.helpers.shade( theme.colors.primary, -20 ) } 72%,
				${ theme.colors.button } 72%
			);
			${ disabledStyle ? disabledStyle : '' }

			&:focus:enabled {
				box-shadow:
					0 0 0 ${ theme.space.borderWidth } ${ theme.colors.white },
					0 0 0 3px ${ theme.colors.primary };
			}  
		}
		&.is-busy,
		&.is-busy:disabled,
		&.is-busy[aria-disabled="true"] {
			color: ${ theme.colors.white };
			background-size: 100px 100%;
			border-color: ${ theme.colors.primary };
			${ disabledStyle ? disabledStyle : '' }
		}
`;

const link = ( theme, hoverStyle, focusedStyle, disabledStyle, activeStyle ) => css`
	box-shadow: none;
	border: 0;
	background: none;
	outline: none;
	text-align: left;
	color: #0073aa;
	transition-property: border, background, color;
	transition-duration: 0.05s;
	transition-timing-function: ease-in-out;
	height: auto;
	text-decoration: underline;
	padding: 0;
	border-radius: 0;
	@media (prefers-reduced-motion: reduce) {
		transition-duration: 0s;
	}

	&:not(:disabled):not([aria-disabled="true"]):hover {
		color: #00a0d2;
		${ hoverStyle ? hoverStyle : '' }
	}

	&:active {
		color: #00a0d2;
		${ activeStyle ? activeStyle : '' }
	}

	&:focus {
		color: #124964;
		box-shadow:
			0 0 0 ${ theme.space.borderWidth } #5b9dd9,
			0 0 2px ${ theme.space.borderWidth } rgba(30, 140, 190, 0.8);
		${ focusedStyle ? focusedStyle : '' }
	}
	&.is-destructive {
		color: ${ theme.colors.alertRed };
	}
`;

const busy = ( theme, hoverStyle, focusedStyle, disabledStyle ) => css`
		background-size: 100px 100%;
		opacity: 1;
		animation: components-button__busy-animation 2500ms infinite linear;
		background-image: repeating-linear-gradient(
			-45deg,
			${ theme.colors.outlines },
			${ theme.colors.white } 11px,
			${ theme.colors.white } 10px,
			${ theme.colors[ 'light-gray-500' ] } 20px
		);
		${ disabledStyle ? disabledStyle : '' }
`;
const small = ( theme ) => css`
	height: ${ theme.space.xlarge }px;
	line-height: 22px;
`;

const tertiary = ( theme ) => css`
	color: ${ theme.colors.outlines };

	.dashicon {
		display: inline-block;
		flex: 0 0 auto;
	}

	svg {
		fill: currentColor;
		outline: none;
	}

	&:active:focus:enabled {
		box-shadow: none;
	}
`;

const hasIcon = ( theme ) => css`
	.dashicon {
		display: inline-block;
		flex: 0 0 auto;
	}

	svg {
		fill: currentColor;
		outline: none;
	}

	&.has-text svg {
		margin-right: ${ theme.space.medium }px;
	}
`;

// TODO Support theme in additional styles
export default ( theme, hoverStyle, focusedStyle, disabledStyle, activeStyle ) => ( {
	base: base( theme, hoverStyle, focusedStyle, disabledStyle, activeStyle ),
	secondary: secondary( theme, hoverStyle, focusedStyle, disabledStyle, activeStyle ),
	primary: primary( theme, hoverStyle, focusedStyle, disabledStyle, activeStyle ),
	link: link( theme, hoverStyle, focusedStyle, disabledStyle, activeStyle ),
	small: small( theme, hoverStyle, focusedStyle, disabledStyle, activeStyle ),
	tertiary: tertiary( theme, hoverStyle, focusedStyle, disabledStyle, activeStyle ),
	hasIcon: hasIcon( theme ),
	busy: busy( theme, hoverStyle, focusedStyle, disabledStyle, activeStyle ),
} );
