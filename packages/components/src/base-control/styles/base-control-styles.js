/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { font, space, COLORS } from '../../utils';

export const Wrapper = styled.div`
	font-family: ${ font( 'default.fontFamily' ) };
	font-size: ${ font( 'default.fontSize' ) };
`;

export const StyledField = styled.div`
	margin-bottom: ${ space( 1 ) };

	.components-panel__row & {
		margin-bottom: inherit;
	}
`;

export const StyledLabel = styled.label`
	display: inline-block;
	margin-bottom: ${ space( 1 ) };
`;

export const StyledHelp = styled.p`
	font-size: ${ font( 'helpText.fontSize' ) };
	font-style: normal;
	color: ${ COLORS.mediumGray.text };
`;
