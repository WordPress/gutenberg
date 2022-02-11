/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import InputControl from '../../input-control';
import type { Props } from '../types';

const htmlArrowStyles = ( {
	hideHTMLArrows,
}: Pick< Props, 'hideHTMLArrows' > ) => {
	if ( ! hideHTMLArrows ) return ``;

	// TODO: rewrite using Emotion selection from `InputControl` component
	return css`
		input[type='number']::-webkit-outer-spin-button,
		input[type='number']::-webkit-inner-spin-button {
			-webkit-appearance: none !important;
			margin: 0 !important;
		}

		input[type='number'] {
			-moz-appearance: textfield;
		}
	`;
};

export const Input = styled( InputControl )`
	${ htmlArrowStyles };
`;
