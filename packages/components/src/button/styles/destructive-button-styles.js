/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { BaseButton } from './base-styles';
import { appearBusy } from './busy-styles';
import { color, config, darken } from '../../utils';

export const DestructiveButton = styled( BaseButton )`
	color: ${ color( 'alert.red' ) };
	box-shadow: inset 0 0 0 ${ config( 'borderWidth' ) }
		${ color( 'alert.red' ) };

	&:hover:not( :disabled ) {
		color: ${ darken( color( 'alert.red' ), 20 ) };
		box-shadow: inset 0 0 0 ${ config( 'borderWidth' ) }
			${ darken( color( 'alert.red' ), 20 ) };
	}

	&:focus:not( :disabled ) {
		color: var( --wp-admin-theme-color );
	}

	&:active:not( :disabled ) {
		background: ${ color( 'gray.400' ) };
	}

	${ appearBusy }
`;
