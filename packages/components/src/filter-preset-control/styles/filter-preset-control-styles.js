/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { space } from '../../utils/style-mixins';

export const Root = styled.div`
	box-sizing: border-box;
`;

export const SelectControlWrapper = styled.div`
	> .components-base-control {
		margin-bottom: ${ space( 1 ) };
	}
`;

export const ControlWrapper = styled.div`
	padding-top: ${ space( 2.5 ) };
`;
