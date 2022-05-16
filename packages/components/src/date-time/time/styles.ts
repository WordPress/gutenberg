/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';
/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../../utils';

export const Wrapper = styled.div``;

export const Fieldset = styled.fieldset`
	border: 0;
	margin: 0 0 calc( 8px * 2 ) 0; // TODO: how to grid unit?
	padding: 0;

	&:last-child {
		margin-bottom: 0;
	}
`;

export const Legend = styled.legend`
	margin-bottom: calc( 8px * 1 ); // TODO: how to grid unit?
	padding: 0;
`;

export const TimeWrapper = styled.div`
	display: flex;
`;

const baseField = css`
	height: 36px;
	z-index: 1;

	// TODO: how to use input-style__neutral() mixin?
	box-shadow: 0 0 0 transparent;
	transition: box-shadow 0.1s linear;
	border-radius: ${ CONFIG.radiusBlockUi };
	border: ${ CONFIG.borderWidth } solid ${ COLORS.gray[ 700 ] };
	@media ( prefers-reduced-motion: reduce ) {
		transition-duration: 0s;
		transition-delay: 0s;
	}

	&:focus {
		// TODO: how to use input-style__focus() mixin?
		&&& {
			border-color: var( --wp-admin-theme-color );
		}
		box-shadow: 0 0 0
			calc( ${ CONFIG.borderWidthFocus } - ${ CONFIG.borderWidth } )
			var( --wp-admin-theme-color );
		// Windows High Contrast mode will show this outline, but not the box-shadow.
		outline: 2px solid transparent;
	}
`;

const baseInput = css`
	-moz-appearance: textfield;
	text-align: center;
`;

export const hoursField = css`
	${ baseField }
	${ baseInput }
	width: 35px;

	// TODO: how to make this work? what is it for?
	/*rtl:ignore*/
	direction: ltr;

	// Extra specificity needed as these are commonly overruled.
	&[type='number'] {
		border-right: 0;
		border-bottom-right-radius: 0;
		border-top-right-radius: 0;
		margin: 0;
	}
`;

export const TimeSeparator = styled.span`
	border-top: ${ CONFIG.borderWidth } solid ${ COLORS.gray[ 700 ] };
	border-bottom: ${ CONFIG.borderWidth } solid ${ COLORS.gray[ 700 ] };
	line-height: 34px; // TODO: how to write this as 36px - borderWidth * 2?
	display: inline-block;
`;

export const minutesField = css`
	${ baseField }
	${ baseInput }
	width: 35px;

	// Extra specificity needed as these are commonly overruled.
	&[type='number'] {
		border-left: 0;
		border-bottom-left-radius: 0;
		border-top-left-radius: 0;
		margin: 0;
	}
`;

export const monthField = css`
	${ baseField }
	flex-grow: 1;
`;

export const dayField = css`
	${ baseField }
	${ baseInput }
	width: 35px;
`;

export const yearField = css`
	${ baseField }
	${ baseInput }
	width: 55px;
`;

export const TimeZone = styled.div`
	text-decoration: underline dotted;
`;
