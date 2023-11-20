/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * Internal dependencies
 */
import { COLORS } from '../utils';
import { space } from '../utils/space';
import type { CustomSelectProps } from './types';

export const CustomSelectLabel = styled( Ariakit.SelectLabel )`
	font-size: 11px;
	font-weight: 500;
	line-height: 1.4;
	text-transform: uppercase;
	margin-bottom: ${ space( 2 ) };
`;

const inputHeights = {
	default: 40,
	small: 24,
};

const getVariableInputStyles = (
	size: NonNullable< CustomSelectProps[ 'size' ] >,
	hasCustomRenderProp: boolean
) => {
	return css`
		${ hasCustomRenderProp ? 'min-height' : 'height' }: ${ inputHeights[
			size
		] }px;
		font-size: ${ size === 'small' && ! hasCustomRenderProp
			? '11px'
			: '13px' };
		padding: ${ size === 'small' && ! hasCustomRenderProp
			? space( 2 )
			: space( 4 ) };
	`;
};

export const CustomSelectButton = styled( Ariakit.Select )< {
	size: NonNullable< CustomSelectProps[ 'size' ] >;
	hasCustomRenderProp: boolean;
} >`
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: ${ COLORS.white };
	border: 1px solid ${ COLORS.gray[ 600 ] };
	border-radius: ${ space( 0.5 ) };
	cursor: pointer;
	width: 100%;
	&[data-focus-visible] {
		outline-style: solid;
	}
	&[aria-expanded='true'] {
		border: 1.5px solid ${ COLORS.theme.accent };
	}

	${ ( props ) =>
		getVariableInputStyles( props.size, props.hasCustomRenderProp ) }
`;

export const CustomSelectPopover = styled( Ariakit.SelectPopover )`
	border-radius: ${ space( 0.5 ) };
	background: ${ COLORS.white };
	border: 1px solid ${ COLORS.gray[ 900 ] };
`;

export const CustomSelectItem = styled( Ariakit.SelectItem )`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: ${ space( 2 ) };
	&:hover {
		background-color: ${ COLORS.gray[ 300 ] };
	}
`;
