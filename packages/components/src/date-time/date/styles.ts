/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { COLORS } from '../../utils';
import { VStack } from '../../v-stack';

// Styles that overrides the calendar styling provided by react-dates go in
// style.scss. Everything else goes here.

export const Day = styled( VStack )< { hasEvents: boolean } >`
	height: 100%;
	position: relative;

	${ ( props ) =>
		props.hasEvents &&
		`
		::before {
			background: var(--wp-admin-theme-color);
			border-radius: 2px;
			bottom: 0;
			content: " ";
			height: 4px;
			left: 50%;
			margin-left: -2px;
			position: absolute;
			width: 4px;

			.CalendarDay__selected & {
				background: ${ COLORS.white };
			}
		}
		` }
`;

const baseNavButton = css`
	position: absolute;
	top: 15px;
`;

export const NavPrevButton = styled( Button )`
	${ baseNavButton }
	left: 0;
`;

export const NavNextButton = styled( Button )`
	${ baseNavButton }
	right: 0;
`;
