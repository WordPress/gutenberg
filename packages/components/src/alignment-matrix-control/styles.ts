/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';
import type {
	AlignmentMatrixControlProps,
	AlignmentMatrixControlIconProps,
} from './types';

// Grid structure

const rootBase = ( { size = 92 } ) => css`
	direction: ltr;

	display: grid;
	grid-template-columns: repeat( 3, 1fr );
	grid-template-rows: repeat( 3, 1fr );

	box-sizing: border-box;
	width: ${ size }px;
	aspect-ratio: 1;

	border-radius: ${ CONFIG.radiusMedium };
	outline: none;
`;

export const GridContainer = styled.div< {
	size?: AlignmentMatrixControlProps[ 'width' ];
	disablePointerEvents?: AlignmentMatrixControlIconProps[ 'disablePointerEvents' ];
} >`
	${ rootBase }

	border: 1px solid transparent;

	${ ( props ) =>
		props.disablePointerEvents
			? css``
			: css`
					cursor: pointer;
			  ` }
`;

export const GridRow = styled.div`
	grid-column: 1 / -1;

	box-sizing: border-box;
	display: grid;
	grid-template-columns: repeat( 3, 1fr );
`;

// Cell
export const Cell = styled.span`
	position: relative;

	display: flex;
	align-items: center;
	justify-content: center;

	box-sizing: border-box;
	margin: 0;
	padding: 0;

	appearance: none;
	border: none;
	outline: none;
`;

const POINT_SIZE = 6;
export const Point = styled.span`
	display: block;
	contain: strict;

	box-sizing: border-box;
	width: ${ POINT_SIZE }px;
	aspect-ratio: 1;

	margin: auto;

	color: ${ COLORS.theme.gray[ 400 ] };

	/* Use border instead of background color so that the point shows
	in Windows High Contrast Mode */
	border: ${ POINT_SIZE / 2 }px solid currentColor;

	/* Highlight active item */
	${ Cell }[data-active-item] & {
		color: ${ COLORS.gray[ 900 ] };
		transform: scale( calc( 5 / 3 ) );
	}

	/* Hover styles for non-active items */
	${ Cell }:not([data-active-item]):hover & {
		color: ${ COLORS.theme.accent };
	}

	/* Show an outline only when interacting with keyboard */
	${ Cell }[data-focus-visible] & {
		outline: 1px solid ${ COLORS.theme.accent };
		outline-offset: 1px;
	}

	@media not ( prefers-reduced-motion ) {
		transition-property: color, transform;
		transition-duration: 120ms;
		transition-timing-function: linear;
	}
`;
