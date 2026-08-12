import styled from '@emotion/styled';
import { Heading } from '../heading';
import { CONFIG } from '../utils';

export const ColorHeading = styled( Heading )`
	text-transform: uppercase;
	line-height: 24px;
	font-weight: ${ CONFIG.fontWeightEmphasis };
	&&& {
		font-size: 11px;
		margin-bottom: 0;
	}
`;
