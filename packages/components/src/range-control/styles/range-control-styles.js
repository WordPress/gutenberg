/**
 * External dependencies
 */
import { css } from '@emotion/core';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { color } from '../../utils/colors';

const rootColor = ( { color: colorProp } ) => css( { color: colorProp } );

export const Root = styled.span`
    -webkit-tap-highlight-color: transparent;
	box-sizing: border-box;
    cursor: pointer;
    display: inline-block;
    height: 2px;
    padding: 14px 0;
    position: relative;
    touch-action: none;
	width: 100%;

	${ rootColor };
`;

export const Rail = styled.span`
	background-color: ${ color( 'lightGray.600' ) };
	box-sizing: border-box;
	left: 0;
	pointer-events: none;
	right: 0;
    border-radius: 1px;
    display: block;
    height: 2px;
	position: absolute;
	margin-top: -1px;
`;

export const Track = styled.span`
	background-color: currentColor;
	border-radius: 1px;
	box-sizing: border-box;
	height: 2px;
	pointer-events: none;
    display: block;
	position: absolute;
	margin-top: -1px;
`;

export const Mark = styled.span`
	background-color: ${ color( 'lightGray.600' ) };
	height: 8px;
	left: 0;
	position: absolute;
	top: -3px;
	width: 1px;
`;

export const ThumbWrapper = styled.span`
	align-items: center;
	margin-left: -10px;
	margin-top: -10px;
	pointer-events: none;
	width: 20px;
    box-sizing: border-box;
    display: flex;
    height: 20px;
    justify-content: center;
    outline: 0;
    position: absolute;
`;

const handleReducedMotion = () => {
	return css`
		@media (prefers-reduced-motion: reduce) {
			transition: none !important;
		}
	`;
};

const thumbFocus = ( { isFocused } ) => {
	return css( {
		borderColor: isFocused ?
			color( 'darkGray.300' ) :
			color( 'lightGray.700' ),
		boxShadow: isFocused ? `
				0 1px 2px rgba(0, 0, 0, 0.1),
				0 4px 8px rgba(0, 0, 0, 0.2)
			` : `
				0 0 0 rgba(0, 0, 0, 0),
				0 0 0 rgba(0, 0, 0, 0)
			`,

	} );
};

export const Thumb = styled.span`
	background-color: white;
	border: 1px solid ${ color( 'lightGray.700' ) };
	box-sizing: border-box;
	height: 100%;
	pointer-events: none;
	position: absolute;
	transition: box-shadow 60ms linear;
	width: 100%;
    align-items: center;
    border-radius: 50%;
    box-sizing: border-box;
    outline: 0;

	${ thumbFocus };
	${ handleReducedMotion };
`;

export const InputRange = styled.input`
	display: block;
	height: 100%;
	left: 0;
	margin: 0;
	opacity: 0;
	outline: none;
	position: absolute;
	right: 0;
	top: 0;
	width: 100%;
    cursor: pointer;
`;

const tooltipShow = ( { position, show } ) => {
	const isTop = position === 'top';

	return css( {
		opacity: show ? 1 : 0,
		transform: show ? 'scale(1)' : 'scale(0.5)',
		transformOrigin: isTop ? 'bottom' : 'top',
	} );
};

const tooltipPosition = ( { position } ) => {
	const isTop = position === 'top';

	if ( isTop ) {
		return css`
			margin-top: -32px;
			top: -100%;

			&::after {
				border-bottom: none;
				border-top-style: solid;
				bottom: -6px;
			}
		`;
	}

	return css`
		margin-bottom: -32px;
		bottom: -100%;

		&::after {
			border-bottom-style: solid;
			border-top: none;
			top: -6px;
		}
	`;
};

export const Tooltip = styled.div`
	background: ${ color( 'darkGray.800' ) };
	border-radius: 3px;
	color: white;
	font-size: 11px;
	min-width: 32px;
	opacity: 0;
	padding: 8px;
	pointer-events: none;
	position: absolute;
	position: relative;
	text-align: center;
	transform: scale(0.5);
	transition: all 120ms ease;
	user-select: none;

	&::after {
		border: 6px solid ${ color( 'darkGray.800' ) };
		border-left-color: transparent;
		border-right-color: transparent;
		bottom: -6px;
		content: "";
		height: 0;
		left: 50%;
		line-height: 0;
		margin-left: -6px;
		position: absolute;
		width: 0;
	}

	${ tooltipShow };
	${ tooltipPosition };
	${ handleReducedMotion };
`;
