/**
 * External dependencies
 */
import { css } from '@emotion/core';

/**
 * Internal dependencies
 */
import { buttonBase } from './base-styles';
import { color, config, darken } from '../../utils';

export const styles = css`
    ${ buttonBase }
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
`;
