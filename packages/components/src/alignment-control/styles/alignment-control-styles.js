/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/core';

/**
 * Internal dependencies
 */
import { color, reduceMotion } from '../../utils/style-mixins';

export const Root = styled.div`
	--maxWidth: 92px;
	border: 1px solid transparent;
	border-radius: 2px;
	max-width: var( --maxWidth );
	display: grid;
	grid-template-columns: repeat( 3, 1fr );
	grid-template-rows: repeat( 3, calc( var( --maxWidth ) / 3 ) );
	outline: none;

	&:active,
	&:focus {
		border: 1px solid ${color( 'blue.medium.focus' )};
	}
`;

export const Point = styled.div`
	width: 6px;
	height: 6px;
	margin: auto;
	transition: all 120ms linear;
	background: currentColor;
	${reduceMotion( 'transition' )};

	${( { isActive } ) =>
		css( {
			boxShadow: isActive ? `0 0 0 2px ${ color( 'black' ) }` : null,
			color: isActive ? color( 'black' ) : color( 'lightGray.800' ),
		} )}

	*:hover > & {
		${( { isActive } ) =>
			css( {
				color: isActive
					? color( 'black' )
					: color( 'blue.medium.focus' ),
			} )}
	}
`;

export const Cell = styled.div`
	appearance: none;
	border: none;
	margin: 0;
	display: flex;
	position: relative;
	outline: none;
	cursor: pointer;
	align-items: center;
	justify-content: center;
	padding: 0;
`;
