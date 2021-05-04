/**
 * External dependencies
 */
import { css } from '@emotion/css';
import styled from '@emotion/styled';
/**
 * Internal dependencies
 */
import InputControl from '../../input-control';

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
	${ htmlArrowStyles };
`;
