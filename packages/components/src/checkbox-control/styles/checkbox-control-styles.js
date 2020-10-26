/**
 * External dependencies
 */
import { css } from '@emotion/core';
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { config, space, color, breakpoint, reduceMotion } from '../../utils';
import { inputControl } from '../../utils/input';

const appearBoxShadow = () => {
	const boxShadow = [
		`0 0 0 calc(${ config( 'borderWidth' ) } * 2) ${ color( 'white' ) }`,
		`0 0 0 calc(${ config( 'borderWidth' ) } * 2 + ${ config(
			'borderWidthFocus'
		) }) var(--wp-admin-theme-color)`,
	].join( ',' );

	return css( { boxShadow } );
};

const checkboxControl = css`
	${ inputControl }

	border: ${ config( 'borderWidth' ) } solid ${ color( 'gray.900' ) };
	margin-right: ${ space( 1.5 ) };
	transition: none;
	border-radius: ${ config( 'radiusBlockUi' ) };

	&:focus {
		${ appearBoxShadow() }

		// Only visible in Windows High Contrast mode.
		outline: 2px solid transparent;
	}

	&:checked {
		background: var( --wp-admin-theme-color );
		border-color: var( --wp-admin-theme-color );

		// Hide default checkbox styles in IE.
		&::-ms-check {
			opacity: 0;
		}
	}

	&:checked::before,
	&[aria-checked='mixed']::before {
		margin: -3px -5px;
		color: ${ color( 'white' ) };

		${ breakpoint( 'medium' ) } {
			margin: -4px 0 0 -5px;
		}
	}

	&[aria-checked='mixed'] {
		background: var( --wp-admin-theme-color );
		border-color: var( --wp-admin-theme-color );

		&::before {
			// Inherited from forms.css.
			// See: https://github.com/WordPress/wordpress-develop/tree/5.1.1/src/wp-admin/css/forms.css#L122-L132
			content: '\f460';
			float: left;
			display: inline-block;
			vertical-align: middle;
			width: 16px;
			/* stylelint-disable */
			font: normal 30px/1 dashicons;
			/* stylelint-enable */
			speak: none;
			-webkit-font-smoothing: antialiased;
			-moz-osx-font-smoothing: grayscale;

			${ breakpoint( 'medium' ) } {
				float: none;
				font-size: 21px;
			}
		}
	}
`;

const inputSize = '20px';
const inputSizeSm = '24px';

export const StyledCheckbox = styled.input`
	${ checkboxControl }
	background: ${ color( 'white' ) };
	color: ${ color( 'gray.900' ) };
	clear: none;
	cursor: pointer;
	display: inline-block;
	line-height: 0;
	margin: 0 ${ space( 0.5 ) } 0 0;
	outline: 0;
	padding: 0;
	text-align: center;
	vertical-align: top;
	width: ${ inputSizeSm };
	height: ${ inputSizeSm };

	${ breakpoint( 'small' ) } {
		height: ${ inputSize };
		width: ${ inputSize };
	}

	appearance: none;
	transition: 0.1s border-color ease-in-out;
	${ reduceMotion( 'transition' ) }

	&:checked::before {
		content: none;
	}
`;

export const StyledContainer = styled.div`
	position: relative;
	display: inline-block;
	margin-right: 12px;
	vertical-align: middle;
	width: ${ inputSizeSm };
	height: ${ inputSizeSm };

	${ breakpoint( 'small' ) } {
		width: ${ inputSize };
		height: ${ inputSize };
	}
`;

export const StyledCheck = styled( Icon )`
	fill: ${ color( 'white' ) };
	cursor: pointer;
	position: absolute;
	left: 0;
	top: 0;
	width: ${ config( 'buttonSizeSmall' ) };
	height: ${ config( 'buttonSizeSmall' ) };

	${ breakpoint( 'small' ) } {
		left: -2px;
		top: -2px;
	}

	user-select: none;
	pointer-events: none;
`;
