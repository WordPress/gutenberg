/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { SVG } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import { color, space, rtl } from '../../utils';

export const TipWrapper = styled.div`
	display: flex;
	color: ${ color( 'mediumGray.text' ) };
`;

export const TipIcon = styled( SVG )`
	align-self: center;
	fill: ${ color( 'alert.yellow' ) };
	flex-shrink: 0;
	${ rtl( { marginRight: space( 2 ) } )() }
`;

export const TipContent = styled.p`
	margin: 0;
`;
