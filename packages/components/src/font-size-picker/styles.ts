/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import Button from '../button';
import { space } from '../ui/utils/space';
import { COLORS } from '../utils';
import type { FontSizePickerProps } from './types';

export const Container = styled.fieldset`
	border: 0;
	margin: 0;
	padding: 0;
`;

export const HeaderLabel = styled( BaseControl.VisualLabel )`
	display: flex;
	gap: ${ space( 1 ) };
	justify-content: flex-start;
	margin-bottom: 0;
`;

export const HeaderHint = styled.span`
	color: ${ COLORS.gray[ 700 ] };
`;

export const Controls = styled.div< {
	__nextHasNoMarginBottom: boolean;
} >`
	${ ( props ) =>
		! props.__nextHasNoMarginBottom && `margin-bottom: ${ space( 6 ) };` }
`;

export const ResetButton = styled( Button )< {
	size: FontSizePickerProps[ 'size' ];
} >`
	&&& {
		height: ${ ( props ) =>
			props.size === '__unstable-large' ? '40px' : '30px' };
	}
`;
