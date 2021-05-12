/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { keyframes } from '@emotion/core';

/**
 * Internal dependencies
 */
import { COLORS, config } from '../../utils';

const spinAnimation = keyframes`
	from {
		transform: rotate(0deg);
	}

	to {
		transform: rotate(360deg);
	}
`;

const topLeft = `calc( ( ${ config( 'spinnerSize' ) } - ${ config(
	'spinnerSize'
) } * ( 2 / 3 ) ) / 2 )`;

export const StyledSpinner = styled.span`
	display: inline-block;
	background-color: ${ COLORS.gray[ 600 ] };
	width: ${ config( 'spinnerSize' ) };
	height: ${ config( 'spinnerSize' ) };
	opacity: 0.7;
	margin: 5px 11px 0;
	border-radius: 100%;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		background-color: ${ COLORS.white };
		top: ${ topLeft };
		left: ${ topLeft };
		width: calc( ${ config( 'spinnerSize' ) } / 4.5 );
		height: calc( ${ config( 'spinnerSize' ) } / 4.5 );
		border-radius: 100%;
		transform-origin: calc( ${ config( 'spinnerSize' ) } / 3 )
			calc( ${ config( 'spinnerSize' ) } / 3 );
		animation: ${ spinAnimation } 1s infinite linear;
	}
`;
