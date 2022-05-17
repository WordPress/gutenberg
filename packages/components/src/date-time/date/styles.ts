/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';

// Styles that overrides the calendar styling provided by react-dates go in
// style.scss. Everything else goes here.

export const Day = styled.div< { hasEvents: boolean } >`
	align-content: center;
	display: flex;
	flex-direction: column;
	height: 100%;
	justify-content: center;
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
		}
		` }
`;

const baseNavButton = css`
	position: absolute;
	top: 15px;
`;

export const prevNavButton = css`
	${ baseNavButton }
	left: 0;
`;

export const nextNavButton = css`
	${ baseNavButton }
	right: 0;
`;
