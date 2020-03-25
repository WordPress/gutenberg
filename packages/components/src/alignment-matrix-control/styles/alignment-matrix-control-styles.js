/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/core';

/**
 * Internal dependencies
 */
import { color, reduceMotion } from '../../utils/style-mixins';

export const rootBase = () => {
	return css`
		border-radius: 2px;
		box-sizing: border-box;
		display: grid;
		grid-template-columns: repeat( 3, 1fr );
		outline: none;
	`;
};

const rootBorder = ( { hasFocusBorder } ) => {
	if ( ! hasFocusBorder ) return '';

	return css`
		&:active,
		&:focus {
			border-color: ${color( 'blue.medium.focus' )};
		}
	`;
};

export const Root = styled.div`
	--width: 92px;
	border: 1px solid transparent;
	cursor: pointer;
	grid-template-rows: repeat( 3, calc( var( --width ) / 3 ) );
	width: var( --width, 92px );

	${rootBase};
	${rootBorder};
`;

const pointActive = ( { isActive } ) => {
	const boxShadow = isActive ? `0 0 0 2px ${ color( 'black' ) }` : null;
	const pointColor = isActive ? color( 'black' ) : color( 'lightGray.800' );
	const pointColorHover = isActive
		? color( 'black' )
		: color( 'blue.medium.focus' );

	return css`
		box-shadow: ${boxShadow};
		color: ${pointColor};

		*:hover > & {
			color: ${pointColorHover};
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

		${reduceMotion( 'transition' )};
		${pointActive( props )};
	`;
};

export const Point = styled.span`
	height: 6px;
	width: 6px;
	${pointBase};
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
