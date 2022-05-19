/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { rtl } from '../utils';

export const ZStackView = styled.div`
	display: flex;
	position: relative;
`;

export const ZStackChildView = styled.div< {
	isLayered: boolean;
	offsetAmount: number;
	zIndex: number;
} >`
	${ ( { isLayered, offsetAmount } ) =>
		isLayered
			? css( rtl( { marginLeft: offsetAmount } )() )
			: css( rtl( { right: offsetAmount * -1 } )() ) }

	${ ( { isLayered } ) =>
		isLayered ? positionAbsolute : positionRelative }

	${ ( { zIndex } ) => css( { zIndex } ) }
`;

const positionAbsolute = css`
	position: absolute;
`;

const positionRelative = css`
	position: relative;
`;
