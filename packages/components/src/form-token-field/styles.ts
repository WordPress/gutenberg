/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { Flex } from '../flex';
import { space } from '../utils/space';
import { boxSizingReset } from '../utils';

type TokensAndInputWrapperProps = {
	__next40pxDefaultSize: boolean;
	hasTokens: boolean;
};

const deprecatedPaddings = ( {
	__next40pxDefaultSize,
	hasTokens,
}: TokensAndInputWrapperProps ) =>
	! __next40pxDefaultSize &&
	css`
		padding-top: ${ space( hasTokens ? 1 : 0.5 ) };
		padding-bottom: ${ space( hasTokens ? 1 : 0.5 ) };
	`;

export const TokensAndInputWrapperFlex = styled( Flex )`
	padding: 7px;
	${ boxSizingReset }

	${ deprecatedPaddings }
`;
