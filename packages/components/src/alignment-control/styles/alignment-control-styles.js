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

export const Root = styled.div`
	--maxWidth: 92px;
	grid-template-rows: repeat( 3, calc( var( --maxWidth ) / 3 ) );
	max-width: var( --maxWidth );

	&:active,
	&:focus {
		border: 1px solid ${color( 'blue.medium.focus' )};
	}

	${rootBase};
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

export const Point = styled.div`
	height: 6px;
	width: 6px;
	${pointBase};
`;

export const Cell = styled.div`
	appearance: none;
	border: none;
	box-sizing: border-box;
	margin: 0;
	display: flex;
	position: relative;
	outline: none;
	cursor: pointer;
	align-items: center;
	justify-content: center;
	padding: 0;
`;
