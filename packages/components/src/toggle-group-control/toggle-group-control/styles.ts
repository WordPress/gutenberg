/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { CONFIG, COLORS } from '../../utils';
import type { ToggleGroupControlProps } from '../types';

export const toggleGroupControl = ( {
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
	position: relative;

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
			z-index: 1;
			// Windows High Contrast mode will show this outline, but not the box-shadow.
			outline: 2px solid transparent;
			outline-offset: -2px;
		}
	`;
};

export const toggleGroupControlSize = (
	size: NonNullable< ToggleGroupControlProps[ 'size' ] >
) => {
	const styles = {
		default: css`
			min-height: 36px;
			padding: 2px;
		`,
		'__unstable-large': css`
			min-height: 40px;
			padding: 3px;
		`,
	};

	return styles[ size ];
};

export const block = css`
	display: flex;
	width: 100%;
`;

export const VisualLabelWrapper = styled.div`
	// Makes the inline label be the correct height, equivalent to setting line-height: 0
	display: flex;
`;
