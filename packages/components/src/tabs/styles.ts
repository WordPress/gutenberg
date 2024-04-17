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
import { reduceMotion } from '../utils/reduce-motion';
import { __unstableMotion } from '../animation';

export const TabListWrapper = styled.div`
	display: flex;
	align-items: stretch;
	flex-direction: row;
	&[aria-orientation='vertical'] {
		flex-direction: column;
	}
`;

export const Tab = styled( Ariakit.Tab )`
	& {
		isolation: isolate;
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
			box-shadow: 0 0 0 0 transparent;
			border-radius: 2px;

			// Animation
			transition: all 0.1s linear;
			${ reduceMotion( 'transition' ) };
		}

		&:focus-visible::before {
			box-shadow: 0 0 0 var( --wp-admin-border-width-focus )
				${ COLORS.theme.accent };

			// Windows high contrast mode.
			outline: 2px solid transparent;
		}
	}
`;

export const TabIndicator = styled( __unstableMotion.div )`
	position: absolute;
	pointer-events: none;

	&:not( .is-vertical ) {
		left: 0;
		bottom: 0;
		width: 100%;
		border-bottom: var( --wp-admin-border-width-focus ) solid
			${ COLORS.theme.accent };
	}

	&.is-vertical {
		right: 0;
		top: 0;
		height: 100%;
		width: 0;
		border-left: var( --wp-admin-border-width-focus ) solid
			${ COLORS.theme.accent };
	}

	// Windows high contrast mode.
	outline: 2px solid transparent;
	outline-offset: -1px;
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
