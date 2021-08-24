/**
 * External dependencies
 */
import { css } from '@emotion/react';

export const wrapper = css`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 9999999;
	display: flex;
	justify-content: center;
	-ms-align-items: center;
	align-items: center;
`;

export const overlay = css`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: -1;
	background: rgba( 0, 0, 0, 0.5 );
`;
