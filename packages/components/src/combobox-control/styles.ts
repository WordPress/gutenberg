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
import type { ComboboxControlProps } from './types';

const deprecatedDefaultSize = ( {
	__next40pxDefaultSize,
}: Pick< ComboboxControlProps, '__next40pxDefaultSize' > ) =>
	! __next40pxDefaultSize &&
	css`
		height: 28px; // 30px - 2px vertical borders on parent container
		padding-left: ${ space( 1 ) };
		padding-right: ${ space( 1 ) };
	`;

export const InputWrapperFlex = styled( Flex )`
	height: 38px; // 40px - 2px vertical borders on parent container
	padding-left: ${ space( 2 ) };
	padding-right: ${ space( 2 ) };

	${ deprecatedDefaultSize }
`;
