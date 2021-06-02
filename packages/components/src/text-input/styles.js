/**
 * External dependencies
 */
import { css, ui } from '@wp-g2/styles';

export { scrollableScrollbar } from '../ui/scrollable/styles';

export const focus = css`
	border-color: ${ ui.color.admin };
`;

export const multiline = css`
	padding-left: 0;
	padding-right: 0;
`;

export const inputMultiline = css`
	padding-left: 8px;
	padding-right: 8px;
`;

export const inputFontSize = css`
	font-size: ${ ui.get( 'fontSizeInputMobile' ) };
	@media ( min-width: 36em ) {
		font-size: ${ ui.get( 'fontSize' ) };
	}
`;

export const Input = css`
	appearance: none;
	background: transparent;
	border: none;
	border-radius: ${ ui.get( 'controlBorderRadius' ) };
	box-shadow: none;
	box-sizing: border-box;
	color: ${ ui.color.text };
	display: block;
	flex: 1;
	line-height: 18px;
	min-height: calc( ${ ui.get( 'controlHeight' ) } - 2px );
	outline: none;
	padding: 0;
	padding-bottom: calc( ( ${ ui.get( 'controlHeight' ) } - 2px - 18px ) / 2 );
	padding-top: calc( ( ${ ui.get( 'controlHeight' ) } - 2px - 18px ) / 2 );
	resize: none;
	text-align: left;
	width: 100%;

	${ inputFontSize };

	&::-webkit-outer-spin-button,
	&::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	/* Firefox */
	&[type='number'] {
		-moz-appearance: textfield;
	}
`;

export const large = css`
	min-height: calc( ${ ui.get( 'controlHeightLarge' ) } - 2px );
	padding-bottom: calc(
		( ${ ui.get( 'controlHeightLarge' ) } - 2px - 18px ) / 2
	);
	padding-top: calc(
		( ${ ui.get( 'controlHeightLarge' ) } - 2px - 18px ) / 2
	);
`;

export const small = css`
	min-height: calc( ${ ui.get( 'controlHeightSmall' ) } - 2px );
	padding-bottom: calc(
		( ${ ui.get( 'controlHeightSmall' ) } - 2px - 18px ) / 2
	);
	padding-top: calc(
		( ${ ui.get( 'controlHeightSmall' ) } - 2px - 18px ) / 2
	);
`;

export const resizable = css`
	resize: vertical;
`;

export const SpinnerWrapper = css`
	align-items: center;
	display: flex;
	height: 100%;
	justify-content: center;
	margin: 0 !important;
	min-height: 0;
`;

export const Spinner = css`
	height: 24px;
	margin: 0 -6px 0 0 !important;
	opacity: 0.6;
	user-select: none;
`;

export const SpinnerArrow = css`
	background-color: transparent;
	border-radius: ${ ui.get( 'controlBorderRadius' ) };
	color: ${ ui.get( 'colorText' ) };
	cursor: pointer;
	padding: 0 2px;

	&:hover:active {
		background-color: ${ ui.get( 'controlBackgroundColorHover' ) };
	}
`;

export const SpinnerArrowUp = css`
	${ SpinnerArrow };
	margin-bottom: -1px;
`;

export const SpinnerArrowDown = css`
	${ SpinnerArrow };
	margin-top: -1px;
`;

export const Steppers = css`
	${ Spinner };
	margin: 0 -2px 0 0 !important;
	opacity: 1;
`;

export const StepperButton = css`
	${ SpinnerArrow };
	border: 1px solid transparent;
	color: ${ ui.get( 'controlInnerControltextColor' ) };
	cursor: pointer;
	display: block;
	outline: none;
	padding: 3px;

	&:hover {
		background-color: ${ ui.get( 'controlBackgroundColorHover' ) };
	}

	&:focus {
		background-color: ${ ui.get( 'controlBackgroundColorHover' ) };
		border-color: ${ ui.get( 'colorAdmin' ) };
	}

	&[disabled] {
		pointer-events: none;
	}
`;

export const SteppersUp = css`
	${ StepperButton };
`;

export const SteppersDown = css`
	${ StepperButton };
`;

export const globalDraggableX = css`
	* {
		cursor: ew-resize;
	}
`;

export const globalDraggableY = css`
	* {
		cursor: ns-resize;
	}
`;
