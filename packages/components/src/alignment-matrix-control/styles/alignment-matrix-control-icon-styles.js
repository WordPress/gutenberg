/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/core';

/**
 * Internal dependencies
 */
import {
	rootBase,
	pointBase,
	Cell as CellBase,
} from './alignment-matrix-control-styles';
import { color } from '../../utils/style-mixins';

const rootSize = ( { size } ) => {
	return css( {
		gridTemplateRows: `repeat( 3, calc( ${ size }px / 3))`,
		maxWidth: size,
	} );
};

export const Root = styled.div`
	width: 100%;

	${rootBase};
	${rootSize};
`;

const pointActive = ( { isActive } ) => {
	const boxShadow = isActive
		? `0 0 0 1px ${ color( 'blue.medium.focus' ) }`
		: null;
	const pointColor = isActive ? color( 'blue.medium.focus' ) : 'currentColor';

	return css`
		box-shadow: ${boxShadow};
		color: ${pointColor};

		*:hover > & {
			color: ${pointColor};
		}
	`;
};

export const Point = styled.span`
	height: 2px;
	width: 2px;
	${pointBase};
	${pointActive};
`;

export const Cell = CellBase;
