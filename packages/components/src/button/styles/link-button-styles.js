/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/core';

/**
 * Internal dependencies
 */
import { BaseButton } from './base-styles';
import { appearBusy } from './busy-styles';
import { reduceMotion, config, color, darken, rtl } from '../../utils';

export const LinkButton = styled( BaseButton )`
	margin: 0;
	padding: 0;
	box-shadow: none;
	border: 0;
	border-radius: 0;
	background: none;
	outline: none;
	${ rtl( { textAlign: 'left' }, { textAlign: 'right' } ) }
	/* Mimics the default link style in common.css */
	color: #0073aa;
	text-decoration: underline;
	transition-property: border, background, color;
	transition-duration: 0.05s;
	transition-timing-function: ease-in-out;
	${ reduceMotion( 'transition' ) }
	height: auto;

	&:hover:not( :disabled ),
	&:active:not( :disabled ) {
		color: #00a0d2;
		box-shadow: none;
	}

	&:focus {
		color: #124964;
		box-shadow: 0 0 0 ${ config( 'borderWidth' ) } #5b9dd9,
			0 0 ${ config( 'borderWidthFocus' ) } ${ config( 'borderWidth' ) }
				rgba( 30, 140, 190, 0.8 );
	}

	${ ( props ) => ( props.isDestructive ? destructive : '' ) }
	${ appearBusy }
`;

const destructive = css`
	color: ${ color( 'alert.red' ) };

	&:active:not( :disabled ),
	&:hover:not( :disabled ) {
		color: ${ darken( color( 'alert.red' ), 20 ) };
		background: none;
	}

	&:focus:not( :disabled ) {
		color: var( --wp-admin-theme-color );
	}
`;
