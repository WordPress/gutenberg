/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import {
	rootBase,
	pointBase,
	Cell as CellBase,
} from './alignment-matrix-control-styles';
import type {
	AlignmentMatrixControlIconProps,
	AlignmentMatrixControlCellProps,
} from '../types';

const rootSize = () => {
	const padding = 1.5;
	const size = 24;

	return css( {
		gridTemplateRows: `repeat( 3, calc( ${ size - padding * 2 }px / 3))`,
		padding,
		maxHeight: size,
		maxWidth: size,
	} );
};

const rootPointerEvents = ( {
	disablePointerEvents,
}: Pick< AlignmentMatrixControlIconProps, 'disablePointerEvents' > ) => {
	return css( {
		pointerEvents: disablePointerEvents ? 'none' : undefined,
	} );
};

export const Wrapper = styled.div`
	box-sizing: border-box;
	padding: 2px;
`;

export const Root = styled.div`
	transform-origin: top left;
	height: 100%;
	width: 100%;

	${ rootBase };
	${ rootSize };
	${ rootPointerEvents };
`;

const pointActive = ( {
	isActive,
}: Pick< AlignmentMatrixControlCellProps, 'isActive' > ) => {
	const boxShadow = isActive ? `0 0 0 1px currentColor` : null;

	return css`
		box-shadow: ${ boxShadow };
		color: currentColor;

		*:hover > & {
			color: currentColor;
		}
	`;
};

export const Point = styled.span`
	height: 2px;
	width: 2px;
	${ pointBase };
	${ pointActive };
`;

export const Cell = CellBase;
