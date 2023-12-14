/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';
/**
 * Internal dependencies
 */
import BaseUnitControl from '../../unit-control';
import BoxControlIcon from '../icon';
import Button from '../../button';
import { HStack } from '../../h-stack';
import RangeControl from '../../range-control';
import { rtl } from '../../utils';
import { space } from '../../utils/space';
import type { BoxUnitControlProps } from '../types';

export const UnitControlWrapper = styled.div`
	box-sizing: border-box;
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
	margin-right: ${ space( 2 ) };
`;

const unitControlBorderRadiusStyles = ( {
	isFirst,
	isLast,
	isOnly,
}: Pick< BoxUnitControlProps, 'isFirst' | 'isLast' | 'isOnly' > ) => {
	if ( isFirst ) {
		return rtl( { borderTopRightRadius: 0, borderBottomRightRadius: 0 } )();
	}
	if ( isLast ) {
		return rtl( { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } )();
	}
	if ( isOnly ) {
		return css( { borderRadius: 2 } );
	}

	return css( {
		borderRadius: 0,
	} );
};

export const UnitControl = styled( BaseUnitControl )`
	${ unitControlBorderRadiusStyles };
`;
