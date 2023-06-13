/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import InputControl from '../../input-control';
import { COLORS } from '../../utils';
import Button from '../../button';
import { space } from '../../ui/utils/space';
import type { NumberControlProps } from '../types';

const htmlArrowStyles = ( { hideHTMLArrows }: { hideHTMLArrows: boolean } ) => {
	if ( ! hideHTMLArrows ) {
		return ``;
	}

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

const spinButtonSizeStyles = ( {
	size,
}: Pick< NumberControlProps, 'size' > ) => {
	if ( size !== 'small' ) {
		return ``;
	}

	return css`
		width: ${ space( 5 ) };
		min-width: ${ space( 5 ) };
		height: ${ space( 5 ) };
	`;
};

export const SpinButton = styled( Button )`
	&&&&& {
		color: ${ COLORS.ui.theme };
		${ spinButtonSizeStyles }
	}
`;
