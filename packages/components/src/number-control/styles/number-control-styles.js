/**
 * External dependencies
 */
import { css } from '@emotion/core';
import styled from '@emotion/styled';
/**
 * Internal dependencies
 */
import InputControl from '../../input-control';

const dragStyles = ( { isDragging, dragCursor } ) => {
	let defaultArrowStyles = '';
	let activeDragCursorStyles = '';

	if ( isDragging ) {
		defaultArrowStyles = css`
			cursor: ${dragCursor};
			user-select: none;

			&::-webkit-outer-spin-button,
			&::-webkit-inner-spin-button {
				-webkit-appearance: none !important;
				margin: 0 !important;
			}
		`;
	}

	if ( dragCursor ) {
		activeDragCursorStyles = css`
			&:active {
				cursor: ${dragCursor};
			}
		`;
	}

	return css`
		${defaultArrowStyles};
		${activeDragCursorStyles};
	`;
};

const htmlArrowStyles = ( { hideHTMLArrows } ) => {
	if ( ! hideHTMLArrows ) return ``;

	return css`
		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			-webkit-appearance: none !important;
			margin: 0 !important;
		}
	`;
};

export const Input = styled( InputControl )`
	${dragStyles};
	${htmlArrowStyles};
`;
