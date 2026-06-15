/**
 * External dependencies
 */
import styled from '@emotion/styled';
/**
 * Internal dependencies
 */
import BoxControlIcon from '../icon';
import Button from '../../button';
import { HStack } from '../../h-stack';
import RangeControl from '../../range-control';
import UnitControl from '../../unit-control';
import { space } from '../../utils/space';

export const StyledUnitControl = styled( UnitControl )`
	max-width: 90px;
`;

export const InputWrapper = styled( HStack )`
	grid-column: 1 / span 3;
`;

export const ResetButton = styled( Button )`
	grid-area: 1 / 2;
	justify-self: end;
`;

export const LinkedButtonWrapper = styled.div`
	grid-area: 1 / 3;
	justify-self: end;
`;

export const FlexedBoxControlIcon = styled( BoxControlIcon )`
	flex: 0 0 auto;
`;

export const FlexedRangeControl = styled( RangeControl )`
	width: 100%;
	margin-inline-end: ${ space( 2 ) };
`;
