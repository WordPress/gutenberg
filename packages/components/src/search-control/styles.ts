/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import InputControl from '../input-control';
import Icon from '../icon';
import { COLORS } from '../utils';

export const StyledInputControl = styled( InputControl )`
	input[type='search'] {
		&::-webkit-search-decoration,
		&::-webkit-search-cancel-button,
		&::-webkit-search-results-button,
		&::-webkit-search-results-decoration {
			-webkit-appearance: none;
		}
	}

	&:not( :focus-within ) {
		--wp-components-color-background: ${ COLORS.theme.gray[ 100 ] };
	}
`;

export const StyledIcon = styled( Icon )`
	&:dir( ltr ) {
		transform: scaleX( -1 );
	}
`;
