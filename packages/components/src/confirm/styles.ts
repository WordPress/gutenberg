/**
 * External dependencies
 */
import { css } from '@emotion/react';

export const overlayWrapper = css`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 99;
	background: rgba( 0, 0, 0, 0.5 );
	display: -webkit-flex;
	display: -moz-flex;
	display: -ms-flex;
	display: -o-flex;
	display: flex;
	justify-content: center;
	-ms-align-items: center;
	align-items: center;
`;

export const dialogWrapper = css``;
