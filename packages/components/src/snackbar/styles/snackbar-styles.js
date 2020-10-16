/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { breakpoint, color, font, config, space } from '../../utils';

export const SnackbarWrapper = styled.div`
	font-family: ${ font( 'default.fontFamily' ) };
	font-size: ${ font( 'default.fontSize' ) };
	background-color: ${ color( 'gray.900' ) };
	border-radius: ${ config( 'radiusBlockUi' ) };
	box-shadow: 0 2px 4px rgba( 0, 0, 0, 0.3 );
	color: ${ color( 'white' ) };
	padding: 16px 24px;
	width: 100%;
	max-width: 600px;
	box-sizing: border-box;
	cursor: pointer;

	${ breakpoint( 'small' ) } {
		width: fit-content;
	}

	&:focus {
		box-shadow: 0 0 0 1px ${ color( 'white' ) },
			0 0 0 3px var( --wp-admin-theme-color );
	}
`;

export const SnackbarContent = styled.div`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	line-height: ${ font( 'default.lineHeight' ) };
`;

export const SnackbarActionButton = styled( Button )`
	margin-left: ${ space( 4 ) };
	color: ${ color( 'white' ) };
	height: auto;
	flex-shrink: 0;
	line-height: ${ font( 'default.lineHeight' ) };
	padding: 0;

	&:not( :disabled ):not( [aria-disabled='true'] ):not( .is-secondary ) {
		text-decoration: underline;
		background-color: transparent;

		&:focus {
			color: ${ color( 'white' ) };
			box-shadow: none;
			outline: 1px dotted ${ color( 'white' ) };
		}

		&:hover {
			color: var( --wp-admin-theme-color );
		}
	}
`;
