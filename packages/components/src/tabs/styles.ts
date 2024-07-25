/**
 * External dependencies
 */
import styled from '@emotion/styled';
import * as Ariakit from '@ariakit/react';

/**
 * Internal dependencies
 */
import { COLORS } from '../utils';
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

	@media not ( prefers-reduced-motion: reduce ) {
		&.is-animation-enabled::after {
			transition-property: left, top, width, height;
			transition-duration: 0.2s;
			transition-timing-function: ease-out;
		}
	}
	&::after {
		content: '';
		position: absolute;
		pointer-events: none;

		// Windows high contrast mode.
		outline: 2px solid transparent;
		outline-offset: -1px;
	}
	&:not( [aria-orientation='vertical'] )::after {
		bottom: 0;
		left: var( --indicator-left );
		width: var( --indicator-width );
		height: 0;
		border-bottom: var( --wp-admin-border-width-focus ) solid
			${ COLORS.theme.accent };
	}
	&[aria-orientation='vertical']::after {
		z-index: -1;
		left: 0;
		width: 100%;
		top: var( --indicator-top );
		height: var( --indicator-height );
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
			border-radius: 2px;

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
		border-radius: 2px;
		box-shadow: 0 0 0 var( --wp-admin-border-width-focus )
			${ COLORS.theme.accent };
		// Windows high contrast mode.
		outline: 2px solid transparent;
		outline-offset: 0;
	}
`;
