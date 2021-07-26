/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { font, COLORS } from '../../utils';
import { space } from '../../ui/utils/space';

export const Wrapper = styled.div`
	font-family: ${ font( 'default.fontFamily' ) };
	font-size: ${ font( 'default.fontSize' ) };
	margin-bottom: ${ space( 2 ) };

	> *:not(:last-child) {
		margin-bottom: ${ space( 2 ) };
	}
`;

export const StyledField = styled.div`
	.components-panel__row & {
		margin-bottom: inherit;
	}
`;

export const StyledLabel = styled.label`
	display: inline-block;
	margin-bottom: ${ space( 2 ) };
`;

export const StyledHelp = styled.p`
	font-size: ${ font( 'helpText.fontSize' ) };
	font-style: normal;
	color: ${ COLORS.mediumGray.text };
	margin: 0;
`;
