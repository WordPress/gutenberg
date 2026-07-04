import styled from '@emotion/styled';
import { Flex } from '../flex';
import { space } from '../utils/space';

export const InputWrapperFlex = styled( Flex )`
	height: 38px; // 40px - 2px vertical borders on parent container
	padding-left: ${ space( 2 ) };
	padding-right: ${ space( 2 ) };
`;
