/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

export const ZStackChildView = styled.div< {
	offsetAmount: number;
	zIndex: number;
} >`
	&:not( :first-of-type ) {
		${ ( { offsetAmount } ) =>
			css( {
				marginInlineStart: offsetAmount,
			} ) };
	}

	${ ( { zIndex } ) => css( { zIndex } ) };
`;

export const ZStackView = styled.div< {
	isLayered: boolean;
} >`
	display: inline-grid;
	grid-auto-flow: column;
	position: relative;

	& > ${ ZStackChildView } {
		position: relative;
		justify-self: start;

		${ ( { isLayered } ) =>
			isLayered
				? // When `isLayered` is true, all items overlap in the same grid cell
				  css( { gridRowStart: 1, gridColumnStart: 1 } )
				: undefined };
	}
`;
