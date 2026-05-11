/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { Heading } from '../heading';
import { CONFIG } from '../utils';

export const ColorHeading = styled( Heading )`
	text-transform: uppercase;
	line-height: 24px;
	font-weight: ${ CONFIG.fontWeightMedium };
	&&& {
		font-size: 11px;
		margin-bottom: 0;
	}
`;
