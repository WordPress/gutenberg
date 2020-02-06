/**
 * External dependencies
 */
import { css } from '@emotion/core';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { color } from '../../utils/colors';

export const ControlWrapper = styled.div``;

const containerFocus = ( { isFocused } ) => {
	if ( ! isFocused ) return '';

	return css`
		border: 1px solid ${color( 'blue.medium.focus' )};
		box-shadow: 0 0 0 1px ${color( 'blue.medium.focus' )};
	`;
};

export const ControlContainer = styled.div`
	align-items: center;
	border-radius: 2px;
	border: 1px solid ${color( 'lightGray.600' )};
	box-sizing: border-box;
	display: flex;
	height: 36px;
	overflow: hidden;
	max-width: 110px;

	${containerFocus};
`;

export const ColorSwatch = styled.button`
	appearance: none;
	border: none;
	border-right: 1px solid ${color( 'lightGray.600' )};
	box-sizing: border-box;
	cursor: pointer;
	display: block;
	height: 36px;
	outline: none;
	width: 36px;

	&:focus {
		outline: none;
	}
`;

export const ColorLabel = styled.div`
	box-sizing: border-box;
	padding: 4px 8px;
	width: 72px;
	font-size: 12px;
`;
