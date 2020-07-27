/**
 * External dependencies
 */
import { css } from '@emotion/core';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { FlexItem } from '../../flex';
import { rtl } from '../../utils';

export const controlGroupStyles = ( { isFirst, isLast, isMiddle } ) => {
	if ( isFirst ) {
		return rtl( {
			borderBottomRightRadius: 0,
			borderTopRightRadius: 0,
		} );
	}
	if ( isMiddle ) {
		return css`
			border-radius: 0;
		`;
	}
	if ( isLast ) {
		return rtl( {
			borderBottomLeftRadius: 0,
			borderTopLeftRadius: 0,
		} );
	}
};

const itemStyles = ( { isFirst, isOnly } ) => {
	if ( isFirst || isOnly ) return '';

	return rtl( { marginLeft: -1 } );
};

export const ControlGroupItemView = styled( FlexItem )`
	${ itemStyles };
`;
