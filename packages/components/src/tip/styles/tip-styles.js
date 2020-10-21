/**
 * External dependencies
 */
import { css } from '@emotion/core';

/**
 * Internal dependencies
 */
import { color, space, rtl } from '../../utils';

export const tipStyles = css`
	display: flex;
	color: ${ color( 'mediumGray.text' ) };
`;

export const iconStyles = css`
	align-self: center;
	fill: ${ color( 'alert.yellow' ) };
	flex-shrink: 0;
	${ rtl( { marginRight: space( 2 ) } )() }
`;

export const contentStyles = css`
	margin: 0;
`;
