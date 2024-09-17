/**
 * External dependencies
 */
import styled from '@emotion/styled';
import * as Ariakit from '@ariakit/react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';
import { space } from '../utils/space';

export const TabListWrapper = styled.div`
	position: relative;
	display: flex;
	align-items: stretch;
	flex-direction: row;
	text-align: center;

	&[aria-orientation='vertical'] {
		flex-direction: column;
		text-align: start;
	}

	@media not ( prefers-reduced-motion ) {
		&.is-animation-enabled::after {
			transition-property: transform;
			transition-duration: 0.2s;
			transition-timing-function: ease-out;
		}
	}
	--direction-factor: 1;
	--direction-origin-x: left;
	--indicator-start: var( --indicator-left );
	&:dir( rtl ) {
		--direction-factor: -1;
		--direction-origin-x: right;
		--indicator-start: var( --indicator-right );
	}
	&::after {
		content: '';
		position: absolute;
		pointer-events: none;
		transform-origin: var( --direction-origin-x ) top;

		// Windows high contrast mode.
		outline: 2px solid transparent;
		outline-offset: -1px;
	}

	/* Using a large value to avoid antialiasing rounding issues
			when scaling in the transform, see: https://stackoverflow.com/a/52159123 */
	--antialiasing-factor: 100;
	&:not( [aria-orientation='vertical'] ) {
		&::after {
			bottom: 0;
			height: 0;
			width: calc( var( --antialiasing-factor ) * 1px );
			transform: translateX(
					calc(
						var( --indicator-start ) * var( --direction-factor ) *
							1px
					)
				)
				scaleX(
					calc(
						var( --indicator-width ) / var( --antialiasing-factor )
					)
				);
			border-bottom: var( --wp-admin-border-width-focus ) solid
				${ COLORS.theme.accent };
		}
	}
	&[aria-orientation='vertical']::after {
		z-index: -1;
		top: 0;
		left: 0;
		width: 100%;
		height: calc( var( --antialiasing-factor ) * 1px );
		transform: translateY( calc( var( --indicator-top ) * 1px ) )
			scaleY(
				calc( var( --indicator-height ) / var( --antialiasing-factor ) )
			);
		background-color: ${ COLORS.theme.gray[ 100 ] };
	}
`;

export const Tab = styled( Ariakit.Tab )`
	& {
		display: inline-flex;
		align-items: center;
		position: relative;
		border-radius: 0;
		min-height: ${ space(
			12
		) }; // Avoid fixed height to allow for long strings that go in multiple lines.
		height: auto;
		background: transparent;
		border: none;
		box-shadow: none;
		cursor: pointer;
		line-height: 1.2; // Some languages characters e.g. Japanese may have a native higher line-height.
		padding: ${ space( 4 ) };
		margin-left: 0;
		font-weight: 500;
		text-align: inherit;
		hyphens: auto;
		color: ${ COLORS.theme.foreground };

		&[aria-disabled='true'] {
			cursor: default;
			color: ${ COLORS.ui.textDisabled };
		}

		&:not( [aria-disabled='true'] ):hover {
			color: ${ COLORS.theme.accent };
		}

		&:focus:not( :disabled ) {
			position: relative;
			box-shadow: none;
			outline: none;
		}

		// Focus.
		&::before {
			content: '';
			position: absolute;
			top: ${ space( 3 ) };
			right: ${ space( 3 ) };
			bottom: ${ space( 3 ) };
			left: ${ space( 3 ) };
			pointer-events: none;

			// Draw the indicator.
			// Outline works for Windows high contrast mode as well.
			outline: var( --wp-admin-border-width-focus ) solid
				${ COLORS.theme.accent };
			border-radius: ${ CONFIG.radiusSmall };

			// Animation
			opacity: 0;

			@media not ( prefers-reduced-motion ) {
				transition: opacity 0.1s linear;
			}
		}

		&:focus-visible::before {
			opacity: 1;
		}
	}

	[aria-orientation='vertical'] & {
		min-height: ${ space(
			10
		) }; // Avoid fixed height to allow for long strings that go in multiple lines.
	}
`;

export const TabPanel = styled( Ariakit.TabPanel )`
	&:focus {
		box-shadow: none;
		outline: none;
	}

	&:focus-visible {
		box-shadow: 0 0 0 var( --wp-admin-border-width-focus )
			${ COLORS.theme.accent };
		// Windows high contrast mode.
		outline: 2px solid transparent;
		outline-offset: 0;
	}
`;
