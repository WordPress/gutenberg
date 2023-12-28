/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { Heading } from '../heading';

export const ColorHeading = styled( Heading )`
	text-transform: uppercase;
	line-height: 24px;
	font-weight: 500;
	&&& {
		font-size: 11px;
		margin-bottom: 0;
	}
`;
