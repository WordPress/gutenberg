/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { font, COLORS } from '../../utils';
import { space } from '../../ui/utils/space';

export const Wrapper = styled.div`
	font-family: ${ font( 'default.fontFamily' ) };
	font-size: ${ font( 'default.fontSize' ) };
`;

const deprecatedMargin = ( { __nextHasNoMarginBottom = false } ) => {
	return ! __nextHasNoMarginBottom
		? css`
				margin-bottom: ${ space( 2 ) };
		  `
		: undefined;
};

export const StyledField = styled.div`
	${ deprecatedMargin }

	.components-panel__row & {
		margin-bottom: inherit;
	}
`;

const labelStyles = css`
	display: inline-block;
	margin-bottom: ${ space( 2 ) };
`;

export const StyledLabel = styled.label`
	${ labelStyles }
`;

export const StyledHelp = styled.p`
	margin-top: ${ space( 2 ) };
	font-size: ${ font( 'helpText.fontSize' ) };
	font-style: normal;
	color: ${ COLORS.mediumGray.text };
`;

export const StyledVisualLabel = styled.span`
	${ labelStyles }
`;
