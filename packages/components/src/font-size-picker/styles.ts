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
import { COLORS, rtl } from '../utils';

export const Container = styled.fieldset`
	border: 0;
	margin: 0;
	padding: 0;
`;

export const HeaderLabel = styled( BaseControl.VisualLabel )`
	display: inline-block;
	margin-bottom: 0;
`;

export const HeaderHint = styled.span`
	color: ${ COLORS.gray[ 700 ] };
	display: inline-block;
	${ rtl( { marginLeft: space( 1 ) }, { marginRight: space( 1 ) } )() }
`;

// 280px is the sidebar width.
// TODO: Remove this, @wordpress/components shouldn't care what a "sidebar" is.
export const Controls = styled.div< {
	__nextHasNoMarginBottom: boolean;
} >`
	max-width: calc( 280px - ${ space( 4 ) } * 2 );

	${ ( props ) =>
		! props.__nextHasNoMarginBottom && `margin-bottom: ${ space( 6 ) };` }
`;

export const ResetButton = styled( Button )`
	&&& {
		height: 30px;
	}
`;
