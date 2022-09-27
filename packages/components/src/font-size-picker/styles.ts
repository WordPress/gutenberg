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
import { VStack } from '../v-stack';
import type { FontSizePickerProps } from './types';

export const Container = styled.fieldset`
	border: 0;
	margin: 0;
	padding: 0;
`;

export const HeaderLabel = styled( BaseControl.VisualLabel )`
	margin-bottom: 0;
`;

export const HeaderHint = styled.span`
	color: ${ COLORS.gray[ 700 ] };
	margin-left: ${ space( 1 ) };
`;

// 280px is the sidebar width.
// TODO: Remove this, @wordpress/components shouldn't care what a "sidebar" is.
export const Controls = styled( VStack )`
	max-width: calc( 280px - ${ space( 4 ) } * 2 );
`;

export const ResetButton = styled( Button )< {
	size: FontSizePickerProps[ 'size' ];
} >`
	&&& {
		height: ${ ( props ) =>
			props.size === '__unstable-large' ? '40px' : '30px' };
	}
`;
