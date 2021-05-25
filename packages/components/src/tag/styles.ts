/**
 * External dependencies
 */
import { css } from 'emotion';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import {
	getBackgroundColor,
	getBackgroundColorText,
} from '../utils/backgrounds';
import { CONFIG } from '../utils';

export const TagView = styled.div`
	border-radius: ${ CONFIG.controlBorderRadius };
	box-shadow: 0 0 0 1px ${ CONFIG.surfaceBorderColor } inset;
	cursor: default;
	display: flex;
	height: 20px;
	line-height: 1;
	max-width: 120px;
	padding: 0 4px;
`;

export const RemoveButtonView = styled.div`
	margin-right: -4px;
`;

export const text = css`
	padding: 3px 0;
`;

export function getBackground( { color } ) {
	return css`
		${ getBackgroundColor( color ) }
	`;
}

export function getBackgroundText( { color } ) {
	return css`
		${ getBackgroundColorText( color ) }
	`;
}
