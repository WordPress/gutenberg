/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/core';

/**
 * Internal dependencies
 */
import { breakpoint, config, color } from '../../utils';
import { inputControl } from '../../utils/input';
import {
	StyledHelp as BaseControlHelp,
	StyledField as BaseControlField,
} from '../../base-control/styles/base-control-styles';
import BaseControl from '../../base-control';

export const RadioControlWrapper = styled( BaseControl )`
	display: flex;
	flex-direction: column;

	${ BaseControlHelp } {
		margin-top: 0;
	}

	${ BaseControlField } {
		margin-bottom: 0;
	}
`;

export const RadioControlOption = styled.div`
	&:not( :last-child ) {
		margin-bottom: 4px;
	}
`;

const appearBoxShadow = () => {
	const boxShadow = [
		`0 0 0 calc( ${ config( 'borderWidth' ) } * 2 ) ${ color( 'white' ) }`,
		`0 0 0 calc( ${ config( 'borderWidth' ) } * 2 + ${ config(
			'borderWidthFocus'
		) } )
					var( --wp-admin-theme-color )`,
	].join( ',' );

	return css( { boxShadow } );
};

export const RadioControlInput = styled.input`
	&,
	&[type='radio'] {
		${ inputControl }
	
		border: ${ config( 'borderWidth' ) } solid ${ color( 'gray.900' ) };
		margin-top: 0;
		margin-right: 6px;
		transition: none;
		border-radius: ${ config( 'radiusRound' ) };
	
		&:checked::before {
			width: 7px;
			height: 7px;
			margin: 8px 0 0 8px;
			background-color: ${ color( 'white' ) };
	
			// This border serves as a background color in Windows High Contrast mode.
			border: 3px solid ${ color( 'white' ) };
	
			${ breakpoint( 'medium' ) } {
				width: 6px;
				height: 6px;
				margin: 4px 0 0 4px;
			}
		}
	
		&:focus {
			${ appearBoxShadow() }
	
			// Only visible in Windows High Contrast mode.
			outline: 2px solid transparent;
		}
	
		&:checked {
			background: var( --wp-admin-theme-color );
			border-color: var( --wp-admin-theme-color );
		}
	}
`;
