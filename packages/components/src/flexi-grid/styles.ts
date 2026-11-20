/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { Composite, CompositeRow, CompositeItem } from '../composite/v2';
import type { FlexiGridProps } from './types';

export const Grid = ( props: FlexiGridProps ) => styled( Composite )`
	display: grid;
	gap: ${ props.gap };
	column-gap: ${ props.columnGap };
	row-gap: ${ props.rowGap };
	grid-template-columns: repeat(
		auto-fill,
		minmax( ${ props.minCellWidth }, ${ props.maxCellWidth || '1fr' } )
	);
`;

export const Row = styled( CompositeRow )`
	display: contents;
`;

export const Cell = styled( CompositeItem )`
	display: grid;
	min-width: 10rem;
	min-height: 5em;
	align-items: center;
	justify-content: center;
	border: solid 1px #999;
	flex-grow: 1;
	flex-basis: calc( 25% - 1rem );
	box-sizing: border-box;
`;
