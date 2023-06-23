/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */

export const ZStackView = styled.div`
	display: inline-grid;
	grid-auto-flow: column;
	position: relative;
`;

export const ZStackChildView = styled.div< {
	isLayered: boolean;
	offsetAmount: number;
	zIndex: number;
} >`
	position: relative;

	${ ( { isLayered } ) =>
		isLayered
			? // When `isLayered` is true, all items overlap in the same grid cell
			  css( { gridRowStart: 1, gridColumnStart: 1 } )
			: undefined };

	&:not( :first-of-type ) {
		${ ( { offsetAmount } ) =>
			css( {
				marginInlineStart: offsetAmount,
			} ) };
	}

	${ ( { zIndex } ) => css( { zIndex } ) };
`;
