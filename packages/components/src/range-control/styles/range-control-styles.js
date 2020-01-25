/**
 * External dependencies
 */
import { css } from '@emotion/core';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { color } from '../../utils/colors';

const rangeHeight = () => css( { height: 30, minHeight: 30 } );
const rootWidth = ( { width } ) => css( { width } );

export const Root = styled.span`
	-webkit-tap-highlight-color: transparent;
	box-sizing: border-box;
	cursor: pointer;
	align-items: flex-start;
	display: inline-flex;
	justify-content: flex-start;
	padding: 0;
	position: relative;
	touch-action: none;
	width: 100%;

	${ rootWidth };
`;

const wrapperColor = ( { color: colorProp } ) => css( { color: colorProp } );
const wrapperMargin = ( { marks } ) => css( { marginBottom: marks ? 16 : null } );

export const Wrapper = styled.span`
	box-sizing: border-box;
	display: block;
	padding-top: 15px;
	position: relative;
	width: 100%;

	${ rangeHeight };
	${ wrapperColor };
	${ wrapperMargin };
`;

export const BeforeIconWrapper = styled.span`
	margin-right: 16px;
	margin-top: 2px;
`;

export const AfterIconWrapper = styled.span`
	margin-left: 16px;
	margin-top: 2px;
`;

export const Rail = styled.span`
	background-color: ${ color( 'lightGray.600' ) };
	box-sizing: border-box;
	left: 0;
	pointer-events: none;
	right: 0;
	display: block;
	height: 3px;
	position: absolute;
	margin-top: 14px;
	top: 0;
`;

export const Track = styled.span`
	background-color: currentColor;
	border-radius: 1px;
	box-sizing: border-box;
	height: 3px;
	pointer-events: none;
	display: block;
	position: absolute;
	margin-top: 14px;
	top: 0;
`;

export const MarksWrapper = styled.span`
	box-sizing: border-box;
	display: block;
	position: relative;
	width: 100%;
	user-select: none;
`;

const markFill = ( { isFilled } ) => {
	return css( {
		backgroundColor: isFilled ? 'currentColor' : color( 'lightGray.600' ),
	} );
};

export const Mark = styled.span`
	box-sizing: border-box;
	height: 9px;
	left: 0;
	position: absolute;
	top: -4px;
	width: 1px;

	${ markFill };
`;

const markLabelFill = ( { isFilled } ) => {
	return css( {
		color: isFilled ? color( 'darkGray.300' ) : color( 'lightGray.600' ),
	} );
};

export const MarkLabel = styled.span`
	box-sizing: border-box;
	color: ${ color( 'lightGray.600' ) };
	left: 0;
	font-size: 11px;
	position: absolute;
	top: 12px;
	transform: translateX(-50%);
	white-space: nowrap;

	${ markLabelFill };
`;

export const ThumbWrapper = styled.span`
	align-items: center;
	margin-left: -10px;
	margin-top: 5px;
	width: 20px;
	box-sizing: border-box;
	display: flex;
	height: 20px;
	justify-content: center;
	outline: 0;
	position: absolute;
	pointer-events: none;
	top: 0;
	user-select: none;
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
		borderColor: isFocused ? color( 'darkGray.300' ) : color( 'lightGray.700' ),
		boxShadow: isFocused ?
			`
				0 1px 2px rgba(0, 0, 0, 0.1),
				0 4px 8px rgba(0, 0, 0, 0.2)
			` :
			`
				0 0 0 rgba(0, 0, 0, 0),
				0 0 0 rgba(0, 0, 0, 0)
			`,
	} );
};

export const Thumb = styled.span`
	align-items: center;
	background-color: white;
	border-radius: 50%;
	border: 1px solid ${ color( 'lightGray.700' ) };
	box-sizing: border-box;
	height: 100%;
	outline: 0;
	pointer-events: none;
	position: absolute;
	transition: box-shadow 60ms linear;
	user-select: none;
	width: 100%;

	${ thumbFocus };
	${ handleReducedMotion };
`;

export const InputRange = styled.input`
	box-sizing: border-box;
	cursor: pointer;
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
`;

const tooltipShow = ( { show } ) => {
	return css( {
		opacity: show ? 1 : 0,
		transform: show ? 'translateX(-50%)' : 'translateX(-50%)',
	} );
};

const tooltipPosition = ( { position } ) => {
	const isTop = position === 'top';

	if ( isTop ) {
		return css`
			margin-top: -4px;
			top: -100%;

			&::after {
				border-bottom: none;
				border-top-style: solid;
				bottom: -6px;
			}
		`;
	}

	return css`
		margin-bottom: -4px;
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
	box-sizing: border-box;
	color: white;
	display: inline-block;
	font-size: 11px;
	min-width: 32px;
	opacity: 0;
	padding: 8px;
	position: absolute;
	text-align: center;
	transform: scale(0.5) translateX(-50%);
	transition: opacity 120ms ease;
	user-select: none;

	&::after {
		border: 6px solid ${ color( 'darkGray.800' ) };
		border-left-color: transparent;
		border-right-color: transparent;
		bottom: -6px;
		box-sizing: border-box;
		content: '';
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

export const InputNumber = styled.input`
	box-sizing: border-box;
	display: inline-block;
	margin-left: 16px;
	margin-top: 0;
	min-width: 54px;
	max-width: 120px;

	input[type="number"]& {
		${ rangeHeight };
	}
`;

export const ActionRightWrapper = styled.span`
	box-sizing: border-box;
	display: block;
	margin-left: 8px;
	margin-top: 0;

	button,
	button.is-small {
		margin-left: 0;
		${ rangeHeight };
	}
`;
