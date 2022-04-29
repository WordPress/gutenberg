/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { Flex } from '../flex';
import { space } from '../ui/utils/space';

const deprecatedDefaultSize = ( { __next36pxDefaultSize } ) =>
	! __next36pxDefaultSize &&
	css`
		height: 30px;
		padding-left: ${ space( 1 ) };
		padding-right: ${ space( 1 ) };
	`;

export const InputWrapperFlex = styled( Flex )`
	height: 36px;
	padding-left: ${ space( 2 ) };
	padding-right: ${ space( 2 ) };

	${ deprecatedDefaultSize }
`;
