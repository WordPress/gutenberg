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
	border-radius: ${ CONFIG.radiusSmall };
	display: inline-flex;
	min-width: 0;
	position: relative;

	${ toggleGroupControlSize( size ) }
	${ ! isDeselectable && enclosingBorders( isBlock ) }

	@media not ( prefers-reduced-motion ) {
		&[data-indicator-animated]::before {
			transition-property: transform, border-radius;
			transition-duration: 0.2s;
			transition-timing-function: ease-out;
		}
	}

	&::before {
		content: '';
		position: absolute;
		pointer-events: none;
		background: ${ COLORS.theme.gray[ 100 ] };
		border: 1px solid ${ COLORS.theme.gray[ 700 ] };

		// Windows High Contrast mode will show this outline, but not the box-shadow.
		outline: 2px solid transparent;
		outline-offset: -3px;

		border-radius: ${ CONFIG.radiusSmall };
		top: -1px;
		left: -2px;
		width: calc( calc( var( --selected-width, 0 ) * 1px ) + 2px );
		height: calc( calc( var( --selected-height, 0 ) * 1px ) + 2px );
		transform: translateX( calc( var( --selected-left, 0 ) * 1px ) );
		/* Hide when dimensions are unset (0) */
		opacity: min(
			1,
			max( 0, var( --selected-width, 0 ), var( --selected-height, 0 ) )
		);
	}
`;

const enclosingBorders = ( isBlock: ToggleGroupControlProps[ 'isBlock' ] ) => {
	const enclosingBorder = css`
		border-color: ${ COLORS.gray[ 300 ] };
	`;

	return css`
		${ isBlock && enclosingBorder }

		&:hover {
			border-color: ${ COLORS.gray[ 400 ] };
		}

		&:focus-within {
			z-index: 1;
			outline: ${ CONFIG.borderWidthFocus } solid
				${ COLORS.ui.borderFocus };
			outline-offset: 1px;
		}
	`;
};

export const toggleGroupControlSize = (
	size: NonNullable< ToggleGroupControlProps[ 'size' ] >
) => {
	const styles = {
		default: css`
			height: 36px;
		`,
		'__unstable-large': css`
			height: 40px;
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
