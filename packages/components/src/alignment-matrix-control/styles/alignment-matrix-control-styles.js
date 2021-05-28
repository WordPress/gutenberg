/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/core';

/**
 * Internal dependencies
 */
import { COLORS, reduceMotion } from '../../utils';

export const rootBase = () => {
	return css`
		border-radius: 2px;
		box-sizing: border-box;
		display: grid;
		grid-template-columns: repeat( 3, 1fr );
		outline: none;
	`;
};

const rootSize = ( { size = 92 } ) => {
	return css`
		grid-template-rows: repeat( 3, calc( ${ size }px / 3 ) );
		width: ${ size }px;
	`;
};

export const Root = styled.div`
	${ rootBase };

	border: 1px solid transparent;
	cursor: pointer;
	grid-template-columns: auto;

	${ rootSize };
`;

export const Row = styled.div`
	box-sizing: border-box;
	display: grid;
	grid-template-columns: repeat( 3, 1fr );
`;

const pointActive = ( { isActive } ) => {
	const boxShadow = isActive ? `0 0 0 2px ${ COLORS.black }` : null;
	const pointColor = isActive ? COLORS.black : COLORS.lightGray[ 800 ];
	const pointColorHover = isActive ? COLORS.black : COLORS.blue.medium.focus;

	return css`
		box-shadow: ${ boxShadow };
		color: ${ pointColor };

		*:hover > & {
			color: ${ pointColorHover };
		}
	`;
};

export const pointBase = ( props ) => {
	return css`
		background: currentColor;
		box-sizing: border-box;
		display: grid;
		margin: auto;
		transition: all 120ms linear;

		${ reduceMotion( 'transition' ) }
		${ pointActive( props ) }
	`;
};

export const Point = styled.span`
	height: 6px;
	width: 6px;
	${ pointBase }
`;

export const Cell = styled.span`
	appearance: none;
	border: none;
	box-sizing: border-box;
	margin: 0;
	display: flex;
	position: relative;
	outline: none;
	align-items: center;
	justify-content: center;
	padding: 0;
`;
