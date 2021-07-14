/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { CONFIG } from '../utils';

export const BadgeView = styled.div`
	border-radius: ${ CONFIG.controlBorderRadius };
	box-shadow: 0 0 0 1px ${ CONFIG.surfaceBorderColor } inset;
	cursor: default;
	display: flex;
	height: 18px;
	line-height: 1;
	padding: 0 4px;
`;

export const truncate = css`
	max-width: 120px;
`;

export const text = css`
	padding: 4px 0;
`;

export const rounded = css`
	border-radius: ${ CONFIG.circularBorderRadius };
	justify-content: center;
	min-width: 18px;
`;
