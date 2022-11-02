/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { CONFIG, COLORS, reduceMotion } from '../../utils';
import type { ToggleGroupControlProps } from '../types';

export const ToggleGroupControl = ( {
	isBlock,
	isDeselectable,
	size,
}: Pick< ToggleGroupControlProps, 'isBlock' | 'isDeselectable' > & {
	size: NonNullable< ToggleGroupControlProps[ 'size' ] >;
} ) => css`
	background: ${ COLORS.ui.background };
	border: 1px solid transparent;
	border-radius: ${ CONFIG.controlBorderRadius };
	display: inline-flex;
	min-width: 0;
	padding: 2px;
	position: relative;
	transition: transform ${ CONFIG.transitionDurationFastest } linear;
	${ reduceMotion( 'transition' ) }

	${ toggleGroupControlSize( size ) }
	${ ! isDeselectable && enclosingBorders( isBlock ) }
`;

const enclosingBorders = ( isBlock: ToggleGroupControlProps[ 'isBlock' ] ) => {
	const enclosingBorder = css`
		border-color: ${ COLORS.ui.border };
	`;

	return css`
		${ isBlock && enclosingBorder }

		&:hover {
			border-color: ${ COLORS.ui.borderHover };
		}

		&:focus-within {
			border-color: ${ COLORS.ui.borderFocus };
			box-shadow: ${ CONFIG.controlBoxShadowFocus };
			outline: none;
			z-index: 1;
		}
	`;
};

export const toggleGroupControlSize = (
	size: NonNullable< ToggleGroupControlProps[ 'size' ] >
) => {
	const heights = {
		default: '36px',
		'__unstable-large': '40px',
	};

	return css`
		min-height: ${ heights[ size ] };
	`;
};

export const block = css`
	display: flex;
	width: 100%;
`;

export const BackdropView = styled.div`
	background: ${ COLORS.gray[ 900 ] };
	border-radius: ${ CONFIG.controlBorderRadius };
	left: 0;
	position: absolute;
	top: 2px;
	bottom: 2px;
	transition: transform ${ CONFIG.transitionDurationFast } ease;
	${ reduceMotion( 'transition' ) }
	z-index: 1;
`;

export const VisualLabelWrapper = styled.div`
	// Makes the inline label be the correct height, equivalent to setting line-height: 0
	display: flex;
`;
