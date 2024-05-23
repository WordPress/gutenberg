/**
 * External dependencies
 */
import styled from '@emotion/styled';
// eslint-disable-next-line no-restricted-imports
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
	&[aria-orientation='vertical'] {
		flex-direction: column;
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
		left: var( --indicator-left );
		bottom: 0;
		width: var( --indicator-width );
		height: 0;
		border-bottom: var( --wp-admin-border-width-focus ) solid
			${ COLORS.theme.accent };
	}
	&[aria-orientation='vertical']::after {
		/* Temporarily hidden, context: https://github.com/WordPress/gutenberg/pull/60560#issuecomment-2126670072 */
		opacity: 0;

		right: 0;
		top: var( --indicator-top );
		height: var( --indicator-height );
		border-right: var( --wp-admin-border-width-focus ) solid
			${ COLORS.theme.accent };
	}
`;

export const Tab = styled( Ariakit.Tab )`
	& {
		display: inline-flex;
		align-items: center;
		position: relative;
		border-radius: 0;
		height: ${ space( 12 ) };
		background: transparent;
		border: none;
		box-shadow: none;
		cursor: pointer;
		padding: 3px ${ space( 4 ) }; // Use padding to offset the [aria-selected="true"] border, this benefits Windows High Contrast mode
		margin-left: 0;
		font-weight: 500;

		&[aria-disabled='true'] {
			cursor: default;
			opacity: 0.3;
		}

		&:hover {
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
			box-shadow: 0 0 0 var( --wp-admin-border-width-focus )
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

			// Windows high contrast mode.
			outline: 2px solid transparent;
		}
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
