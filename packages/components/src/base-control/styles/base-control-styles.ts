/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { baseLabelTypography, boxSizingReset, font, COLORS } from '../../utils';
import { space } from '../../utils/space';

export const Wrapper = styled.div`
	font-family: ${ font( 'default.fontFamily' ) };
	font-size: ${ font( 'default.fontSize' ) };

	${ boxSizingReset }
`;

export const StyledField = styled.div`
	.components-panel__row & {
		margin-bottom: inherit;
	}
`;

const labelStyles = css`
	${ baseLabelTypography };

	display: block;
	margin-bottom: ${ space( 2 ) };
	/**
	 * Removes Chrome/Safari/Firefox user agent stylesheet padding from
	 * StyledLabel when it is rendered as a legend.
	 */
	padding: 0;
`;

export const StyledLabel = styled.label`
	${ labelStyles }
`;

export const StyledHelp = styled.p`
	margin-top: ${ space( 2 ) };
	margin-bottom: 0;
	font-size: ${ font( 'helpText.fontSize' ) };
	font-style: normal;
	color: ${ COLORS.gray[ 700 ] };
`;

export const StyledVisualLabel = styled.span`
	${ labelStyles }
`;
