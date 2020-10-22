/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/core';

/**
 * Internal dependencies
 */
import { BaseButton } from './base-styles';
import { color, config, rgba } from '../../utils';

export const PrimaryButton = styled( BaseButton )`
	white-space: nowrap;
	background: var( --wp-admin-theme-color );
	color: ${ color( 'white' ) };
	text-decoration: none;
	text-shadow: none;

	&:hover:not( :disabled ) {
		background: var( --wp-admin-theme-color-darker-10 );
		color: ${ color( 'white' ) };
	}

	&:active:not( :disabled ) {
		background: var( --wp-admin-theme-color-darker-20 );
		border-color: var( --wp-admin-theme-color-darker-20 );
		color: ${ color( 'white' ) };
	}

	&:focus:not( :disabled ) {
		box-shadow: inset 0 0 0 1px ${ color( 'white' ) },
			0 0 0 ${ config( 'borderWidthFocus' ) }
				var( --wp-admin-theme-color );

		// Windows High Contrast mode will show this outline, but not the box-shadow.
		outline: 1px solid transparent;
	}

	&:disabled,
    &:disabled:active:enabled,
    &[aria-disabled="true"],
    &[aria-disabled="true"]:enabled, // This catches a situation where a Button is aria-disabled, but not disabled.
    &[aria-disabled="true"]:active:enabled {
		color: ${ rgba( color( 'white' ), 0.4 ) };
		background: var( --wp-admin-theme-color );
		border-color: var( --wp-admin-theme-color );
		opacity: 1;

		&:focus:enabled {
			box-shadow: 0 0 0 ${ config( 'borderWidth' ) } ${ color( 'white' ) },
				0 0 0 3px var( --wp-admin-theme-color );
		}
	}

	${ ( props ) => ( props.isBusy ? busy : '' ) }
`;

const busy = css`
	color: ${ color( 'white' ) };
	background-size: 100px 100%;
	background-image: linear-gradient(
		-45deg,
		var( --wp-admin-theme-color ) 28%,
		var( --wp-admin-theme-color-darker-20 ) 28%,
		var( --wp-admin-theme-color-darker-20 ) 72%,
		var( --wp-admin-theme-color ) 72%
	);
	border-color: var( --wp-admin-theme-color );
`;
