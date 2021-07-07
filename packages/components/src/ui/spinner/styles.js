/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { WRAPPER_SIZE } from './utils';

export const ContainerView = styled.div`
	display: flex;
	pointer-events: none;
	position: relative;
`;

export const BarsWrapperView = styled.div`
	height: ${ WRAPPER_SIZE }px;
	left: 0;
	opacity: 0.6;
	position: absolute;
	top: 0;
	transform-origin: top left;
	width: ${ WRAPPER_SIZE }px;
`;

export const BarsView = styled.div`
	color: currentColor;
	display: inline-flex;
	height: 54px;
	left: 50%;
	padding: 10px;
	position: absolute;
	top: 50%;
	transform: translate( -50%, -50% );
	width: 54px;

	> div {
		/* animation: ComponentsUISpinnerFadeAnimation 1000ms linear infinite; */
		background: currentColor;
		border-radius: 50px;
		height: 16%;
		left: 49%;
		opacity: 0;
		position: absolute;
		top: 43%;
		width: 6%;
	}

	.InnerBar1 {
		opacity: 0.25;
		transform: rotate( 0deg ) translate( 0, -130% );
	}

	.InnerBar2 {
		opacity: calc( 0.25 + ( 0.75 / 12 * 1 ) );
		transform: rotate( 30deg ) translate( 0, -130% );
	}

	.InnerBar3 {
		opacity: calc( 0.25 + ( 0.75 / 12 * 2 ) );
		transform: rotate( 60deg ) translate( 0, -130% );
	}
	.InnerBar4 {
		opacity: calc( 0.25 + ( 0.75 / 12 * 3 ) );

		transform: rotate( 90deg ) translate( 0, -130% );
	}
	.InnerBar5 {
		opacity: calc( 0.25 + ( 0.75 / 12 * 4 ) );

		transform: rotate( 120deg ) translate( 0, -130% );
	}
	.InnerBar6 {
		opacity: calc( 0.25 + ( 0.75 / 12 * 5 ) );

		transform: rotate( 150deg ) translate( 0, -130% );
	}
	.InnerBar7 {
		opacity: calc( 0.25 + ( 0.75 / 12 * 6 ) );
		transform: rotate( 180deg ) translate( 0, -130% );
	}
	.InnerBar8 {
		opacity: calc( 0.25 + ( 0.75 / 12 * 7 ) );
		transform: rotate( 210deg ) translate( 0, -130% );
	}
	.InnerBar9 {
		opacity: calc( 0.25 + ( 0.75 / 12 * 8 ) );
		transform: rotate( 240deg ) translate( 0, -130% );
	}
	.InnerBar10 {
		opacity: calc( 0.25 + ( 0.75 / 12 * 9 ) );
		transform: rotate( 270deg ) translate( 0, -130% );
	}
	.InnerBar11 {
		opacity: calc( 0.25 + ( 0.75 / 12 * 10 ) );
		transform: rotate( 300deg ) translate( 0, -130% );
	}
	.InnerBar12 {
		opacity: calc( 0.25 + ( 0.75 / 12 * 11 ) );
		transform: rotate( 330deg ) translate( 0, -130% );
	}
`;
